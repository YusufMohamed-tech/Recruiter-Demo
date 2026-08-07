import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabase()
  const { searchParams } = new URL(request.url)

  const status   = searchParams.get('status')
  const platform = searchParams.get('platform')
  const caseType = searchParams.get('case_type')
  const page     = parseInt(searchParams.get('page') ?? '1')
  const limit    = parseInt(searchParams.get('limit') ?? '25')
  const offset   = (page - 1) * limit

  let query = supabase
    .from('government_cases')
    .select(`
      id, case_type, platform, status, reference_number,
      submitted_at, completed_at, notes, created_at,
      assigned_user:assigned_to ( id, name_en ),
      employment_readiness_cases (
        id, branch_type,
        candidates ( id, name_en, name_ar )
      ),
      qiwa_contract_cases ( id, contract_status )
    `, { count: 'exact' })
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false })

  if (status)   query = query.eq('status', status)
  if (platform) query = query.eq('platform', platform)
  if (caseType) query = query.eq('case_type', caseType)

  const { data, count, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data, { headers: { 'X-Total-Count': String(count ?? 0) } })
}
