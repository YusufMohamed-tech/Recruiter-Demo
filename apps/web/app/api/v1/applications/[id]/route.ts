import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { z } from 'zod'

const patchSchema = z.object({
  assigned_to:        z.string().uuid().nullable().optional(),
  ai_match_score:     z.number().min(0).max(100).optional(),
  ai_match_breakdown: z.record(z.unknown()).optional(),
})

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('job_applications')
    .select(`
      *,
      candidates ( * ),
      job_postings ( id, title_en, title_ar, slug, city, employment_type,
        min_experience_years, education_level, salary_min, salary_max,
        requirements_en, requirements_ar, departments ( name_en, name_ar ) ),
      application_stage_events ( id, from_stage, to_stage, notes, gate_checks, created_at,
        users ( id, name_en ) ),
      rejection_reasons ( id, reason_en, reason_ar )
    `)
    .eq('id', (await params).id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const patch = patchSchema.parse(body)

  const { data, error } = await supabase
    .from('job_applications')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', (await params).id)
    .select()
    .single()

  if (error) return NextResponse.json({ error }, { status: 400 })
  return NextResponse.json(data)
}
