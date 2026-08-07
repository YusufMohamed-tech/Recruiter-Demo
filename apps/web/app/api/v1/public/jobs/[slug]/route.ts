import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('job_postings')
    .select(`
      id, slug, title_en, title_ar,
      summary_en, summary_ar,
      description_en, description_ar,
      requirements_en, requirements_ar,
      city, employment_type, deadline, published_at,
      salary_visible, salary_min, salary_max,
      nationality_req, min_experience_years, education_level,
      seo_title, seo_description,
      department:departments(id, name_en, name_ar),
      establishment:establishments(id, name_en, name_ar),
      application_form:application_form_versions(id, schema_json)
    `)
    .eq('slug', (await params).slug)
    .eq('status', 'published')
    .single()

  if (error) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
  })
}
