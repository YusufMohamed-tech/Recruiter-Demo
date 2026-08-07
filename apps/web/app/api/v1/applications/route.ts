import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('org_id').eq('id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const jobId      = searchParams.get('job_id')
  const stage      = searchParams.get('stage')
  const status     = searchParams.get('status') ?? 'active'
  const assignedTo = searchParams.get('assigned_to')
  const page       = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit      = Math.min(200, parseInt(searchParams.get('limit') ?? '50'))
  const offset     = (page - 1) * limit

  let query = supabase
    .from('job_applications')
    .select(`
      id, current_stage, status, ai_match_score, created_at, updated_at, assigned_to,
      candidates ( id, name_en, name_ar, email, current_title, total_experience_years, nationality ),
      job_postings ( id, title_en, slug )
    `, { count: 'exact' })
    .eq('org_id', profile.org_id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (jobId)      query = query.eq('job_posting_id', jobId)
  if (stage)      query = query.eq('current_stage', stage)
  if (status)     query = query.eq('status', status)
  if (assignedTo) query = query.eq('assigned_to', assignedTo)

  const { data, count, error } = await query
  if (error) return NextResponse.json({ error }, { status: 400 })

  const response = NextResponse.json(data)
  response.headers.set('X-Total-Count', String(count ?? 0))
  return response
}
