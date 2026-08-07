import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabase()
  const { searchParams } = new URL(request.url)
  const q       = searchParams.get('q') ?? ''
  const city    = searchParams.get('city')
  const deptId  = searchParams.get('department_id')
  const empType = searchParams.get('employment_type')
  const page    = parseInt(searchParams.get('page') ?? '1')
  const limit   = parseInt(searchParams.get('limit') ?? '20')

  let query = supabase
    .from('job_postings')
    .select(`
      id, slug, title_en, title_ar, summary_en, summary_ar,
      city, employment_type, deadline, published_at,
      salary_visible, salary_min, salary_max,
      department:departments(id, name_en, name_ar),
      establishment:establishments(id, name_en)
    `, { count: 'exact' })
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (q)        query = query.or(`title_en.ilike.%${q}%,title_ar.ilike.%${q}%,summary_en.ilike.%${q}%`)
  if (city)     query = query.eq('city', city)
  if (deptId)   query = query.eq('department_id', deptId)
  if (empType)  query = query.eq('employment_type', empType)

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error }, { status: 400 })
  return NextResponse.json(data, {
    headers: {
      'X-Total-Count': String(count ?? 0),
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  })
}
