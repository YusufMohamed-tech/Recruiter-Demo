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

const createRoleSchema = z.object({
  name:        z.string().min(1),
  description: z.string().optional(),
  permissions: z.array(z.enum(ALL_PERMISSIONS)),
})

export async function GET() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('org_id').eq('id', user.id).single()
  const { data, error } = await supabase
    .from('roles')
    .select('*, role_permissions(permission)')
    .eq('org_id', profile?.org_id)
    .order('is_system', { ascending: false })
    .order('name')

  if (error) return NextResponse.json({ error }, { status: 400 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('org_id').eq('id', user.id).single()
  const body = await request.json()
  const { permissions, ...roleData } = createRoleSchema.parse(body)

  const { data: role, error } = await supabase
    .from('roles')
    .insert({ ...roleData, org_id: profile?.org_id })
    .select()
    .single()

  if (error) return NextResponse.json({ error }, { status: 400 })

  if (permissions.length > 0) {
    await supabase.from('role_permissions').insert(
      permissions.map(p => ({ role_id: role.id, permission: p }))
    )
  }

  return NextResponse.json(role, { status: 201 })
}
