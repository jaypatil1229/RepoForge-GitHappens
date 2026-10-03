import { qrService } from '../src/services/qr.service';
import QRCode from 'qrcode';

async function runQrTests() {
  console.log('=== Running CredLink QR Validation & Payload Test Suite ===\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  // 1. Valid Consent Request QR Payload
  console.log('--- 1. Testing Valid Consent Request Payload ---');
  try {
    const validConsentPayload = JSON.stringify({
      v: 1,
      type: 'consent_request',
      id: 'a0000000-0000-0000-0000-000000000001',
      ts: Math.floor(Date.now() / 1000),
    });
    const parsed = qrService.parsePayload(validConsentPayload);
    assert(
      parsed.v === 1 && parsed.type === 'consent_request' && parsed.id === 'a0000000-0000-0000-0000-000000000001',
      'Test 1: Valid consent request payload successfully parsed'
    );
  } catch (err: any) {
    assert(false, `Test 1 failed with error: ${err.message}`);
  }

  // 2. Valid Credential QR Payload
  console.log('\n--- 2. Testing Valid Credential Payload ---');
  try {
    const validCredPayload = JSON.stringify({
      v: 1,
      type: 'credential',
      id: 'c0000000-0000-0000-0000-000000000002',
      ts: Math.floor(Date.now() / 1000) - 100,
    });
    const parsed = qrService.parsePayload(validCredPayload);
    assert(
      parsed.v === 1 && parsed.type === 'credential' && parsed.id === 'c0000000-0000-0000-0000-000000000002',
      'Test 2: Valid credential payload successfully parsed'
    );
  } catch (err: any) {
    assert(false, `Test 2 failed with error: ${err.message}`);
  }

  // 3. Reject Malformed JSON String
  console.log('\n--- 3. Testing Malformed JSON Rejection ---');
  try {
    qrService.parsePayload('not a json string at all');
    assert(false, 'Test 3: Should have thrown for malformed JSON');
  } catch (err: any) {
    assert(
      err.message.includes('not a valid JSON payload'),
      'Test 3: Malformed JSON correctly rejected with 400 error'
    );
  }

  // 4. Reject Non-Object JSON (Array or Primitive)
  console.log('\n--- 4. Testing Non-Object JSON Rejection ---');
  try {
    qrService.parsePayload('[1, 2, 3]');
    assert(false, 'Test 4: Should have thrown for array payload');
  } catch (err: any) {
    assert(
      err.message.includes('unexpected payload structure'),
      'Test 4: JSON array payload correctly rejected'
    );
  }

  // 5. Reject Unsupported Version
  console.log('\n--- 5. Testing Unsupported Version Rejection ---');
  try {
    qrService.parsePayload(JSON.stringify({
      v: 2,
      type: 'consent_request',
      id: 'a0000000-0000-0000-0000-000000000001',
      ts: Math.floor(Date.now() / 1000),
    }));
    assert(false, 'Test 5: Should have thrown for version 2');
  } catch (err: any) {
    assert(
      err.message.includes('Unsupported QR payload version'),
      'Test 5: Version mismatch correctly rejected'
    );
  }

  // 6. Reject Unsupported Type
  console.log('\n--- 6. Testing Unsupported Type Rejection ---');
  try {
    qrService.parsePayload(JSON.stringify({
      v: 1,
      type: 'unknown_type',
      id: 'a0000000-0000-0000-0000-000000000001',
      ts: Math.floor(Date.now() / 1000),
    }));
    assert(false, 'Test 6: Should have thrown for invalid type');
  } catch (err: any) {
    assert(
      err.message.includes('Unsupported QR payload type'),
      'Test 6: Invalid type correctly rejected'
    );
  }

  // 7. Reject Invalid UUID Format (Injection / SQL attempt)
  console.log('\n--- 7. Testing Invalid UUID Rejection ---');
  try {
    qrService.parsePayload(JSON.stringify({
      v: 1,
      type: 'consent_request',
      id: "'; DROP TABLE consents; --",
      ts: Math.floor(Date.now() / 1000),
    }));
    assert(false, 'Test 7: Should have thrown for non-UUID id');
  } catch (err: any) {
    assert(
      err.message.includes('missing or malformed resource ID'),
      'Test 7: SQL injection / invalid UUID in QR correctly rejected'
    );
  }

  // 8. Reject Expired QR Code (>30 days old)
  console.log('\n--- 8. Testing Expired Timestamp Rejection ---');
  try {
    qrService.parsePayload(JSON.stringify({
      v: 1,
      type: 'consent_request',
      id: 'a0000000-0000-0000-0000-000000000001',
      ts: Math.floor(Date.now() / 1000) - (86400 * 35), // 35 days ago
    }));
    assert(false, 'Test 8: Should have thrown for expired timestamp');
  } catch (err: any) {
    assert(
      err.message.includes('expired'),
      'Test 8: Stale/expired QR code correctly rejected'
    );
  }

  // 9. QR Code Generation Output Check
  console.log('\n--- 9. Testing QRCode Data URL Generation ---');
  try {
    const payload = {
      v: 1,
      type: 'consent_request' as const,
      id: 'a0000000-0000-0000-0000-000000000001',
      ts: Math.floor(Date.now() / 1000),
    };
    const dataUrl = await QRCode.toDataURL(JSON.stringify(payload), {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 300,
    });
    assert(
      typeof dataUrl === 'string' && dataUrl.startsWith('data:image/png;base64,'),
      'Test 9: QR data URL correctly generated with valid PNG base64 format'
    );
  } catch (err: any) {
    assert(false, `Test 9 failed: ${err.message}`);
  }

  console.log(`\n=== QR Test Summary: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) {
    process.exit(1);
  }
}

runQrTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
