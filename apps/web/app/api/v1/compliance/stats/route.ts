import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('org_id').eq('id', user.id).single()
  const orgId = profile?.org_id
  const today = new Date().toISOString().split('T')[0]

  const [
    { data: rules },
    { data: recentEvals },
    { data: pendingOverrides },
  ] = await Promise.all([
    supabase.from('compliance_rules').select('id, status, review_due_at, result_if_fail').eq('org_id', orgId),
    supabase
      .from('compliance_evaluations')
      .select('overall_result, evaluated_at, resource_type')
      .eq('org_id', orgId)
      .order('evaluated_at', { ascending: false })
      .limit(50),
    supabase
      .from('compliance_overrides')
      .select('id, status, justification, created_at, rule:compliance_rules(code, name_en), requester:users!requested_by(name_en)')
      .eq('org_id', orgId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false }),
  ])

  const active  = rules?.filter(r => r.status === 'active').length ?? 0
  const stale   = rules?.filter(r => r.review_due_at && r.review_due_at < today).length ?? 0
  const blocked = recentEvals?.filter(e => e.overall_result === 'BLOCKED').length ?? 0
  const warning = recentEvals?.filter(e => e.overall_result === 'WARNING').length ?? 0
  const pass    = recentEvals?.filter(e => e.overall_result === 'PASS').length ?? 0

  const blockRate = recentEvals?.length
    ? Math.round((blocked / recentEvals.length) * 100)
    : 0

  return NextResponse.json({
    rules: {
      total: rules?.length ?? 0,
      active,
      stale,
      inactive: (rules?.length ?? 0) - active,
    },
    evaluations: {
      total: recentEvals?.length ?? 0,
      blocked,
      warning,
      pass,
      block_rate_pct: blockRate,
    },
    pending_overrides: pendingOverrides?.length ?? 0,
    recent_overrides: pendingOverrides ?? [],
    recent_evals: recentEvals?.slice(0, 10) ?? [],
  })
}
