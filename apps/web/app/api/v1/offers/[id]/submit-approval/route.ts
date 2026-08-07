import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('org_id').eq('id', user.id).single()

  const { data: offer } = await supabase
    .from('offers')
    .select('id, status')
    .eq('id', (await params).id)
    .single()

  if (!offer) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (offer.status !== 'draft') return NextResponse.json({ error: 'Only draft offers can be submitted for approval' }, { status: 409 })

  // Find active offer approval workflow
  const { data: workflow } = await supabase
    .from('approval_workflows')
    .select('id, approval_workflow_steps(*)')
    .eq('org_id', profile?.org_id)
    .eq('resource_type', 'offer')
    .eq('is_active', true)
    .single()

  if (!workflow) {
    // No approval workflow → auto-approve, mark pending send
    await supabase
      .from('offers')
      .update({ status: 'pending_approval', updated_at: new Date().toISOString() })
      .eq('id', (await params).id)
    return NextResponse.json({ ok: true, skipped: true, message: 'No active offer workflow — offer ready to send.' })
  }

  // Create approval request
  const { data: req, error: reqErr } = await supabase
    .from('approval_requests')
    .insert({
      org_id:        profile?.org_id,
      resource_type: 'offer',
      resource_id:   (await params).id,
      status:        'pending',
      requester_id:  user.id,
      submitted_at:  new Date().toISOString(),
    })
    .select()
    .single()

  if (reqErr) return NextResponse.json({ error: reqErr }, { status: 400 })

  // Create approval steps
  const steps = (workflow.approval_workflow_steps as any[])
    .sort((a: any, b: any) => a.step_order - b.step_order)

  await supabase.from('approval_steps').insert(
    steps.map((s: any, i: number) => ({
      request_id:   req.id,
      step_order:   s.step_order,
      step_name:    s.step_name,
      approver_id:  s.approver_id,
      sla_hours:    s.sla_hours,
      approval_mode: s.approval_mode,
      status:       i === 0 ? 'active' : 'pending',
    }))
  )

  await supabase
    .from('offers')
    .update({ status: 'pending_approval', updated_at: new Date().toISOString() })
    .eq('id', (await params).id)

  return NextResponse.json({ ok: true, approval_request_id: req.id })
}
