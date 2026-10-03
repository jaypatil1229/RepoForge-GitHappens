import { supabaseClient } from '../src/config/supabase';

async function testAllCredentials() {
  const credentials = [
    { email: 'citizen@credlink.org', passwords: ['Citizen@2025', 'citizen@2025', 'citizen123', 'Password123!'] },
    { email: 'admin@credlink.org', passwords: ['CredLink@2025', 'admin123', 'Admin@2025'] },
    { email: 'college@credlink.org', passwords: ['college123', 'Education@2025'] },
    { email: 'hospital@credlink.org', passwords: ['healthcare123', 'Health@2025'] },
    { email: 'finance@credlink.org', passwords: ['finance123', 'Finance@2025'] },
    { email: 'employer@credlink.org', passwords: ['employer123', 'Employer@2025'] },
    { email: 'doctor@stjude.health', passwords: ['Health@2025', 'healthcare123'] },
    { email: 'dean@nit.edu', passwords: ['Education@2025', 'college123'] },
    { email: 'manager@apex.bank', passwords: ['Finance@2025', 'finance123'] },
    { email: 'hr@globaltech.corp', passwords: ['Employer@2025', 'employer123'] },
  ];

  console.log('Testing accounts in Supabase Auth...');
  for (const item of credentials) {
    let successPw: string | null = null;
    for (const pw of item.passwords) {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: item.email,
        password: pw,
      });
      if (!error && data.user) {
        successPw = pw;
        break;
      }
    }
    if (successPw) {
      console.log(`✅ ${item.email} -> password: "${successPw}"`);
    } else {
      console.log(`❌ ${item.email} -> NONE OF TESTED PASSWORDS MATCHED`);
    }
  }
}

testAllCredentials().catch(console.error);
