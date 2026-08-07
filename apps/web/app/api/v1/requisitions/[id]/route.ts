import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { z } from 'zod'

const patchSchema = z.object({
  title_en:             z.string().min(1).optional(),
  title_ar:             z.string().optional(),
  department_id:        z.string().uuid().optional().nullable(),
  establishment_id:     z.string().uuid().optional().nullable(),
  headcount:            z.number().int().min(1).optional(),
  employment_type:      z.enum(['full_time','part_time','contract','internship']).optional(),
  nationality_pref:     z.enum(['saudi','non_saudi','any']).optional().nullable(),
  min_experience_years: z.number().int().min(0).optional().nullable(),
  education_level:      z.string().optional().nullable(),
  salary_min:           z.number().optional().nullable(),
  salary_max:           z.number().optional().nullable(),
  budget_approved:      z.boolean().optional(),
  justification_en:     z.string().optional(),
  justification_ar:     z.string().optional(),
  target_hire_date:     z.string().optional().nullable(),
})

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('org_id').eq('id', user.id).single()
  const { data, error } = await supabase
    .from('job_requisitions')
    .select(`
      *,
      department:departments(id, name_en, name_ar),
      establishment:establishments(id, name_en, name_ar),
      creator:users!created_by(id, name_en, name_ar)
    `)
    .eq('id', (await params).id)
    .eq('org_id', profile?.org_id)
    .single()

  if (error) return NextResponse.json({ error }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('org_id').eq('id', user.id).single()
  const { data: existing } = await supabase
    .from('job_requisitions').select('version, status').eq('id', (await params).id).single()

  if (existing?.status === 'approved') {
    return NextResponse.json({ error: 'Cannot edit an approved requisition' }, { status: 400 })
  }

  const body = await request.json()
  const validated = patchSchema.parse(body)
  const newVersion = (existing?.version ?? 1) + 1

  // Save snapshot before update
  await supabase.from('requisition_versions').insert({
    requisition_id: (await params).id,
    version: existing?.version ?? 1,
    snapshot: existing,
    changed_by: user.id,
  })

  const { data, error } = await supabase
    .from('job_requisitions')
    .update({ ...validated, version: newVersion, updated_by: user.id })
    .eq('id', (await params).id)
    .eq('org_id', profile?.org_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error }, { status: 400 })

  await supabase.from('audit_events').insert({
    org_id: profile?.org_id, actor_type: 'user', actor_id: user.id,
    action: 'update', resource_type: 'requisition', resource_id: (await params).id,
    new_values: validated,
  })

  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('org_id').eq('id', user.id).single()
  const { data: existing } = await supabase
    .from('job_requisitions').select('status').eq('id', (await params).id).single()

  if (!['draft', 'rejected'].includes(existing?.status ?? '')) {
    return NextResponse.json({ error: 'Only draft or rejected requisitions can be deleted' }, { status: 400 })
  }

  const { error } = await supabase
    .from('job_requisitions')
    .update({ status: 'cancelled' })
    .eq('id', (await params).id)
    .eq('org_id', profile?.org_id)

  if (error) return NextResponse.json({ error }, { status: 400 })

  await supabase.from('audit_events').insert({
    org_id: profile?.org_id, actor_type: 'user', actor_id: user.id,
    action: 'cancel', resource_type: 'requisition', resource_id: (await params).id,
  })

  return NextResponse.json({ success: true })
}
