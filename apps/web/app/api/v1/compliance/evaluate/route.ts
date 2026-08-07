import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { evaluateRules, type ComplianceRule } from '@/lib/compliance/engine'
import { z } from 'zod'

const schema = z.object({
  resource_type: z.string(),
  resource_id:   z.string().uuid(),
  input:         z.record(z.unknown()),
  persist:       z.boolean().optional().default(true),
})

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('org_id').eq('id', user.id).single()
  const body = await request.json()
  const { resource_type, resource_id, input, persist } = schema.parse(body)

  const { data: rules } = await supabase
    .from('compliance_rules')
    .select('*')
    .eq('org_id', profile?.org_id)
    .eq('status', 'active')

  const result = evaluateRules((rules ?? []) as ComplianceRule[], input, resource_type)

  if (persist) {
    const { data: evaluation } = await supabase
      .from('compliance_evaluations')
      .insert({
        org_id:              profile?.org_id,
        resource_type,
        resource_id,
        ruleset_snapshot:    rules ?? [],
        overall_result:      result.overall_result,
        input_snapshot_json: input,
        result_summary_json: {
          items_count:    result.items.length,
          blocked_count:  result.blocked_count,
          warning_count:  result.warning_count,
          stale_count:    result.stale_rules_count,
        },
        stale_rules_count: result.stale_rules_count,
      })
      .select('id')
      .single()

    if (evaluation) {
      const itemRows = result.items.map(i => ({
        evaluation_id: evaluation.id,
        rule_id:       i.rule_id,
        rule_code:     i.rule_code,
        result:        i.result,
        message_en:    i.message_en,
        message_ar:    i.message_ar,
      }))
      await supabase.from('compliance_evaluation_items').insert(itemRows)
    }
  }

  return NextResponse.json(result)
}
