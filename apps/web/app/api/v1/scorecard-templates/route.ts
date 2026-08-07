import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { z } from 'zod'

const criterionSchema = z.object({
  key:       z.string().min(1),
  label_en:  z.string().min(1),
  label_ar:  z.string().optional(),
  weight:    z.number().min(0).max(100).default(1),
  type:      z.enum(['rating','text','yesno']).default('rating'),
})

const createSchema = z.object({
  name:           z.string().min(1),
  interview_type: z.string().nullable().optional(),
  criteria:       z.array(criterionSchema).min(1),
})

export async function GET(_req: NextRequest) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('org_id').eq('id', user.id).single()

  const { data, error } = await supabase
    .from('scorecard_templates')
    .select('id, name, interview_type, criteria, is_active, created_at')
    .eq('org_id', profile?.org_id)
    .eq('is_active', true)
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
  const payload = createSchema.parse(body)

  const { data, error } = await supabase
    .from('scorecard_templates')
    .insert({ ...payload, org_id: profile?.org_id, created_by: user.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}
