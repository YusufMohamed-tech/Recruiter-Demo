import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils/cn'

interface BilingualInputProps {
  labelEn: string
  labelAr?: string
  idEn: string
  idAr: string
  valueEn: string
  valueAr: string
  onChangeEn: (v: string) => void
  onChangeAr: (v: string) => void
  required?: boolean
  placeholderEn?: string
  placeholderAr?: string
  className?: string
}

export function BilingualInput({
  labelEn, labelAr, idEn, idAr,
  valueEn, valueAr, onChangeEn, onChangeAr,
  required, placeholderEn, placeholderAr, className,
}: BilingualInputProps) {
  return (
    <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2', className)}>
      <div className="space-y-1.5">
        <Label htmlFor={idEn}>{labelEn} {required && <span className="text-destructive">*</span>}</Label>
        <Input
          id={idEn}
          value={valueEn}
          onChange={e => onChangeEn(e.target.value)}
          placeholder={placeholderEn ?? `${labelEn} (English)`}
          required={required}
          dir="ltr"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={idAr}>{labelAr ?? `${labelEn} (Arabic)`}</Label>
        <Input
          id={idAr}
          value={valueAr}
          onChange={e => onChangeAr(e.target.value)}
          placeholder={placeholderAr ?? `${labelEn} (Arabic)`}
          dir="rtl"
          className="text-right font-arabic"
        />
      </div>
    </div>
  )
}
