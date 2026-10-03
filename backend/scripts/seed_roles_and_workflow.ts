import { supabaseAdmin } from '../src/config/supabase';

async function seed() {
  console.log('Seeding role affiliations and demo entities...');

  // 1. Link dean@nit.edu (Prof. Rajesh Kumar) -> NIT (40f481fc-4c6e-483d-901c-8ddbb35052cc)
  const deanId = '268806cb-5921-44e8-a44f-53a017090552';
  const nitOrgId = '40f481fc-4c6e-483d-901c-8ddbb35052cc';
  await supabaseAdmin.from('profiles').update({ role: 'COLLEGE' }).eq('id', deanId);
  const { data: existingDeanMember } = await supabaseAdmin.from('organization_members').select('id').eq('user_id', deanId).eq('organization_id', nitOrgId);
  if (!existingDeanMember || existingDeanMember.length === 0) {
    await supabaseAdmin.from('organization_members').insert({
      organization_id: nitOrgId,
      user_id: deanId,
      member_role: 'ADMIN',
      status: 'ACTIVE'
    });
    console.log('Linked dean@nit.edu to NIT');
  }

  // 2. Link doctor@stjude.health -> AIIMS/Hospital (e00dc11c-6daa-4b7c-8846-ce1fbf564700)
  const doctorId = 'e3bbb4bd-03bb-4afd-ba2d-b2d0152a3eb5';
  const hospitalOrgId = 'e00dc11c-6daa-4b7c-8846-ce1fbf564700';
  await supabaseAdmin.from('profiles').update({ role: 'HOSPITAL' }).eq('id', doctorId);
  const { data: existingDocMember } = await supabaseAdmin.from('organization_members').select('id').eq('user_id', doctorId).eq('organization_id', hospitalOrgId);
  if (!existingDocMember || existingDocMember.length === 0) {
    await supabaseAdmin.from('organization_members').insert({
      organization_id: hospitalOrgId,
      user_id: doctorId,
      member_role: 'ADMIN',
      status: 'ACTIVE'
    });
    console.log('Linked doctor@stjude.health to Hospital');
  }

  // 3. Link hr@globaltech.corp -> TechCorp Employer (c98a4006-780d-4a04-a4fd-1d707bb01bd3)
  const hrId = '32d63797-95c7-4fbd-9603-468ebffd83ce';
  const employerOrgId = 'c98a4006-780d-4a04-a4fd-1d707bb01bd3';
  await supabaseAdmin.from('profiles').update({ role: 'EMPLOYER' }).eq('id', hrId);
  const { data: existingHrMember } = await supabaseAdmin.from('organization_members').select('id').eq('user_id', hrId).eq('organization_id', employerOrgId);
  if (!existingHrMember || existingHrMember.length === 0) {
    await supabaseAdmin.from('organization_members').insert({
      organization_id: employerOrgId,
      user_id: hrId,
      member_role: 'ADMIN',
      status: 'ACTIVE'
    });
    console.log('Linked hr@globaltech.corp to Employer');
  }

  // 4. Link manager@apex.bank -> Apex Bank / Trust (43bd92eb-be42-4262-b932-55cc94bede40)
  const managerId = 'ce523661-0e79-4c82-a114-d3c8d02cfec0';
  const bankOrgId = '43bd92eb-be42-4262-b932-55cc94bede40';
  await supabaseAdmin.from('profiles').update({ role: 'BANK' }).eq('id', managerId);
  const { data: existingMgrMember } = await supabaseAdmin.from('organization_members').select('id').eq('user_id', managerId).eq('organization_id', bankOrgId);
  if (!existingMgrMember || existingMgrMember.length === 0) {
    await supabaseAdmin.from('organization_members').insert({
      organization_id: bankOrgId,
      user_id: managerId,
      member_role: 'ADMIN',
      status: 'ACTIVE'
    });
    console.log('Linked manager@apex.bank to Bank/Trust');
  }

  // 5. Ensure secondary student citizen exists: student@nit.edu (Rohan Verma)
  const { data: existingStudentAuth } = await supabaseAdmin.auth.admin.listUsers();
  const studentUser = existingStudentAuth?.users?.find(u => u.email === 'student@nit.edu');
  if (!studentUser) {
    const { data: createdAuth, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email: 'student@nit.edu',
      password: 'Citizen@2025',
      email_confirm: true,
      user_metadata: { full_name: 'Rohan Verma', role: 'CITIZEN' }
    });
    if (createdAuth?.user) {
      await supabaseAdmin.from('profiles').upsert({
        id: createdAuth.user.id,
        email: 'student@nit.edu',
        full_name: 'Rohan Verma',
        role: 'CITIZEN',
        account_status: 'ACTIVE'
      });
      console.log('Created student@nit.edu account');
    }
  }

  // 6. Ensure at least one pending organization exists for Super Admin to review
  const { data: pendingOrgs } = await supabaseAdmin.from('organizations').select('id, name').eq('verification_status', 'PENDING');
  if (!pendingOrgs || pendingOrgs.length === 0) {
    await supabaseAdmin.from('organizations').insert({
      name: 'St. Xavier Institute of Technology',
      code: 'SXIT-2026',
      domain: 'college',
      did: 'did:credlink:org:sxit-2026',
      verification_status: 'PENDING',
      is_issuer: false,
      authorized_credential_types: ['Bachelor of Engineering', 'Academic Transcript', 'Grade Card']
    });
    console.log('Created pending organization application for Super Admin review');
  }

  console.log('Seeding completed successfully!');
}

seed().catch(console.error);
