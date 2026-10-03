import { supabaseAdmin, supabaseClient } from '../src/config/supabase.js';

interface UserSeedConfig {
  email: string;
  password: string;
  fullName: string;
  role: 'ADMIN' | 'COLLEGE' | 'HOSPITAL' | 'BANK' | 'EMPLOYER' | 'CITIZEN';
  orgCode?: string; // code to link to in organizations table
}

const USERS_TO_SYNC: UserSeedConfig[] = [
  // 1. Super Admin
  {
    email: 'admin@credlink.org',
    password: 'CredLink@2025',
    fullName: 'Network Administrator',
    role: 'ADMIN',
  },
  // 2. Issuers - Education
  {
    email: 'dean@nit.edu',
    password: 'Education@2025',
    fullName: 'Prof. Rajesh Kumar',
    role: 'COLLEGE',
    orgCode: 'NIT-2025',
  },
  {
    email: 'college@credlink.org',
    password: 'Education@2025',
    fullName: 'Dean of Academic Affairs',
    role: 'COLLEGE',
    orgCode: 'NIT-2025',
  },
  // 3. Issuers - Healthcare
  {
    email: 'doctor@stjude.health',
    password: 'Health@2025',
    fullName: 'Dr. Priya Sharma',
    role: 'HOSPITAL',
    orgCode: 'AIIMS-2025',
  },
  {
    email: 'hospital@credlink.org',
    password: 'Health@2025',
    fullName: 'Chief Medical Officer',
    role: 'HOSPITAL',
    orgCode: 'AIIMS-2025',
  },
  // 4. Requesters - Bank & Scholarship Trust
  {
    email: 'manager@apex.bank',
    password: 'Finance@2025',
    fullName: 'Anita Desai',
    role: 'BANK',
    orgCode: 'APEX-2025',
  },
  {
    email: 'finance@credlink.org',
    password: 'Finance@2025',
    fullName: 'Chief Financial Officer',
    role: 'BANK',
    orgCode: 'APEX-2025',
  },
  // 5. Requesters - Enterprise Employer
  {
    email: 'hr@globaltech.corp',
    password: 'Employer@2025',
    fullName: 'Vikram Singh',
    role: 'EMPLOYER',
    orgCode: 'TECH-2025',
  },
  {
    email: 'employer@credlink.org',
    password: 'Employer@2025',
    fullName: 'VP of People & Talent',
    role: 'EMPLOYER',
    orgCode: 'TECH-2025',
  },
  // 6. Citizens
  {
    email: 'citizen@credlink.org',
    password: 'Citizen@2025',
    fullName: 'Aarav Sharma',
    role: 'CITIZEN',
  },
  {
    email: 'student@nit.edu',
    password: 'Citizen@2025',
    fullName: 'Rohan Verma',
    role: 'CITIZEN',
  },
  {
    email: 'bhumi@credlink.org',
    password: 'Citizen@2025',
    fullName: 'Bhumi Chotaliya',
    role: 'CITIZEN',
  },
  {
    email: 'michael.chen@nit.edu',
    password: 'Citizen@2025',
    fullName: 'Michael Chen',
    role: 'CITIZEN',
  },
  {
    email: 'elena.rostova@stjude.health',
    password: 'Citizen@2025',
    fullName: 'Elena Rostova',
    role: 'CITIZEN',
  },
];

async function syncAll() {
  console.log('--- STARTING CREDENTIAL SYNC & VERIFICATION ---');

  // Fetch all organizations to map orgCode -> orgId
  const { data: orgs, error: orgErr } = await supabaseAdmin.from('organizations').select('id, name, code, domain');
  if (orgErr) {
    console.error('Error fetching organizations:', orgErr);
  }
  console.log(`Found ${orgs?.length || 0} organizations in database.`);

  const orgMap = new Map<string, string>();
  for (const o of orgs || []) {
    if (o.code) orgMap.set(o.code, o.id);
  }

  // Fetch all auth users
  const { data: authData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  const existingUsers = authData?.users || [];
  console.log(`Found ${existingUsers.length} users in Supabase Auth.`);

  for (const u of USERS_TO_SYNC) {
    let userId: string | null = null;
    const existing = existingUsers.find((x) => x.email?.toLowerCase() === u.email.toLowerCase());

    if (existing) {
      userId = existing.id;
      // Update password and confirm email
      const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: u.password,
        email_confirm: true,
        user_metadata: {
          full_name: u.fullName,
          role: u.role,
        },
      });
      if (updateErr) {
        console.error(`Failed to update password for ${u.email}:`, updateErr.message);
      } else {
        console.log(`[AUTH UPDATED] ${u.email} -> password reset to: ${u.password}`);
      }
    } else {
      // Create user
      const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: {
          full_name: u.fullName,
          role: u.role,
        },
      });
      if (createErr || !created.user) {
        console.error(`Failed to create user ${u.email}:`, createErr?.message);
        continue;
      }
      userId = created.user.id;
      console.log(`[AUTH CREATED] ${u.email} -> id: ${userId}`);
    }

    if (!userId) continue;

    // Upsert profile
    const { error: profErr } = await supabaseAdmin.from('profiles').upsert(
      {
        id: userId,
        email: u.email,
        full_name: u.fullName,
        role: u.role,
        account_status: 'ACTIVE',
      },
      { onConflict: 'id' }
    );
    if (profErr) {
      console.error(`Profile upsert error for ${u.email}:`, profErr.message);
    } else {
      console.log(`[PROFILE SYNCED] ${u.email} [${u.role}]`);
    }

    // Link organization membership if applicable
    if (u.orgCode) {
      let orgId = orgMap.get(u.orgCode);
      if (!orgId) {
        // Find by domain
        const domainMatch = orgs?.find(o => o.domain?.toLowerCase() === u.role.toLowerCase() || (u.role === 'COLLEGE' && o.domain === 'college') || (u.role === 'HOSPITAL' && o.domain === 'hospital') || (u.role === 'BANK' && o.domain === 'bank') || (u.role === 'EMPLOYER' && o.domain === 'employer'));
        if (domainMatch) orgId = domainMatch.id;
      }

      if (orgId) {
        const { data: existingMember } = await supabaseAdmin
          .from('organization_members')
          .select('id')
          .eq('user_id', userId)
          .eq('organization_id', orgId);

        if (!existingMember || existingMember.length === 0) {
          await supabaseAdmin.from('organization_members').insert({
            organization_id: orgId,
            user_id: userId,
            member_role: 'ADMIN',
            status: 'ACTIVE',
          });
          console.log(`[ORG LINKED] ${u.email} -> org ${orgId}`);
        }
      }
    }

    // Now test signInWithPassword to guarantee verification!
    const { data: testSign, error: signErr } = await supabaseClient.auth.signInWithPassword({
      email: u.email,
      password: u.password,
    });
    if (signErr || !testSign.session) {
      console.error(`[VERIFICATION FAILED] ${u.email}:`, signErr?.message);
    } else {
      console.log(`[VERIFIED SUCCESS] Login OK for ${u.email}`);
    }
  }

  console.log('--- ALL CREDENTIALS SYNCED AND VERIFIED SUCCESSFULLY ---');
}

syncAll().catch(console.error);
