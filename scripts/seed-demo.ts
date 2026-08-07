/**
 * Demo seed script — creates demo users in Supabase Auth + profiles + role assignments.
 * Run: pnpm db:seed
 * Requires: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY)

const ORG_ID = '00000000-0000-0000-0000-000000000001'

const DEMO_USERS: Array<{
  email: string
  password: string
  name_en: string
  name_ar: string
  role_name: string
}> = [
  {
    email:     'admin@demo.chessboard',
    password:  'Demo@Admin1',
    name_en:   'Platform Admin',
    name_ar:   'مدير المنصة',
    role_name: 'platform_admin',
  },
  {
    email:     'sara@demo.chessboard',
    password:  'Demo@HR1234',
    name_en:   'Sara Al-Otaibi',
    name_ar:   'سارة العتيبي',
    role_name: 'hr_manager',
  },
  {
    email:     'ahmed@demo.chessboard',
    password:  'Demo@Rec1234',
    name_en:   'Ahmed Al-Rashid',
    name_ar:   'أحمد الراشد',
    role_name: 'recruiter',
  },
  {
    email:     'mohamed@demo.chessboard',
    password:  'Demo@Cmp1234',
    name_en:   'Mohamed Hassan',
    name_ar:   'محمد حسن',
    role_name: 'compliance_officer',
  },
  {
    email:     'nora@demo.chessboard',
    password:  'Demo@Gov1234',
    name_en:   'Nora Al-Qahtani',
    name_ar:   'نورة القحطاني',
    role_name: 'government_relations',
  },
  {
    email:     'khalid@demo.chessboard',
    password:  'Demo@Hm1234!',
    name_en:   'Khalid Al-Mansour',
    name_ar:   'خالد المنصور',
    role_name: 'hiring_manager',
  },
]

async function getRoleId(name: string): Promise<string | null> {
  const { data } = await admin
    .from('roles')
    .select('id')
    .eq('org_id', ORG_ID)
    .eq('name', name)
    .single()
  return data?.id ?? null
}

async function userExists(email: string): Promise<boolean> {
  const { data } = await admin.auth.admin.listUsers()
  return data.users.some(u => u.email === email)
}

async function seedUser(u: typeof DEMO_USERS[0]) {
  console.log(`  → ${u.name_en} (${u.email})`)

  if (await userExists(u.email)) {
    console.log(`    already exists, skipping`)
    return
  }

  const { data: authUser, error } = await admin.auth.admin.createUser({
    email:          u.email,
    password:       u.password,
    email_confirm:  true,
    user_metadata:  { name_en: u.name_en, name_ar: u.name_ar },
  })

  if (error) {
    console.error(`    ✗ Auth error: ${error.message}`)
    return
  }

  const userId = authUser.user!.id

  const { error: profileErr } = await admin.from('users').insert({
    id:      userId,
    org_id:  ORG_ID,
    email:   u.email,
    name_en: u.name_en,
    name_ar: u.name_ar,
  })
  if (profileErr) {
    console.error(`    ✗ Profile error: ${profileErr.message}`)
    return
  }

  const roleId = await getRoleId(u.role_name)
  if (!roleId) {
    console.error(`    ✗ Role not found: ${u.role_name}`)
    return
  }

  const { error: roleErr } = await admin.from('user_roles').insert({
    user_id: userId,
    role_id: roleId,
    org_id:  ORG_ID,
  })
  if (roleErr) {
    console.error(`    ✗ Role assign error: ${roleErr.message}`)
    return
  }

  console.log(`    ✓ created with role: ${u.role_name}`)
}

async function main() {
  console.log('\n🌱  Seeding demo users...\n')

  for (const u of DEMO_USERS) {
    await seedUser(u)
  }

  console.log('\n📋  Demo credentials:\n')
  console.log('  Role              | Email                       | Password')
  console.log('  ─────────────────────────────────────────────────────────')
  for (const u of DEMO_USERS) {
    console.log(`  ${u.role_name.padEnd(18)}| ${u.email.padEnd(28)}| ${u.password}`)
  }
  console.log('\n✅  Seed complete.\n')
}

main().catch(err => { console.error(err); process.exit(1) })
