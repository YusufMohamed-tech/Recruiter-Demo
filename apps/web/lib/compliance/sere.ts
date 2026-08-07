/**
 * SERE (Saudi Employment Readiness Evaluation) score calculator.
 * Mirrors the SQL function recalculate_sere_score but runs client-side
 * for instant preview before the DB trigger fires.
 */

export const SERE_WEIGHTS: Record<string, number> = {
  compliance_readiness:  0.25,
  contract_readiness:    0.20,
  government_process:    0.20,
  payroll_gosi:          0.15,
  candidate_docs:        0.10,
  internal_onboarding:   0.10,
}

export interface ChecklistItem {
  item_type: string
  mandatory: boolean
  status: 'pending' | 'in_progress' | 'completed' | 'waived' | 'blocked'
  label_en: string
}

export interface SereResult {
  score: number
  blocked: boolean
  by_category: Record<string, { total: number; done: number; score: number }>
  blockers: ChecklistItem[]
}

export function calculateSere(items: ChecklistItem[]): SereResult {
  const byCategory: Record<string, { total: number; done: number }> = {}

  for (const item of items) {
    if (!byCategory[item.item_type]) byCategory[item.item_type] = { total: 0, done: 0 }
    byCategory[item.item_type].total++
    if (item.status === 'completed' || item.status === 'waived') {
      byCategory[item.item_type].done++
    }
  }

  let totalScore = 0
  const byCategoryResult: Record<string, { total: number; done: number; score: number }> = {}

  for (const [cat, counts] of Object.entries(byCategory)) {
    const weight = SERE_WEIGHTS[cat] ?? 0
    const catScore = weight * 100 * (counts.done / Math.max(counts.total, 1))
    totalScore += catScore
    byCategoryResult[cat] = { ...counts, score: Math.round(catScore) }
  }

  const blockers = items.filter(i => i.mandatory && !['completed', 'waived'].includes(i.status))

  return {
    score: Math.round(totalScore),
    blocked: blockers.length > 0,
    by_category: byCategoryResult,
    blockers,
  }
}
