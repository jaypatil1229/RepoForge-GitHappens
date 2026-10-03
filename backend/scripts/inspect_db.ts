import { supabaseAdmin } from '../src/config/supabase';

async function run() {
  const { data: profiles, error: pErr } = await supabaseAdmin.from('profiles').select('id, email, full_name, role');
  console.log('PROFILES:', JSON.stringify(profiles, null, 2));
  const { data: members, error: mErr } = await supabaseAdmin.from('organization_members').select('*');
  console.log('MEMBERS:', JSON.stringify(members, null, 2));
  process.exit(0);
}

run();
