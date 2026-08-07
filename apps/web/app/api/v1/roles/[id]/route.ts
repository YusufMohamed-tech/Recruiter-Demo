import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { z } from 'zod'

const ALL_PERMISSIONS = [
  'user.manage', 'role.manage', 'org.manage',
  'requisition.manage', 'job.manage',
  'candidate.manage', 'candidate.view_sensitive',
  'application.manage', 'offer.manage',
  'compliance.manage', 'readiness.manage',
  'analytics.view', 'audit.view',
] as const

const updateSchema = z.object({
  name:        z.string().min(1).optional(),
  description: z.string().optional(),
  permissions: z.array(z.enum(ALL_PERMISSIONS)).optional(),
})

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('org_id').eq('id', user.id).single()
  const body = await request.json()
  const { permissions, ...roleData } = updateSchema.parse(body)

  if (Object.keys(roleData).length > 0) {
    const { error } = await supabase
      .from('roles')
      .update(roleData)
      .eq('id', id)
      .eq('org_id', profile?.org_id)
      .eq('is_system', false)
    if (error) return NextResponse.json({ error }, { status: 400 })
  }

  if (permissions !== undefined) {
    await supabase.from('role_permissions').delete().eq('role_id', id)
    if (permissions.length > 0) {
      await supabase.from('role_permissions').insert(
        permissions.map(p => ({ role_id: id, permission: p }))
      )
    }
  }

  const { data } = await supabase
    .from('roles')
    .select('*, role_permissions(permission)')
    .eq('id', id)
    .single()

  return NextResponse.json(data)
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('org_id').eq('id', user.id).single()

  const { error } = await supabase
    .from('roles')
    .delete()
    .eq('id', (await params).id)
    .eq('org_id', profile?.org_id)
    .eq('is_system', false)

  if (error) return NextResponse.json({ error }, { status: 400 })
  return NextResponse.json({ success: true })
}
