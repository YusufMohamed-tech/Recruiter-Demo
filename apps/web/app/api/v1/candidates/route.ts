import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('org_id').eq('id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const q          = searchParams.get('q') ?? ''
  const duplicate  = searchParams.get('duplicate')
  const page       = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit      = Math.min(100, parseInt(searchParams.get('limit') ?? '25'))
  const offset     = (page - 1) * limit

  let query = supabase
    .from('candidates')
    .select('id, name_en, name_ar, email, phone, current_title, current_city, nationality, education_level, total_experience_years, tags, is_duplicate, created_at', { count: 'exact' })
    .eq('org_id', profile.org_id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (q) {
    query = query.or(`name_en.ilike.%${q}%,email.ilike.%${q}%,current_title.ilike.%${q}%`)
  }
  if (duplicate === '1') {
    query = query.eq('is_duplicate', true)
  }

  const { data, count, error } = await query
  if (error) return NextResponse.json({ error }, { status: 400 })

  const response = NextResponse.json(data)
  response.headers.set('X-Total-Count', String(count ?? 0))
  return response
}
