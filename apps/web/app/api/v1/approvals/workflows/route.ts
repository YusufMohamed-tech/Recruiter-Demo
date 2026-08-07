import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { z } from 'zod'

const stepSchema = z.object({
  step_order:      z.number().int().min(1),
  step_name:       z.string().min(1),
  approver_type:   z.enum(['user', 'role']).default('user'),
  approver_id:     z.string().uuid().optional().nullable(),
  approver_role_id: z.string().uuid().optional().nullable(),
  approval_mode:   z.enum(['any_one', 'majority', 'all']).default('any_one'),
  sla_hours:       z.number().int().min(1).default(48),
})

const createSchema = z.object({
  name:          z.string().min(1),
  resource_type: z.enum(['requisition', 'offer', 'override']),
  is_active:     z.boolean().default(true),
  steps:         z.array(stepSchema).min(1),
})

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('org_id').eq('id', user.id).single()
  const { searchParams } = new URL(request.url)
  const resourceType = searchParams.get('resource_type')

  let query = supabase
    .from('approval_workflows')
    .select('*, steps:approval_workflow_steps(*)')
    .eq('org_id', profile?.org_id)
    .order('created_at', { ascending: false })

  if (resourceType) query = query.eq('resource_type', resourceType)

  const { data, error } = await query
  if (error) return NextResponse.json({ error }, { status: 400 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('org_id').eq('id', user.id).single()
  const body = await request.json()
  const { steps, ...wf } = createSchema.parse(body)

  // Deactivate existing workflows for same resource_type if this one is active
  if (wf.is_active) {
    await supabase
      .from('approval_workflows')
      .update({ is_active: false })
      .eq('org_id', profile?.org_id)
      .eq('resource_type', wf.resource_type)
  }

  const { data, error } = await supabase
    .from('approval_workflows')
    .insert({ ...wf, org_id: profile?.org_id, created_by: user.id })
    .select().single()

  if (error) return NextResponse.json({ error }, { status: 400 })

  await supabase.from('approval_workflow_steps').insert(
    steps.map(s => ({ ...s, workflow_id: data.id }))
  )

  await supabase.from('audit_events').insert({
    org_id: profile?.org_id, actor_type: 'user', actor_id: user.id,
    action: 'create', resource_type: 'approval_workflow', resource_id: data.id,
    new_values: { name: data.name, resource_type: data.resource_type },
  })

  return NextResponse.json(data, { status: 201 })
}
