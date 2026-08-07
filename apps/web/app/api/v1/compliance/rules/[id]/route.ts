import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { z } from 'zod'

const patchSchema = z.object({
  name_en:                  z.string().min(1).optional(),
  name_ar:                  z.string().min(1).optional(),
  description_en:           z.string().optional(),
  description_ar:           z.string().optional(),
  rule_type:                z.string().optional(),
  applies_to:               z.array(z.string()).optional(),
  condition_json:           z.record(z.unknown()).optional(),
  result_if_fail:           z.enum(['BLOCKED', 'WARNING', 'MANUAL_REVIEW']).optional(),
  source_url:               z.string().url().optional().or(z.literal('')),
  source_publication_date:  z.string().optional(),
  effective_from:           z.string().optional(),
  effective_until:          z.string().optional(),
  review_due_at:            z.string().optional(),
  status:                   z.enum(['active', 'inactive', 'draft']).optional(),
})

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('org_id').eq('id', user.id).single()
  const { data, error } = await supabase
    .from('compliance_rules')
    .select('*')
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
  const body = await request.json()
  const validated = patchSchema.parse(body)

  const { data: existing } = await supabase
    .from('compliance_rules').select('version').eq('id', (await params).id).single()

  const { data, error } = await supabase
    .from('compliance_rules')
    .update({ ...validated, version: (existing?.version ?? 1) + 1 })
    .eq('id', (await params).id)
    .eq('org_id', profile?.org_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error }, { status: 400 })

  await supabase.from('audit_events').insert({
    org_id: profile?.org_id, actor_type: 'user', actor_id: user.id,
    action: 'update', resource_type: 'compliance_rule', resource_id: (await params).id,
    new_values: validated,
  })

  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('org_id').eq('id', user.id).single()

  // Soft-delete: set status to inactive
  const { error } = await supabase
    .from('compliance_rules')
    .update({ status: 'inactive' })
    .eq('id', (await params).id)
    .eq('org_id', profile?.org_id)

  if (error) return NextResponse.json({ error }, { status: 400 })

  await supabase.from('audit_events').insert({
    org_id: profile?.org_id, actor_type: 'user', actor_id: user.id,
    action: 'deactivate', resource_type: 'compliance_rule', resource_id: (await params).id,
  })

  return NextResponse.json({ success: true })
}
