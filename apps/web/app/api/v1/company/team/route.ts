import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userRow } = await supabase.from('users').select('org_id').eq('id', user.id).single()
  if (!userRow) return NextResponse.json({ error: 'No organization' }, { status: 404 })

  const { data: members } = await supabase
    .from('users')
    .select('id, email, name_en, is_active, created_at')
    .eq('org_id', userRow.org_id)

  const { data: invitations } = await supabase
    .from('company_invitations')
    .select('*')
    .eq('org_id', userRow.org_id)
    .eq('status', 'pending')

  return NextResponse.json({ members: members || [], invitations: invitations || [] })
}

export async function POST(request: Request) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userRow } = await supabase.from('users').select('org_id').eq('id', user.id).single()
  if (!userRow) return NextResponse.json({ error: 'No organization' }, { status: 404 })

  const { email, role_id } = await request.json()
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  const { data: roles } = await supabase.from('roles').select('id').eq('org_id', userRow.org_id).limit(1)
  const finalRoleId = role_id || roles?.[0]?.id
  if (!finalRoleId) return NextResponse.json({ error: 'No role available' }, { status: 400 })

  const token = crypto.randomUUID()

  const { data, error } = await supabase
    .from('company_invitations')
    .insert({
      org_id: userRow.org_id,
      email,
      role_id: finalRoleId,
      invited_by: user.id,
      token,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}
