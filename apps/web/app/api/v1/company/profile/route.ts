import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userRow } = await supabase.from('users').select('org_id').eq('id', user.id).single()
  if (!userRow) return NextResponse.json({ error: 'No organization' }, { status: 404 })

  const { data } = await supabase.from('company_profiles').select('*').eq('org_id', userRow.org_id).single()
  if (!data) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  return NextResponse.json(data)
}

export async function PUT(request: Request) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userRow } = await supabase.from('users').select('org_id').eq('id', user.id).single()
  if (!userRow) return NextResponse.json({ error: 'No organization' }, { status: 404 })

  const body = await request.json()
  const { data, error } = await supabase
    .from('company_profiles')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('org_id', userRow.org_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
