import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { evaluateRules, type ComplianceRule } from '@/lib/compliance/engine'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('org_id').eq('id', user.id).single()
  const orgId = profile?.org_id

  const { data: req } = await supabase
    .from('job_requisitions').select('*').eq('id', (await params).id).eq('org_id', orgId).single()

  if (!req) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (req.status !== 'draft' && req.status !== 'changes_requested') {
    return NextResponse.json({ error: 'Only draft or changes-requested requisitions can be submitted' }, { status: 400 })
  }

  // Compliance pre-check
  const { data: rules } = await supabase
    .from('compliance_rules').select('*').eq('org_id', orgId).eq('status', 'active')
  const complianceInput = {
    saudization_pct:  req.nationality_pref === 'saudi' ? 100 : 30,
    employment_type:  req.employment_type,
    headcount:        req.headcount,
    budget_approved:  req.budget_approved,
  }
  const evalResult = evaluateRules((rules ?? []) as ComplianceRule[], complianceInput, 'requisition')

  // Save compliance evaluation
  const { data: evaluation } = await supabase
    .from('compliance_evaluations')
    .insert({
      org_id: orgId, resource_type: 'requisition', resource_id: (await params).id,
      ruleset_snapshot: rules ?? [],
      overall_result: evalResult.overall_result,
      input_snapshot_json: complianceInput,
      result_summary_json: { blocked_count: evalResult.blocked_count },
      stale_rules_count: evalResult.stale_rules_count,
    })
    .select('id').single()

  if (evaluation) {
    await supabase.from('compliance_evaluation_items').insert(
      evalResult.items.map(i => ({
        evaluation_id: evaluation.id, rule_id: i.rule_id, rule_code: i.rule_code,
        result: i.result, message_en: i.message_en, message_ar: i.message_ar,
      }))
    )
  }

  if (evalResult.overall_result === 'BLOCKED') {
    return NextResponse.json({
      error: 'Submission blocked by compliance rules',
      compliance: evalResult,
    }, { status: 422 })
  }

  // Find active approval workflow for requisitions
  const { data: workflow } = await supabase
    .from('approval_workflows')
    .select('*, steps:approval_workflow_steps(*)')
    .eq('org_id', orgId)
    .eq('resource_type', 'requisition')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // Update requisition status
  const { data: updated } = await supabase
    .from('job_requisitions')
    .update({ status: 'pending_approval', submitted_at: new Date().toISOString(), updated_by: user.id })
    .eq('id', (await params).id)
    .select().single()

  let approvalRequest = null
  if (workflow) {
    const steps = (workflow.steps ?? []).sort((a: any, b: any) => a.step_order - b.step_order)
    const { data: arReq } = await supabase
      .from('approval_requests')
      .insert({
        org_id: orgId, workflow_id: workflow.id,
        resource_type: 'requisition', resource_id: (await params).id,
        status: 'pending', requester_id: user.id,
      })
      .select().single()

    if (arReq && steps.length > 0) {
      await supabase.from('approval_steps').insert(
        steps.map((s: any, idx: number) => ({
          approval_request_id: arReq.id,
          step_order: s.step_order,
          step_name: s.step_name,
          approver_id: s.approver_id,
          sla_hours: s.sla_hours,
          status: idx === 0 ? 'active' : 'pending',
        }))
      )
      approvalRequest = arReq
    }
  }

  await supabase.from('audit_events').insert({
    org_id: orgId, actor_type: 'user', actor_id: user.id,
    action: 'submit', resource_type: 'requisition', resource_id: (await params).id,
  })

  return NextResponse.json({ requisition: updated, approval_request: approvalRequest, compliance: evalResult })
}
