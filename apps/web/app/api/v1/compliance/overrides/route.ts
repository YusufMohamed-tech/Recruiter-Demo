import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { z } from 'zod'

const createSchema = z.object({
  evaluation_id: z.string().uuid(),
  rule_id:       z.string().uuid(),
  justification: z.string().min(10),
  expires_at:    z.string().optional(),
})

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('org_id').eq('id', user.id).single()
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') ?? 'pending'

  const { data, error } = await supabase
    .from('compliance_overrides')
    .select(`
      *,
      rule:compliance_rules(id, code, name_en, name_ar, result_if_fail),
      requester:users!requested_by(id, name_en, name_ar),
      approver:users!approved_by(id, name_en, name_ar)
    `)
    .eq('org_id', profile?.org_id)
    .eq('status', status)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error }, { status: 400 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('org_id').eq('id', user.id).single()
  const body = await request.json()
  const validated = createSchema.parse(body)

  const { data, error } = await supabase
    .from('compliance_overrides')
    .insert({
      ...validated,
      org_id:       profile?.org_id,
      requested_by: user.id,
      status:       'pending',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error }, { status: 400 })

  await supabase.from('audit_events').insert({
    org_id: profile?.org_id, actor_type: 'user', actor_id: user.id,
    action: 'request_override', resource_type: 'compliance_rule', resource_id: validated.rule_id,
  })

  return NextResponse.json(data, { status: 201 })
}
