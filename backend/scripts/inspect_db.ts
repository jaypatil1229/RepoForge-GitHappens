import { supabaseAdmin } from '../src/config/supabase.js';

async function main() {
  const { data: creds } = await supabaseAdmin
    .from('credentials')
    .select('id, title, credential_type, subject_id, issuer_org_id, status, claims');
  console.log('=== CREDENTIALS in DB (' + (creds?.length || 0) + '):');
  for (const c of creds || []) {
    console.log(`- [${c.status}] ${c.id}: "${c.title}" (${c.credential_type}) subject=${c.subject_id} issuer_org=${c.issuer_org_id}`);
  }

  const { data: consents } = await supabaseAdmin
    .from('consents')
    .select('id, citizen_id, requesting_org_id, credential_id, status, purpose, approved_claims, requested_claims, created_at, granted_at')
    .order('created_at', { ascending: false })
    .limit(10);
  console.log('=== LATEST 10 CONSENTS:');
  for (const cs of consents || []) {
    console.log(`- [${cs.status}] consent=${cs.id} citizen=${cs.citizen_id} org=${cs.requesting_org_id} cred=${cs.credential_id} purpose="${cs.purpose}"`);
  }

  const { data: profiles } = await supabaseAdmin.from('profiles').select('id, email, full_name, role');
  console.log('=== PROFILES:');
  for (const p of profiles || []) {
    console.log(`- [${p.role}] ${p.id}: ${p.email} (${p.full_name})`);
  }

  const { data: authData } = await supabaseAdmin.auth.admin.listUsers();
  console.log('=== AUTH USERS in Supabase Auth (' + (authData?.users?.length || 0) + '):');
  for (const u of authData?.users || []) {
    console.log(`- ${u.email} | id: ${u.id} | created_at: ${u.created_at}`);
  }
}

main().catch(console.error);
