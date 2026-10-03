import http from 'http';
import app from '../src/app';
import { supabaseAdmin, supabaseClient } from '../src/config/supabase';

async function runPresentationApprovalTests() {
  console.log('=== CREDLINK PRESENTATION APPROVAL & REJECTION TEST SUITE ===\n');

  const server = http.createServer(app);
  const PORT = 5007;
  await new Promise<void>((resolve) => server.listen(PORT, resolve));
  const baseUrl = `http://localhost:${PORT}`;

  try {
    // Step 1: Login as Citizen (citizen@credlink.org)
    console.log('1. Logging in as citizen@credlink.org...');
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'citizen@credlink.org', password: 'Citizen@2025' }),
    });
    const loginData: any = await loginRes.json();
    if (!loginRes.ok || !loginData.success) {
      throw new Error(`Citizen login failed: ${JSON.stringify(loginData)}`);
    }

    const citizenToken = loginData.data.session.access_token;
    const citizenRefreshToken = loginData.data.session.refresh_token;
    const citizenId = loginData.data.user.id;
    console.log(`✓ Citizen login successful. User ID: ${citizenId}`);
    console.log(`✓ Access token acquired (${citizenToken.length} chars)`);

    // Step 2: Test Session Refresh (POST /api/auth/refresh)
    console.log('\n2. Testing session refresh endpoint (POST /api/auth/refresh)...');
    const refreshRes = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: citizenRefreshToken }),
    });
    const refreshData: any = await refreshRes.json();
    if (!refreshRes.ok || !refreshData.success) {
      throw new Error(`Session refresh failed: ${JSON.stringify(refreshData)}`);
    }
    const freshAccessToken = refreshData.data.session.access_token;
    console.log(`✓ Session successfully refreshed with valid new access token!`);

    // Step 3: Get or create organization for verification request
    console.log('\n3. Retrieving requesting organization...');
    const { data: orgs } = await supabaseAdmin.from('organizations').select('id, name, code').limit(1);
    const requestingOrg = orgs && orgs.length > 0 ? orgs[0] : null;
    if (!requestingOrg) {
      throw new Error('No organization found for testing');
    }
    console.log(`✓ Requesting Organization: ${requestingOrg.name} (${requestingOrg.id})`);

    // Retrieve existing credential with claims or create one
    const { data: existingCreds } = await supabaseAdmin
      .from('credentials')
      .select('id, title, credential_type, claims')
      .eq('subject_id', citizenId)
      .eq('status', 'VALID')
      .limit(1);

    let testCredId: string;
    let availableClaims: string[] = [];

    if (existingCreds && existingCreds.length > 0) {
      testCredId = existingCreds[0].id;
      const rawClaims = existingCreds[0].claims;
      if (Array.isArray(rawClaims)) {
        availableClaims = rawClaims.map((c: any) => c.key || c.label || String(c));
      } else if (rawClaims && typeof rawClaims === 'object') {
        availableClaims = Object.keys(rawClaims);
      }
      console.log(`✓ Using existing citizen credential: ${existingCreds[0].title} (${testCredId})`);
      console.log(`✓ Available Claims: ${availableClaims.join(', ')}`);
    } else {
      const { data: newCred, error: credErr } = await supabaseAdmin
        .from('credentials')
        .insert({
          subject_id: citizenId,
          issuer_org_id: requestingOrg.id,
          credential_type: 'National Identity Attestation',
          title: 'Citizen Identity Card',
          domain: 'citizen',
          claims: { full_name: 'Aarav Sharma', citizen_id: citizenId, status: 'Verified' },
          status: 'VALID',
          issuance_date: new Date().toISOString(),
        })
        .select()
        .single();
      if (credErr || !newCred) {
        throw new Error(`Failed to create test credential: ${credErr?.message}`);
      }
      testCredId = newCred.id;
      availableClaims = ['full_name', 'status'];
      console.log(`✓ Created test credential: ${newCred.title} (${testCredId})`);
    }

    const testRequestedClaims = availableClaims.slice(0, 2);

    // Step 4: Create a verification request
    console.log('\n4. Creating verification request...');
    const { data: consentReq, error: reqErr } = await supabaseAdmin
      .from('consents')
      .insert({
        citizen_id: citizenId,
        requesting_org_id: requestingOrg.id,
        credential_id: testCredId,
        domain: 'all',
        purpose: 'Identity verification for security clearance',
        requested_claims: testRequestedClaims,
        status: 'PENDING',
      })
      .select()
      .single();
    if (reqErr || !consentReq) {
      throw new Error(`Failed to create verification request: ${reqErr?.message}`);
    }
    console.log(`✓ Created request ID: ${consentReq.id}`);

    // Step 5: Test GET /api/presentations/requests/:id (200 OK)
    console.log('\n5. Testing GET /api/presentations/requests/:id...');
    const getRes = await fetch(`${baseUrl}/api/presentations/requests/${consentReq.id}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${freshAccessToken}` },
    });
    const getData: any = await getRes.json();
    console.log(`Status: ${getRes.status} (Expected: 200)`);
    if (!getRes.ok || !getData.success) {
      throw new Error(`GET /api/presentations/requests/:id failed: ${JSON.stringify(getData)}`);
    }
    console.log(`✓ Retrieved presentation request: Status = ${getData.data.status}, Purpose = ${getData.data.purpose}`);

    // Step 6: Test POST /api/presentations/requests/:id/respond (APPROVE & PRESENT)
    console.log('\n6. Testing POST /api/presentations/requests/:id/respond (Approve & Present)...');
    const approveRes = await fetch(`${baseUrl}/api/presentations/requests/${consentReq.id}/respond`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${freshAccessToken}`,
      },
      body: JSON.stringify({
        action: 'APPROVE',
        approvedClaims: testRequestedClaims,
      }),
    });
    const approveData: any = await approveRes.json();
    console.log(`Status: ${approveRes.status} (Expected: 200)`);
    if (!approveRes.ok || !approveData.success) {
      throw new Error(`Approve & Present failed: ${JSON.stringify(approveData)}`);
    }
    console.log(`✓ Approval response: ${approveData.message}`);
    console.log(`✓ Resulting Status: ${approveData.data.status}, Granted At: ${approveData.data.grantedAt}`);

    // Verify persisted status in database
    const { data: updatedReq } = await supabaseAdmin.from('consents').select('status, granted_at').eq('id', consentReq.id).single();
    if (updatedReq?.status !== 'APPROVED') {
      throw new Error(`Database status is not APPROVED: ${updatedReq?.status}`);
    }
    console.log(`✓ Authoritative DB state verified: status = ${updatedReq.status}`);

    // Step 7: Create a second request to test REJECTION
    console.log('\n7. Testing rejection workflow...');
    const { data: consentReq2 } = await supabaseAdmin
      .from('consents')
      .insert({
        citizen_id: citizenId,
        requesting_org_id: requestingOrg.id,
        credential_id: testCredId,
        domain: 'all',
        purpose: 'Loan application KYC compliance',
        requested_claims: testRequestedClaims,
        status: 'PENDING',
      })
      .select()
      .single();

    const rejectRes = await fetch(`${baseUrl}/api/presentations/requests/${consentReq2.id}/respond`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${freshAccessToken}`,
      },
      body: JSON.stringify({
        action: 'DENY',
      }),
    });
    const rejectData: any = await rejectRes.json();
    console.log(`Status: ${rejectRes.status} (Expected: 200)`);
    if (!rejectRes.ok || !rejectData.success) {
      throw new Error(`Reject failed: ${JSON.stringify(rejectData)}`);
    }
    console.log(`✓ Rejection response: ${rejectData.message}`);
    const { data: updatedReq2 } = await supabaseAdmin.from('consents').select('status').eq('id', consentReq2.id).single();
    if (updatedReq2?.status !== 'DENIED') {
      throw new Error(`Database status is not DENIED: ${updatedReq2?.status}`);
    }
    console.log(`✓ Authoritative DB state verified: status = ${updatedReq2.status}`);

    // Step 8: Verify that invalid/expired tokens are still rejected with 401
    console.log('\n8. Testing security: Invalid token rejection (Expected: 401)...');
    const badTokenRes = await fetch(`${baseUrl}/api/presentations/requests/${consentReq.id}/respond`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer invalid.expired.token',
      },
      body: JSON.stringify({ action: 'APPROVE' }),
    });
    const badTokenData: any = await badTokenRes.json();
    console.log(`Status: ${badTokenRes.status} (Expected: 401)`);
    console.log(`Error: "${badTokenData.error}"`);
    if (badTokenRes.status !== 401 || badTokenData.error !== 'Invalid, revoked, or expired authentication token') {
      throw new Error(`Security validation failed: expected 401 with exact message, got ${badTokenRes.status}`);
    }
    console.log(`✓ Invalid token correctly rejected with 401 and secure message.`);

    console.log('\n🎉 ALL PRESENTATION APPROVAL, REJECTION & AUTHENTICATION TESTS PASSED!');
  } finally {
    server.close();
  }
}

runPresentationApprovalTests().catch((err) => {
  console.error('\n❌ Test suite failed:', err);
  process.exit(1);
});
