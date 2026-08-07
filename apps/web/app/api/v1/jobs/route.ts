import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { z } from 'zod'

const createSchema = z.object({
  requisition_id:      z.string().uuid().optional().nullable(),
  title_en:            z.string().min(1),
  title_ar:            z.string().optional(),
  summary_en:          z.string().optional(),
  summary_ar:          z.string().optional(),
  description_en:      z.string().optional(),
  description_ar:      z.string().optional(),
  requirements_en:     z.string().optional(),
  requirements_ar:     z.string().optional(),
  department_id:       z.string().uuid().optional().nullable(),
  establishment_id:    z.string().uuid().optional().nullable(),
  city:                z.string().optional(),
  employment_type:     z.enum(['full_time','part_time','contract','internship']).default('full_time'),
  nationality_req:     z.string().optional().nullable(),
  min_experience_years:z.number().int().min(0).optional().nullable(),
  education_level:     z.string().optional().nullable(),
  salary_visible:      z.boolean().default(false),
  salary_min:          z.number().optional().nullable(),
  salary_max:          z.number().optional().nullable(),
  deadline:            z.string().optional().nullable(),
  seo_title:           z.string().optional(),
  seo_description:     z.string().optional(),
})

function slugify(text: string, suffix: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + suffix
}

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('org_id').eq('id', user.id).single()
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const q      = searchParams.get('q')
  const page   = parseInt(searchParams.get('page') ?? '1')
  const limit  = parseInt(searchParams.get('limit') ?? '25')

  let query = supabase
    .from('job_postings')
    .select(`
      id, slug, title_en, title_ar, city, employment_type, status,
      salary_visible, salary_min, salary_max, deadline, published_at, created_at,
      department:departments(id, name_en),
      establishment:establishments(id, name_en)
    `, { count: 'exact' })
    .eq('org_id', profile?.org_id)
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (status) query = query.eq('status', status)
  if (q)      query = query.ilike('title_en', `%${q}%`)

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

  const slug = slugify(validated.title_en, Date.now().toString(36))

  const { data, error } = await supabase
    .from('job_postings')
    .insert({ ...validated, org_id: profile?.org_id, created_by: user.id, slug })
    .select()
    .single()

  if (error) return NextResponse.json({ error }, { status: 400 })

  await supabase.from('audit_events').insert({
    org_id: profile?.org_id, actor_type: 'user', actor_id: user.id,
    action: 'create', resource_type: 'job_posting', resource_id: data.id,
    new_values: { slug, title_en: data.title_en },
  })

  return NextResponse.json(data, { status: 201 })
}
