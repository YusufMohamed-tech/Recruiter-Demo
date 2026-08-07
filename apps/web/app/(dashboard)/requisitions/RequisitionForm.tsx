'use client'

import { useEffect, useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Dept = { id: string; name_en: string; name_ar: string }
type Estab = { id: string; name_en: string }

type FormData = {
  title_en: string
  title_ar: string
  department_id: string
  establishment_id: string
  headcount: number
  employment_type: string
  nationality_pref: string
  min_experience_years: number | ''
  education_level: string
  salary_min: number | ''
  salary_max: number | ''
  budget_approved: boolean
  justification_en: string
  justification_ar: string
  target_hire_date: string
}

const EMPTY: FormData = {
  title_en: '', title_ar: '', department_id: '', establishment_id: '',
  headcount: 1, employment_type: 'full_time', nationality_pref: 'any',
  min_experience_years: '', education_level: '', salary_min: '', salary_max: '',
  budget_approved: false, justification_en: '', justification_ar: '', target_hire_date: '',
}

interface Props {
  initial?: Partial<FormData> & { id?: string }
  onClose: () => void
  onSaved: (id: string) => void
}

export function RequisitionForm({ initial, onClose, onSaved }: Props) {
  const [form, setForm]     = useState<FormData>({ ...EMPTY, ...initial })
  const [depts, setDepts]   = useState<Dept[]>([])
  const [estabs, setEstabs] = useState<Estab[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/v1/departments').then(r => r.json()),
      fetch('/api/v1/establishments').then(r => r.json()),
    ]).then(([d, e]) => { setDepts(d); setEstabs(e) })
  }, [])

  const set = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const val = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value
    setForm(p => ({ ...p, [k]: val }))
  }

  async function save() {
    if (!form.title_en) { setError('Title (EN) is required'); return }
    setSaving(true); setError('')
    const payload = {
      ...form,
      headcount: Number(form.headcount),
      min_experience_years: form.min_experience_years !== '' ? Number(form.min_experience_years) : null,
      salary_min: form.salary_min !== '' ? Number(form.salary_min) : null,
      salary_max: form.salary_max !== '' ? Number(form.salary_max) : null,
      department_id:    form.department_id    || null,
      establishment_id: form.establishment_id || null,
      nationality_pref: form.nationality_pref || null,
      target_hire_date: form.target_hire_date || null,
    }
    const isEdit  = !!initial?.id
    const url     = isEdit ? `/api/v1/requisitions/${initial!.id}` : '/api/v1/requisitions'
    const method  = isEdit ? 'PATCH' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    setSaving(false)
    if (res.ok) {
      const data = await res.json()
      onSaved(data.id)
    } else {
      const err = await res.json()
      setError(err?.error?.message ?? JSON.stringify(err?.error) ?? 'Save failed')
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial?.id ? 'Edit Requisition' : 'New Requisition'}</DialogTitle>
          <DialogDescription>Fill in both English and Arabic fields for bilingual support.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Job Title (EN) *">
              <Input value={form.title_en} onChange={set('title_en')} placeholder="Software Engineer" />
            </Field>
            <Field label="Job Title (AR)">
              <Input value={form.title_ar} onChange={set('title_ar')} dir="rtl" className="text-right font-arabic" placeholder="مهندس برمجيات" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Department">
              <select value={form.department_id} onChange={set('department_id')}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="">— Select department —</option>
                {depts.map(d => <option key={d.id} value={d.id}>{d.name_en}</option>)}
              </select>
            </Field>
            <Field label="Establishment">
              <select value={form.establishment_id} onChange={set('establishment_id')}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="">— Select establishment —</option>
                {estabs.map(e => <option key={e.id} value={e.id}>{e.name_en}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Headcount *">
              <Input type="number" min={1} value={form.headcount} onChange={set('headcount')} />
            </Field>
            <Field label="Employment Type">
              <select value={form.employment_type} onChange={set('employment_type')}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="full_time">Full-time</option>
                <option value="part_time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </select>
            </Field>
            <Field label="Nationality Preference">
              <select value={form.nationality_pref} onChange={set('nationality_pref')}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="any">Any</option>
                <option value="saudi">Saudi only</option>
                <option value="non_saudi">Non-Saudi</option>
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Min Experience (yrs)">
              <Input type="number" min={0} value={form.min_experience_years} onChange={set('min_experience_years')} placeholder="0" />
            </Field>
            <Field label="Salary Min (SAR)">
              <Input type="number" min={0} value={form.salary_min} onChange={set('salary_min')} placeholder="5000" />
            </Field>
            <Field label="Salary Max (SAR)">
              <Input type="number" min={0} value={form.salary_max} onChange={set('salary_max')} placeholder="15000" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Education Level">
              <select value={form.education_level} onChange={set('education_level')}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="">— Any —</option>
                <option value="high_school">High School</option>
                <option value="diploma">Diploma</option>
                <option value="bachelor">Bachelor's</option>
                <option value="master">Master's</option>
                <option value="phd">PhD</option>
              </select>
            </Field>
            <Field label="Target Hire Date">
              <Input type="date" value={form.target_hire_date} onChange={set('target_hire_date')} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Justification (EN)">
              <textarea
                value={form.justification_en} onChange={set('justification_en')} rows={3}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Business reason for this hire…"
              />
            </Field>
            <Field label="Justification (AR)">
              <textarea
                value={form.justification_ar} onChange={set('justification_ar')} rows={3} dir="rtl"
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-right font-arabic"
                placeholder="مبرر التوظيف…"
              />
            </Field>
          </div>

          <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
            <input type="checkbox" checked={form.budget_approved} onChange={set('budget_approved')} className="rounded" />
            Budget approved
          </label>

          {error && <p className="text-sm text-status-error">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Requisition'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  )
}
