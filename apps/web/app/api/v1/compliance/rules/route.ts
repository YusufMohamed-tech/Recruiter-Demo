import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  code:                     z.string().min(1),
  name_en:                  z.string().min(1),
  name_ar:                  z.string().min(1),
  description_en:           z.string().optional(),
  description_ar:           z.string().optional(),
  rule_type:                z.string().min(1),
  applies_to:               z.array(z.string()),
  condition_json:           z.record(z.unknown()),
  result_if_fail:           z.enum(['BLOCKED', 'WARNING', 'MANUAL_REVIEW']),
  source_url:               z.string().url().optional().or(z.literal('')),
  source_publication_date:  z.string().optional(),
  effective_from:           z.string(),
  effective_until:          z.string().optional(),
  review_due_at:            z.string().optional(),
})

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('org_id').eq('id', user.id).single()
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const type   = searchParams.get('type')
  const stale  = searchParams.get('stale')

  let query = supabase
    .from('compliance_rules')
    .select('*')
    .eq('org_id', profile?.org_id)
    .order('code')

  if (status) query = query.eq('status', status)
  if (type)   query = query.eq('rule_type', type)
  if (stale) query = query.lt('review_due_at', new Date().toISOString().split('T')[0])

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
  const validated = schema.parse(body)

  const { data, error } = await supabase
    .from('compliance_rules')
    .insert({ ...validated, org_id: profile?.org_id, created_by: user.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error }, { status: 400 })

  await supabase.from('audit_events').insert({
    org_id: profile?.org_id, actor_type: 'user', actor_id: user.id,
    action: 'create', resource_type: 'compliance_rule', resource_id: data.id,
    new_values: { code: data.code, name_en: data.name_en },
  })

  return NextResponse.json(data, { status: 201 })
}
