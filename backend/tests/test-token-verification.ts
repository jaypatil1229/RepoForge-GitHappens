import { supabaseClient, supabaseAdmin } from '../src/config/supabase';

async function testTokenVerification() {
  console.log('Logging in citizen@credlink.org...');
  const { data: loginData, error: loginError } = await supabaseClient.auth.signInWithPassword({
    email: 'citizen@credlink.org',
    password: 'Citizen@2025',
  });

  if (loginError || !loginData.session) {
    console.error('Login failed:', loginError);
    return;
  }

  const { access_token, refresh_token } = loginData.session;
  console.log('Login succeeded. Access token length:', access_token.length);

  // Test 1: getUser with valid access_token
  const res1 = await supabaseAdmin.auth.getUser(access_token);
  console.log('Test 1 (valid access_token): error =', res1.error?.message, 'user =', res1.data?.user?.email);

  // Test 2: getUser with refresh_token (what happens if refresh_token is passed as Bearer token?)
  const res2 = await supabaseAdmin.auth.getUser(refresh_token);
  console.log('Test 2 (refresh_token as Bearer): error =', res2.error?.message, 'status =', (res2.error as any)?.status);

  // Test 3: Can we refresh session with refresh_token?
  const res3 = await supabaseClient.auth.refreshSession({ refresh_token });
  console.log('Test 3 (refreshSession with refresh_token): error =', res3.error?.message, 'new access_token =', !!res3.data?.session?.access_token);

  // Test 4: Can supabaseAdmin refresh session or getUser?
  const res4 = await supabaseAdmin.auth.refreshSession({ refresh_token });
  console.log('Test 4 (admin refreshSession): error =', res4.error?.message, 'new access_token =', !!res4.data?.session?.access_token);
}

testTokenVerification().catch(console.error);
