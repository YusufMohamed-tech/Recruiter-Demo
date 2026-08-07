import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { z } from 'zod'

const createSchema = z.object({
  title_en:             z.string().min(1),
  title_ar:             z.string().optional(),
  department_id:        z.string().uuid().optional(),
  establishment_id:     z.string().uuid().optional(),
  headcount:            z.number().int().min(1).default(1),
  employment_type:      z.enum(['full_time','part_time','contract','internship']).default('full_time'),
  nationality_pref:     z.enum(['saudi','non_saudi','any']).optional(),
  min_experience_years: z.number().int().min(0).optional(),
  education_level:      z.string().optional(),
  salary_min:           z.number().optional(),
  salary_max:           z.number().optional(),
  budget_approved:      z.boolean().default(false),
  justification_en:     z.string().optional(),
  justification_ar:     z.string().optional(),
  target_hire_date:     z.string().optional(),
})

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('org_id').eq('id', user.id).single()
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const page   = parseInt(searchParams.get('page') ?? '1')
  const limit  = parseInt(searchParams.get('limit') ?? '25')

  let query = supabase
    .from('job_requisitions')
    .select(`
      id, ref_number, title_en, title_ar, headcount, employment_type,
      status, budget_approved, target_hire_date, created_at, submitted_at,
      department:departments(id, name_en, name_ar),
      establishment:establishments(id, name_en, name_ar),
      creator:users!created_by(id, name_en)
    `, { count: 'exact' })
    .eq('org_id', profile?.org_id)
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (status) query = query.eq('status', status)

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error }, { status: 400 })
  return NextResponse.json(data, { headers: { 'X-Total-Count': String(count ?? 0) } })
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('org_id').eq('id', user.id).single()
  const body = await request.json()
  const validated = createSchema.parse(body)

  // Generate ref number
  const { count } = await supabase
    .from('job_requisitions')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', profile?.org_id)
  const ref_number = `REQ-${String((count ?? 0) + 1).padStart(4, '0')}`

  const { data, error } = await supabase
    .from('job_requisitions')
    .insert({ ...validated, org_id: profile?.org_id, created_by: user.id, ref_number })
    .select()
    .single()

  if (error) return NextResponse.json({ error }, { status: 400 })

  await supabase.from('audit_events').insert({
    org_id: profile?.org_id, actor_type: 'user', actor_id: user.id,
    action: 'create', resource_type: 'requisition', resource_id: data.id,
    new_values: { ref_number, title_en: data.title_en },
  })

  return NextResponse.json(data, { status: 201 })
}
