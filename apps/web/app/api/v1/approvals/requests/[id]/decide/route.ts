import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  step_id:  z.string().uuid(),
  decision: z.enum(['approved', 'rejected', 'changes_requested']),
  comments: z.string().optional(),
})

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('org_id').eq('id', user.id).single()
  const body = await request.json()
  const { step_id, decision, comments } = schema.parse(body)

  // Verify this is an active step and user is the approver
  const { data: step } = await supabase
    .from('approval_steps')
    .select('*, approval_request:approval_requests(*)')
    .eq('id', step_id)
    .eq('approval_request_id', (await params).id)
    .single()

  if (!step) return NextResponse.json({ error: 'Step not found' }, { status: 404 })
  if (step.status !== 'active') return NextResponse.json({ error: 'Step is not active' }, { status: 400 })
  if (step.approver_id && step.approver_id !== user.id) {
    return NextResponse.json({ error: 'You are not the approver for this step' }, { status: 403 })
  }

  const reqRecord = step.approval_request
  if (reqRecord?.requester_id === user.id) {
    return NextResponse.json({ error: 'Cannot approve your own request' }, { status: 403 })
  }

  // Record decision on step
  await supabase.from('approval_steps').update({
    status: 'completed', decision, comments,
    decided_at: new Date().toISOString(),
  }).eq('id', step_id)

  let outcome: string
  if (decision === 'rejected' || decision === 'changes_requested') {
    // Terminal: update request + resource
    await supabase.from('approval_requests').update({
      status: decision, completed_at: new Date().toISOString(),
    }).eq('id', (await params).id)

    // Map back to requisition status
    const resourceStatus = decision === 'rejected' ? 'rejected' : 'changes_requested'
    if (reqRecord?.resource_type === 'requisition') {
      await supabase.from('job_requisitions').update({ status: resourceStatus }).eq('id', reqRecord.resource_id)
    }
    outcome = decision
  } else {
    // Approved — find next step
    const { data: nextStep } = await supabase
      .from('approval_steps')
      .select('id')
      .eq('approval_request_id', (await params).id)
      .gt('step_order', step.step_order)
      .eq('status', 'pending')
      .order('step_order')
      .limit(1)
      .single()

    if (nextStep) {
      await supabase.from('approval_steps').update({ status: 'active' }).eq('id', nextStep.id)
      outcome = 'next_step'
    } else {
      // All steps approved
      await supabase.from('approval_requests').update({
        status: 'approved', completed_at: new Date().toISOString(),
      }).eq('id', (await params).id)

      if (reqRecord?.resource_type === 'requisition') {
        await supabase.from('job_requisitions').update({ status: 'approved' }).eq('id', reqRecord.resource_id)
      }
      outcome = 'approved'
    }
  }

  await supabase.from('audit_events').insert({
    org_id: profile?.org_id, actor_type: 'user', actor_id: user.id,
    action: `approval_${decision}`, resource_type: reqRecord?.resource_type ?? 'approval',
    resource_id: reqRecord?.resource_id ?? (await params).id,
    new_values: { decision, comments },
  })

  return NextResponse.json({ outcome })
}
