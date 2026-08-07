import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils/cn'
import { CheckCircle2, XCircle, AlertTriangle, Clock, Eye, Minus } from 'lucide-react'

export type ComplianceResult =
  | 'PASS' | 'BLOCKED' | 'WARNING'
  | 'MANUAL_REVIEW' | 'RULE_STALE' | 'NOT_APPLICABLE' | 'OVERRIDE_PENDING'

const CONFIG: Record<ComplianceResult, { label: string; labelAr: string; icon: React.ElementType; variant: string; cls: string }> = {
  PASS:             { label: 'Pass',            labelAr: 'مجتاز',                  icon: CheckCircle2,   variant: 'success',   cls: '' },
  BLOCKED:          { label: 'Blocked',         labelAr: 'محظور',                  icon: XCircle,        variant: 'error',     cls: '' },
  WARNING:          { label: 'Warning',         labelAr: 'تحذير',                  icon: AlertTriangle,  variant: 'warning',   cls: '' },
  MANUAL_REVIEW:    { label: 'Manual Review',   labelAr: 'مراجعة يدوية',            icon: Eye,            variant: 'review',    cls: '' },
  RULE_STALE:       { label: 'Rule Stale',      labelAr: 'قاعدة منتهية الصلاحية', icon: Clock,          variant: 'secondary', cls: '' },
  NOT_APPLICABLE:   { label: 'N/A',             labelAr: 'غير مطبق',               icon: Minus,          variant: 'secondary', cls: 'opacity-60' },
  OVERRIDE_PENDING: { label: 'Override Pending',labelAr: 'استثناء قيد المراجعة',   icon: Clock,          variant: 'warning',   cls: '' },
}

interface ComplianceBadgeProps {
  result: ComplianceResult
  lang?: 'en' | 'ar'
  size?: 'sm' | 'default'
  showIcon?: boolean
}

export function ComplianceBadge({ result, lang = 'en', size = 'default', showIcon = true }: ComplianceBadgeProps) {
  const cfg = CONFIG[result] ?? CONFIG['NOT_APPLICABLE']
  const Icon = cfg.icon
  const label = lang === 'ar' ? cfg.labelAr : cfg.label

  return (
    <Badge
      variant={cfg.variant as any}
      className={cn('gap-1 font-medium', size === 'sm' && 'text-xs px-1.5 py-0', cfg.cls)}
    >
      {showIcon && <Icon className={cn('shrink-0', size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5')} />}
      {label}
    </Badge>
  )
}
