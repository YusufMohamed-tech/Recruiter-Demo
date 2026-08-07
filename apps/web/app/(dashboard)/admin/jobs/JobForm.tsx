'use client'

import { useEffect, useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Dept  = { id: string; name_en: string }
type Estab = { id: string; name_en: string }

type FormData = {
  title_en: string; title_ar: string
  summary_en: string; summary_ar: string
  description_en: string; description_ar: string
  requirements_en: string; requirements_ar: string
  department_id: string; establishment_id: string
  city: string; employment_type: string
  nationality_req: string
  min_experience_years: number | ''
  education_level: string
  salary_visible: boolean; salary_min: number | ''; salary_max: number | ''
  deadline: string
  seo_title: string; seo_description: string
}

const EMPTY: FormData = {
  title_en: '', title_ar: '', summary_en: '', summary_ar: '',
  description_en: '', description_ar: '', requirements_en: '', requirements_ar: '',
  department_id: '', establishment_id: '', city: '', employment_type: 'full_time',
  nationality_req: '', min_experience_years: '', education_level: '',
  salary_visible: false, salary_min: '', salary_max: '',
  deadline: '', seo_title: '', seo_description: '',
}

const TABS = ['Basic', 'Content', 'Requirements', 'SEO'] as const

interface Props {
  id?: string
  onClose: () => void
  onSaved: () => void
}

export function JobForm({ id, onClose, onSaved }: Props) {
  const [form, setForm]     = useState<FormData>(EMPTY)
  const [depts, setDepts]   = useState<Dept[]>([])
  const [estabs, setEstabs] = useState<Estab[]>([])
  const [tab, setTab]       = useState<typeof TABS[number]>('Basic')
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/v1/departments').then(r => r.json()),
      fetch('/api/v1/establishments').then(r => r.json()),
    ]).then(([d, e]) => { setDepts(d); setEstabs(e) })

    if (id) {
      fetch(`/api/v1/jobs/${id}`).then(r => r.json()).then(d => {
        setForm({
          title_en: d.title_en ?? '', title_ar: d.title_ar ?? '',
          summary_en: d.summary_en ?? '', summary_ar: d.summary_ar ?? '',
          description_en: d.description_en ?? '', description_ar: d.description_ar ?? '',
          requirements_en: d.requirements_en ?? '', requirements_ar: d.requirements_ar ?? '',
          department_id: d.department_id ?? '', establishment_id: d.establishment_id ?? '',
          city: d.city ?? '', employment_type: d.employment_type ?? 'full_time',
          nationality_req: d.nationality_req ?? '',
          min_experience_years: d.min_experience_years ?? '',
          education_level: d.education_level ?? '',
          salary_visible: d.salary_visible ?? false,
          salary_min: d.salary_min ?? '', salary_max: d.salary_max ?? '',
          deadline: d.deadline ?? '',
          seo_title: d.seo_title ?? '', seo_description: d.seo_description ?? '',
        })
      })
    }
  }, [id])

  const set = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const val = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value
    setForm(p => ({ ...p, [k]: val }))
  }

  async function save() {
    if (!form.title_en) { setError('Title (EN) is required'); return }
    setSaving(true); setError('')

    const payload = {
      ...form,
      min_experience_years: form.min_experience_years !== '' ? Number(form.min_experience_years) : null,
      salary_min: form.salary_min !== '' ? Number(form.salary_min) : null,
      salary_max: form.salary_max !== '' ? Number(form.salary_max) : null,
      department_id:    form.department_id    || null,
      establishment_id: form.establishment_id || null,
      nationality_req:  form.nationality_req  || null,
      education_level:  form.education_level  || null,
      deadline:         form.deadline         || null,
    }

    const url    = id ? `/api/v1/jobs/${id}` : '/api/v1/jobs'
    const method = id ? 'PATCH' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    setSaving(false)
    if (res.ok) onSaved()
    else { const d = await res.json(); setError(d?.error?.message ?? 'Save failed') }
  }

  const TA = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea
      {...props}
      className={`flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${props.className ?? ''}`}
    />
  )

  const SEL = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
    <select
      {...props}
      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    />
  )

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{id ? 'Edit Job Posting' : 'New Job Posting'}</DialogTitle>
          <DialogDescription>Fill EN and AR fields for full bilingual support.</DialogDescription>
        </DialogHeader>

        {/* Mini tab bar */}
        <div className="flex gap-1 border-b pb-0 -mx-1">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t ? 'border-brand-green text-brand-dark' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}>
              {t}
            </button>
          ))}
        </div>

        <div className="space-y-4 py-2 min-h-[320px]">
          {tab === 'Basic' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Title (EN) *"><Input value={form.title_en} onChange={set('title_en')} /></Field>
                <Field label="Title (AR)"><Input value={form.title_ar} onChange={set('title_ar')} dir="rtl" className="text-right font-arabic" /></Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Department">
                  <SEL value={form.department_id} onChange={set('department_id')}>
                    <option value="">— Select —</option>
                    {depts.map(d => <option key={d.id} value={d.id}>{d.name_en}</option>)}
                  </SEL>
                </Field>
                <Field label="Establishment">
                  <SEL value={form.establishment_id} onChange={set('establishment_id')}>
                    <option value="">— Select —</option>
                    {estabs.map(e => <option key={e.id} value={e.id}>{e.name_en}</option>)}
                  </SEL>
                </Field>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Field label="City"><Input value={form.city} onChange={set('city')} placeholder="Riyadh" /></Field>
                <Field label="Employment Type">
                  <SEL value={form.employment_type} onChange={set('employment_type')}>
                    <option value="full_time">Full-time</option>
                    <option value="part_time">Part-time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                  </SEL>
                </Field>
                <Field label="Deadline"><Input type="date" value={form.deadline} onChange={set('deadline')} /></Field>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Field label="Min Experience (yrs)"><Input type="number" min={0} value={form.min_experience_years} onChange={set('min_experience_years')} /></Field>
                <Field label="Salary Min (SAR)"><Input type="number" min={0} value={form.salary_min} onChange={set('salary_min')} /></Field>
                <Field label="Salary Max (SAR)"><Input type="number" min={0} value={form.salary_max} onChange={set('salary_max')} /></Field>
              </div>
              <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                <input type="checkbox" checked={form.salary_visible} onChange={set('salary_visible')} className="rounded" />
                Show salary range on public listing
              </label>
            </>
          )}

          {tab === 'Content' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Summary (EN)"><TA rows={4} value={form.summary_en} onChange={set('summary_en')} placeholder="1–2 sentence hook…" /></Field>
                <Field label="Summary (AR)"><TA rows={4} value={form.summary_ar} onChange={set('summary_ar')} dir="rtl" className="text-right font-arabic" placeholder="ملخص الوظيفة…" /></Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Full Description (EN)"><TA rows={8} value={form.description_en} onChange={set('description_en')} /></Field>
                <Field label="Full Description (AR)"><TA rows={8} value={form.description_ar} onChange={set('description_ar')} dir="rtl" className="text-right font-arabic" /></Field>
              </div>
            </>
          )}

          {tab === 'Requirements' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Requirements (EN)"><TA rows={10} value={form.requirements_en} onChange={set('requirements_en')} placeholder="• Bachelor's degree&#10;• 3+ years experience…" /></Field>
                <Field label="Requirements (AR)"><TA rows={10} value={form.requirements_ar} onChange={set('requirements_ar')} dir="rtl" className="text-right font-arabic" placeholder="• درجة البكالوريوس&#10;• خبرة 3 سنوات…" /></Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Education Level">
                  <SEL value={form.education_level} onChange={set('education_level')}>
                    <option value="">— Any —</option>
                    <option value="high_school">High School</option>
                    <option value="diploma">Diploma</option>
                    <option value="bachelor">Bachelor's</option>
                    <option value="master">Master's</option>
                    <option value="phd">PhD</option>
                  </SEL>
                </Field>
                <Field label="Nationality Requirement">
                  <SEL value={form.nationality_req} onChange={set('nationality_req')}>
                    <option value="">— Any —</option>
                    <option value="saudi">Saudi only</option>
                    <option value="non_saudi">Non-Saudi</option>
                  </SEL>
                </Field>
              </div>
            </>
          )}

          {tab === 'SEO' && (
            <>
              <Field label="SEO Title"><Input value={form.seo_title} onChange={set('seo_title')} placeholder="Software Engineer — Chessboard Group" /></Field>
              <Field label="SEO Description">
                <TA rows={3} value={form.seo_description} onChange={set('seo_description')} placeholder="Join our team as a Software Engineer…" />
              </Field>
              <p className="text-xs text-muted-foreground">These override the auto-generated meta tags on the public job detail page.</p>
            </>
          )}
        </div>

        {error && <p className="text-sm text-status-error">{error}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
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
