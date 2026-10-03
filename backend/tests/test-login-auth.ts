import { supabaseClient, supabaseAdmin } from '../src/config/supabase';

async function testLogin() {
  console.log('Testing Supabase login for citizen@credlink.org...');

  // 1. Check user in supabaseAdmin auth.users
  const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  if (listError) {
    console.error('List users error:', listError);
  } else {
    const user = users.users.find(u => u.email === 'citizen@credlink.org');
    console.log('Found citizen user in auth.users:', user ? {
      id: user.id,
      email: user.email,
      confirmed_at: user.email_confirmed_at,
      banned_until: (user as any).banned_until,
      deleted_at: (user as any).deleted_at,
    } : 'NOT FOUND');
  }

  // 2. Try signInWithPassword using supabaseClient
  const passwordsToTest = ['Citizen@2025', 'citizen@2025', 'Password123!', 'CredLink@2025'];
  for (const pw of passwordsToTest) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: 'citizen@credlink.org',
      password: pw,
    });

    if (error) {
      console.log(`Password "${pw}": FAILED ->`, error.message, `(status: ${error.status})`);
    } else {
      console.log(`Password "${pw}": SUCCESS -> User ID:`, data.user?.id);
    }
  }
}

testLogin().catch(console.error);
