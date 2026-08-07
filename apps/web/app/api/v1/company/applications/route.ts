import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userRow } = await supabase.from('users').select('org_id').eq('id', user.id).single()
  if (!userRow) return NextResponse.json({ error: 'No organization' }, { status: 404 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const jobId = searchParams.get('job_id')

  let query = supabase
    .from('seeker_applications')
    .select('*, seeker_profiles(first_name_en, last_name_en, headline, city, skills), job_postings(title_en)')
    .eq('org_id', userRow.org_id)
    .order('submitted_at', { ascending: false })

  if (status && status !== 'all') query = query.eq('status', status)
  if (jobId) query = query.eq('job_posting_id', jobId)

  const { data } = await query
  return NextResponse.json(data || [])
}
