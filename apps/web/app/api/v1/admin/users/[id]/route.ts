import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createServerSupabase } from '@/lib/supabase/server'
import { z } from 'zod'

const updateSchema = z.object({
  name_en:   z.string().min(1).optional(),
  name_ar:   z.string().optional(),
  is_active: z.boolean().optional(),
  role_id:   z.string().uuid().optional(),
})

async function getCallerWithPermission(permission: string) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: roles } = await supabase
    .from('user_roles')
    .select('role:roles(role_permissions(permission))')
    .eq('user_id', user.id)

  const perms = (roles ?? []).flatMap((ur: any) =>
    ur.role?.role_permissions?.map((rp: any) => rp.permission) ?? []
  )
  if (!perms.includes(permission)) return null
  return { user, supabase }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getCallerWithPermission('user.manage')
  if (!ctx) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { user, supabase } = ctx

  const body = await request.json()
  const { role_id, ...profileData } = updateSchema.parse(body)

  const { data: callerProfile } = await supabase
    .from('users').select('org_id').eq('id', user.id).single()
  const orgId = callerProfile?.org_id

  if (Object.keys(profileData).length > 0) {
    await supabaseAdmin
      .from('users')
      .update(profileData)
      .eq('id', (await params).id)
      .eq('org_id', orgId)

    if (profileData.is_active === false) {
      await supabaseAdmin.auth.admin.updateUserById((await params).id, { ban_duration: '87600h' })
    } else if (profileData.is_active === true) {
      await supabaseAdmin.auth.admin.updateUserById((await params).id, { ban_duration: 'none' })
    }
  }

  if (role_id) {
    await supabaseAdmin.from('user_roles').delete().eq('user_id', (await params).id).eq('org_id', orgId)
    await supabaseAdmin.from('user_roles').insert({
      user_id: (await params).id, role_id, org_id: orgId, assigned_by: user.id,
    })
  }

  await supabaseAdmin.from('audit_events').insert({
    org_id: orgId, actor_type: 'user', actor_id: user.id,
    action: 'update', resource_type: 'user', resource_id: (await params).id,
  })

  const { data } = await supabase
    .from('users')
    .select('id, email, name_en, name_ar, is_active, created_at, user_roles(role:roles(id, name))')
    .eq('id', (await params).id)
    .single()

  return NextResponse.json(data)
}
