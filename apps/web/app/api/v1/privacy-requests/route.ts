import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { z } from 'zod'

const createSchema = z.object({
  candidate_id:    z.string().uuid().optional(),
  request_type:    z.enum(['access','erasure','rectification','portability','objection']),
  requester_name:  z.string().min(1),
  requester_email: z.string().email(),
  description:     z.string().optional(),
})

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabase()
  const { searchParams } = new URL(request.url)

  const status = searchParams.get('status')
  const page   = parseInt(searchParams.get('page') ?? '1')
  const limit  = parseInt(searchParams.get('limit') ?? '25')
  const offset = (page - 1) * limit

  let query = supabase
    .from('privacy_requests')
    .select(`
      id, request_type, requester_name, requester_email, description,
      status, handled_at, resolution_notes, created_at,
      candidates ( id, name_en, email ),
      handled_by_user:handled_by ( id, name_en )
    `, { count: 'exact' })
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data, count, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data, { headers: { 'X-Total-Count': String(count ?? 0) } })
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userRow } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', user.id)
    .single()
  if (!userRow) return NextResponse.json({ error: 'User profile not found' }, { status: 403 })

  const body = await request.json()
  const input = createSchema.parse(body)

  const { data, error } = await supabase
    .from('privacy_requests')
    .insert({ ...input, org_id: userRow.org_id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}
