'use client'

import { ComplianceBadge, type ComplianceResult } from './ComplianceBadge'
import { cn } from '@/lib/utils/cn'

interface EvalItem {
  rule_code: string
  result: string
  message_en: string
  message_ar?: string
}

interface EvaluationResultsProps {
  overall: string
  items: EvalItem[]
  staleCount?: number
  className?: string
}

export function EvaluationResults({ overall, items, staleCount = 0, className }: EvaluationResultsProps) {
  const visible = items.filter(i => i.result !== 'NOT_APPLICABLE')

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-muted-foreground">Overall:</span>
        <ComplianceBadge result={overall as ComplianceResult} />
        {staleCount > 0 && (
          <span className="text-xs text-muted-foreground">
            {staleCount} stale rule{staleCount > 1 ? 's' : ''} skipped
          </span>
        )}
      </div>
      <div className="divide-y rounded-md border">
        {visible.map((item, i) => (
          <div key={i} className="flex items-start gap-3 px-3 py-2.5">
            <ComplianceBadge result={item.result as ComplianceResult} size="sm" />
            <div className="min-w-0 flex-1">
              <span className="text-xs font-mono text-muted-foreground mr-2">{item.rule_code}</span>
              <span className="text-sm">{item.message_en}</span>
            </div>
          </div>
        ))}
        {visible.length === 0 && (
          <div className="px-3 py-4 text-center text-sm text-muted-foreground">No rules evaluated</div>
        )}
      </div>
    </div>
  )
}
