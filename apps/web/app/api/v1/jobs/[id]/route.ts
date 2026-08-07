import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { z } from 'zod'

const patchSchema = z.object({
  title_en:            z.string().min(1).optional(),
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
  employment_type:     z.enum(['full_time','part_time','contract','internship']).optional(),
  nationality_req:     z.string().optional().nullable(),
  min_experience_years:z.number().int().min(0).optional().nullable(),
  education_level:     z.string().optional().nullable(),
  salary_visible:      z.boolean().optional(),
  salary_min:          z.number().optional().nullable(),
  salary_max:          z.number().optional().nullable(),
  deadline:            z.string().optional().nullable(),
  seo_title:           z.string().optional(),
  seo_description:     z.string().optional(),
})

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('org_id').eq('id', user.id).single()
  const { data, error } = await supabase
    .from('job_postings')
    .select(`*, department:departments(id, name_en, name_ar), establishment:establishments(id, name_en, name_ar)`)
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

  const { data, error } = await supabase
    .from('job_postings')
    .update(validated)
    .eq('id', (await params).id)
    .eq('org_id', profile?.org_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error }, { status: 400 })
  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('org_id').eq('id', user.id).single()
  const { data: existing } = await supabase
    .from('job_postings').select('status').eq('id', (await params).id).single()

  if (existing?.status === 'published') {
    return NextResponse.json({ error: 'Close the job posting before deleting' }, { status: 400 })
  }

  const { error } = await supabase
    .from('job_postings')
    .delete()
    .eq('id', (await params).id)
    .eq('org_id', profile?.org_id)

  if (error) return NextResponse.json({ error }, { status: 400 })
  return NextResponse.json({ success: true })
}
