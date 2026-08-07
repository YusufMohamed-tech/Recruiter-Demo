import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createServerSupabase } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  new_password: z.string().min(8),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerSupabase()
  const { data: { user: caller } } = await supabase.auth.getUser()
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: roles } = await supabase
    .from('user_roles')
    .select('role:roles(role_permissions(permission))')
    .eq('user_id', caller.id)

  const permissions = (roles ?? []).flatMap((ur: any) =>
    ur.role?.role_permissions?.map((rp: any) => rp.permission) ?? []
  )

  if (!permissions.includes('user.manage')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { new_password } = schema.parse(body)

  const { error } = await supabaseAdmin.auth.admin.updateUserById((await params).id, {
    password: new_password,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  const { data: callerProfile } = await supabase
    .from('users').select('org_id').eq('id', caller.id).single()

  await supabaseAdmin.from('audit_events').insert({
    org_id:        callerProfile?.org_id,
    actor_type:    'user',
    actor_id:      caller.id,
    action:        'password_reset',
    resource_type: 'user',
    resource_id:   (await params).id,
  })

  return NextResponse.json({ success: true })
}
