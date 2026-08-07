import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('org_id').eq('id', user.id).single()
  const { searchParams } = new URL(request.url)
  const resourceType = searchParams.get('resource_type')
  const resourceId   = searchParams.get('resource_id')
  const status       = searchParams.get('status')
  const mine         = searchParams.get('mine') === '1'

  let query = supabase
    .from('approval_requests')
    .select(`
      *,
      steps:approval_steps(
        id, step_order, step_name, status, decision, comments, decided_at,
        approver:users!approver_id(id, name_en, name_ar),
        delegated_to:users!delegated_to(id, name_en)
      ),
      requester:users!requester_id(id, name_en, name_ar)
    `)
    .eq('org_id', profile?.org_id)
    .order('submitted_at', { ascending: false })

  if (resourceType) query = query.eq('resource_type', resourceType)
  if (resourceId)   query = query.eq('resource_id', resourceId)
  if (status)       query = query.eq('status', status)
  if (mine)         query = query.eq('requester_id', user.id)

  const { data, error } = await query
  if (error) return NextResponse.json({ error }, { status: 400 })
  return NextResponse.json(data)
}
