import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createServerSupabase } from '@/lib/supabase/server'
import { z } from 'zod'

const createUserSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(8),
  name_en:  z.string().min(1),
  name_ar:  z.string().optional(),
  role_id:  z.string().uuid(),
})

async function requirePermission(permission: string) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: roles } = await supabase
    .from('user_roles')
    .select('role:roles(role_permissions(permission))')
    .eq('user_id', user.id)

  const permissions = (roles ?? []).flatMap((ur: any) =>
    ur.role?.role_permissions?.map((rp: any) => rp.permission) ?? []
  )

  if (!permissions.includes(permission)) return null
  return user
}

export async function GET() {
  const caller = await requirePermission('user.manage')
  if (!caller) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = await createServerSupabase()
  const { data: callerProfile } = await supabase
    .from('users').select('org_id').eq('id', caller.id).single()

  const { data, error } = await supabase
    .from('users')
    .select('id, email, name_en, name_ar, is_active, created_at, user_roles(role:roles(id, name))')
    .eq('org_id', callerProfile?.org_id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error }, { status: 400 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const caller = await requirePermission('user.manage')
  if (!caller) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const validated = createUserSchema.parse(body)

  const supabase = await createServerSupabase()
  const { data: callerProfile } = await supabase
    .from('users').select('org_id').eq('id', caller.id).single()
  const orgId = callerProfile?.org_id

  const { data: newUser, error } = await supabaseAdmin.auth.admin.createUser({
    email: validated.email,
    password: validated.password,
    email_confirm: true,
    user_metadata: { name_en: validated.name_en, name_ar: validated.name_ar },
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  await supabaseAdmin.from('users').insert({
    id:     newUser.user!.id,
    org_id: orgId,
    email:  validated.email,
    name_en: validated.name_en,
    name_ar: validated.name_ar,
  })

  await supabaseAdmin.from('user_roles').insert({
    user_id: newUser.user!.id,
    role_id: validated.role_id,
    org_id:  orgId,
    assigned_by: caller.id,
  })

  await supabaseAdmin.from('audit_events').insert({
    org_id:        orgId,
    actor_type:    'user',
    actor_id:      caller.id,
    action:        'create',
    resource_type: 'user',
    resource_id:   newUser.user!.id,
  })

  return NextResponse.json(
    { id: newUser.user!.id, email: validated.email, name_en: validated.name_en },
    { status: 201 }
  )
}
