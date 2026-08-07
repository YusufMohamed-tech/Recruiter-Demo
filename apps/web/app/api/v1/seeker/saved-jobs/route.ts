import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

async function getSeekerId(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('seeker_profiles').select('id').eq('user_id', user.id).single()
  return data?.id || null
}

export async function GET() {
  const supabase = await createServerSupabase()
  const seekerId = await getSeekerId(supabase)
  if (!seekerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('seeker_saved_jobs')
    .select(`
      *,
      job_postings(id, title_en, slug, city, employment_type, salary_visible, salary_min, salary_max,
        organizations(legal_name_en, logo_url)
      )
    `)
    .eq('seeker_id', seekerId)
    .order('saved_at', { ascending: false })

  return NextResponse.json(data || [])
}

export async function POST(request: Request) {
  const supabase = await createServerSupabase()
  const seekerId = await getSeekerId(supabase)
  if (!seekerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { job_posting_id } = await request.json()

  const { data, error } = await supabase
    .from('seeker_saved_jobs')
    .insert({ seeker_id: seekerId, job_posting_id })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Already saved' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data, { status: 201 })
}
