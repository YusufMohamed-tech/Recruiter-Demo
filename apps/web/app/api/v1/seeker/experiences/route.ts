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
    .from('seeker_experiences')
    .select('*')
    .eq('seeker_id', seekerId)
    .order('order_index')

  return NextResponse.json(data || [])
}

export async function POST(request: Request) {
  const supabase = await createServerSupabase()
  const seekerId = await getSeekerId(supabase)
  if (!seekerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { data, error } = await supabase
    .from('seeker_experiences')
    .insert({ ...body, seeker_id: seekerId })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}
