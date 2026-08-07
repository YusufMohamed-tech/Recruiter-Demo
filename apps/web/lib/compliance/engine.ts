/**
 * Compliance rule evaluation engine.
 *
 * A rule's condition_json describes one of three shapes:
 *   Simple comparison:   { field, operator, value }
 *   Conditional check:   { if: {field: value}, then: {field: value} }
 *   Composite:           { and|or: [condition, ...] }
 *
 * result_if_fail values: "BLOCKED" | "WARNING" | "MANUAL_REVIEW"
 */

export type RuleResult = 'PASS' | 'BLOCKED' | 'WARNING' | 'MANUAL_REVIEW' | 'RULE_STALE' | 'NOT_APPLICABLE'

export interface ComplianceRule {
  id: string
  code: string
  name_en: string
  name_ar: string
  description_en?: string | null
  description_ar?: string | null
  rule_type: string
  applies_to: string[]
  condition_json: Record<string, unknown>
  result_if_fail: string
  effective_from: string
  effective_until?: string | null
  review_due_at?: string | null
  status: string
}

export interface EvaluationItem {
  rule_id: string
  rule_code: string
  result: RuleResult
  message_en: string
  message_ar: string
  evidence?: Record<string, unknown>
}

export interface EvaluationResult {
  overall_result: 'PASS' | 'BLOCKED' | 'WARNING' | 'MANUAL_REVIEW'
  items: EvaluationItem[]
  stale_rules_count: number
  blocked_count: number
  warning_count: number
}

function get(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((cur, key) => {
    if (cur && typeof cur === 'object') return (cur as Record<string, unknown>)[key]
    return undefined
  }, obj)
}

function compare(actual: unknown, operator: string, expected: unknown): boolean {
  const a = actual as number
  const e = expected as number
  switch (operator) {
    case 'eq':  return actual === expected
    case 'neq': return actual !== expected
    case 'gt':  return a > e
    case 'gte': return a >= e
    case 'lt':  return a < e
    case 'lte': return a <= e
    case 'in':  return Array.isArray(expected) && expected.includes(actual)
    case 'not_in': return Array.isArray(expected) && !expected.includes(actual)
    case 'exists': return actual !== undefined && actual !== null
    default: return false
  }
}

function evaluateCondition(condition: Record<string, unknown>, input: Record<string, unknown>): boolean {
  // Composite: { and: [...] }
  if (Array.isArray(condition.and)) {
    return (condition.and as Record<string, unknown>[]).every(c => evaluateCondition(c, input))
  }
  // Composite: { or: [...] }
  if (Array.isArray(condition.or)) {
    return (condition.or as Record<string, unknown>[]).some(c => evaluateCondition(c, input))
  }
  // Conditional: { if: {field: value}, then: {field: value} }
  if (condition.if && condition.then) {
    const ifClause  = condition.if  as Record<string, unknown>
    const thenClause = condition.then as Record<string, unknown>
    const ifMet = Object.entries(ifClause).every(([k, v]) => get(input, k) === v)
    if (!ifMet) return true  // condition does not apply — pass
    return Object.entries(thenClause).every(([k, v]) => {
      if (typeof v === 'boolean') return Boolean(get(input, k)) === v
      return get(input, k) === v
    })
  }
  // Simple: { field, operator, value }
  if (condition.field && condition.operator) {
    const actual = get(input, condition.field as string)
    return compare(actual, condition.operator as string, condition.value)
  }
  return true
}

function isStale(rule: ComplianceRule): boolean {
  if (rule.review_due_at && new Date(rule.review_due_at) < new Date()) return true
  if (rule.effective_until && new Date(rule.effective_until) < new Date()) return true
  return false
}

function isApplicable(rule: ComplianceRule, resourceType: string): boolean {
  if (!rule.applies_to || rule.applies_to.length === 0) return true
  return rule.applies_to.includes(resourceType)
}

export function evaluateRules(
  rules: ComplianceRule[],
  input: Record<string, unknown>,
  resourceType: string
): EvaluationResult {
  const items: EvaluationItem[] = []
  let staleCount = 0

  for (const rule of rules) {
    if (rule.status !== 'active') continue
    if (!isApplicable(rule, resourceType)) {
      items.push({
        rule_id: rule.id, rule_code: rule.code,
        result: 'NOT_APPLICABLE',
        message_en: `Rule not applicable to ${resourceType}`,
        message_ar: `القاعدة غير مطبقة على ${resourceType}`,
      })
      continue
    }

    if (isStale(rule)) {
      staleCount++
      items.push({
        rule_id: rule.id, rule_code: rule.code,
        result: 'RULE_STALE',
        message_en: `${rule.name_en} — rule requires review (stale)`,
        message_ar: `${rule.name_ar} — القاعدة تحتاج مراجعة`,
      })
      continue
    }

    let passed: boolean
    try {
      passed = evaluateCondition(rule.condition_json, input)
    } catch {
      passed = false
    }

    if (passed) {
      items.push({
        rule_id: rule.id, rule_code: rule.code,
        result: 'PASS',
        message_en: `${rule.name_en} — passed`,
        message_ar: `${rule.name_ar} — مجتاز`,
      })
    } else {
      const result = rule.result_if_fail as RuleResult
      items.push({
        rule_id: rule.id, rule_code: rule.code,
        result,
        message_en: `${rule.name_en} — ${rule.description_en ?? 'requirement not met'}`,
        message_ar: `${rule.name_ar} — ${rule.description_ar ?? 'الشرط غير مستوفى'}`,
      })
    }
  }

  const blockedCount = items.filter(i => i.result === 'BLOCKED').length
  const warningCount = items.filter(i => i.result === 'WARNING').length
  const manualCount  = items.filter(i => i.result === 'MANUAL_REVIEW').length

  let overall: EvaluationResult['overall_result']
  if (blockedCount > 0)      overall = 'BLOCKED'
  else if (manualCount > 0)  overall = 'MANUAL_REVIEW'
  else if (warningCount > 0) overall = 'WARNING'
  else                       overall = 'PASS'

  return {
    overall_result: overall,
    items,
    stale_rules_count: staleCount,
    blocked_count: blockedCount,
    warning_count: warningCount,
  }
}
