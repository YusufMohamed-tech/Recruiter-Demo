import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { scoreMatch } from '@/lib/ai/match-scorer'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: app } = await supabase
    .from('job_applications')
    .select(`
      id, candidate_id,
      candidates ( name_en, current_title, total_experience_years, education_level, parsed_profile ),
      job_postings ( title_en, requirements_en, min_experience_years, education_level,
        employment_type, city, salary_min, salary_max )
    `)
    .eq('id', (await params).id)
    .single()

  if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const candidate = app.candidates as Record<string, unknown>
  const job       = app.job_postings as Record<string, unknown>

  const result = await scoreMatch(job, {
    name:             candidate?.name_en,
    current_title:    candidate?.current_title,
    experience_years: candidate?.total_experience_years,
    education_level:  candidate?.education_level,
    ...(candidate?.parsed_profile as Record<string, unknown> ?? {}),
  })

  const { error } = await supabase
    .from('job_applications')
    .update({
      ai_match_score:     result.overall_score,
      ai_match_breakdown: result,
      updated_at:         new Date().toISOString(),
    })
    .eq('id', (await params).id)

  if (error) return NextResponse.json({ error }, { status: 400 })
  return NextResponse.json({ ok: true, score: result.overall_score, breakdown: result })
}
