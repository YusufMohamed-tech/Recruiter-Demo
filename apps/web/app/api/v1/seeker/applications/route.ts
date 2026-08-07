import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('seeker_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const { data } = await supabase
    .from('seeker_applications')
    .select(`
      *,
      job_postings(title_en, slug, city, employment_type,
        organizations(legal_name_en, logo_url)
      )
    `)
    .eq('seeker_id', profile.id)
    .order('created_at', { ascending: false })

  return NextResponse.json(data || [])
}

export async function POST(request: Request) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('seeker_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Complete your profile first' }, { status: 400 })

  const body = await request.json()
  const { job_posting_id, form_responses } = body

  const { data: job } = await supabase
    .from('job_postings')
    .select('id, org_id')
    .eq('id', job_posting_id)
    .eq('status', 'published')
    .single()

  if (!job) return NextResponse.json({ error: 'Job not found or no longer accepting applications' }, { status: 404 })

  const { data, error } = await supabase
    .from('seeker_applications')
    .insert({
      seeker_id: profile.id,
      job_posting_id: job.id,
      org_id: job.org_id,
      form_responses: form_responses || {},
      status: 'submitted',
      submitted_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'You have already applied to this job' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data, { status: 201 })
}
