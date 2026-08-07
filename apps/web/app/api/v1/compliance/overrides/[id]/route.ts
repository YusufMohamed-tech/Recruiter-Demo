import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { z } from 'zod'

const decideSchema = z.object({
  decision:   z.enum(['approved', 'rejected']),
  expires_at: z.string().optional(),
})

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('org_id').eq('id', user.id).single()

  // Fetch override to check requester (cannot approve own request)
  const { data: override } = await supabase
    .from('compliance_overrides')
    .select('requested_by, status')
    .eq('id', (await params).id)
    .single()

  if (!override) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (override.status !== 'pending') return NextResponse.json({ error: 'Already resolved' }, { status: 400 })
  if (override.requested_by === user.id) {
    return NextResponse.json({ error: 'Cannot approve your own override request' }, { status: 403 })
  }

  const body = await request.json()
  const { decision, expires_at } = decideSchema.parse(body)

  const { data, error } = await supabase
    .from('compliance_overrides')
    .update({
      status:      decision,
      approved_by: user.id,
      resolved_at: new Date().toISOString(),
      ...(expires_at ? { expires_at } : {}),
    })
    .eq('id', (await params).id)
    .eq('org_id', profile?.org_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error }, { status: 400 })

  await supabase.from('audit_events').insert({
    org_id: profile?.org_id, actor_type: 'user', actor_id: user.id,
    action: `override_${decision}`, resource_type: 'compliance_override', resource_id: (await params).id,
  })

  return NextResponse.json(data)
}
