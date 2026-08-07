import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabase()
  const { searchParams } = new URL(request.url)

  const resourceType = searchParams.get('resource_type')
  const resourceId   = searchParams.get('resource_id')
  const actorId      = searchParams.get('actor_id')
  const action       = searchParams.get('action')
  const dateFrom     = searchParams.get('date_from')
  const dateTo       = searchParams.get('date_to')
  const page         = parseInt(searchParams.get('page') ?? '1')
  const limit        = parseInt(searchParams.get('limit') ?? '50')
  const offset       = (page - 1) * limit

  let query = supabase
    .from('audit_events')
    .select(`
      id, actor_type, actor_id, action, resource_type, resource_id,
      old_values, new_values, ip_address, created_at,
      actor:actor_id ( id, name_en )
    `, { count: 'exact' })
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false })

  if (resourceType) query = query.eq('resource_type', resourceType)
  if (resourceId)   query = query.eq('resource_id', resourceId)
  if (actorId)      query = query.eq('actor_id', actorId)
  if (action)       query = query.eq('action', action)
  if (dateFrom)     query = query.gte('created_at', dateFrom)
  if (dateTo)       query = query.lte('created_at', dateTo)

  const { data, count, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data, { headers: { 'X-Total-Count': String(count ?? 0) } })
}
