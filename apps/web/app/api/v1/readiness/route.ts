import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabase()
  const { searchParams } = new URL(request.url)

  const status      = searchParams.get('status')
  const branchType  = searchParams.get('branch_type')
  const candidateId = searchParams.get('candidate_id')
  const page        = parseInt(searchParams.get('page') ?? '1')
  const limit       = parseInt(searchParams.get('limit') ?? '25')
  const offset      = (page - 1) * limit

  let query = supabase
    .from('employment_readiness_cases')
    .select(`
      id, status, branch_type, readiness_score, mandatory_blockers,
      target_join_date, actual_join_date, created_at,
      candidates ( id, name_en, name_ar, email, nationality ),
      job_applications ( id, job_postings ( id, title_en, title_ar ) ),
      offers ( id, current_version ),
      assigned_user:assigned_to ( id, name_en )
    `, { count: 'exact' })
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false })

  if (status)      query = query.eq('status', status)
  if (branchType)  query = query.eq('branch_type', branchType)
  if (candidateId) query = query.eq('candidate_id', candidateId)

  const { data, count, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data, { headers: { 'X-Total-Count': String(count ?? 0) } })
}
