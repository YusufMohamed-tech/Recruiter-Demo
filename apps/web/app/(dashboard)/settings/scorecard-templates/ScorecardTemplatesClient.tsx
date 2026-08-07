'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Criterion = {
  key: string
  label_en: string
  label_ar: string
  weight: number
  type: 'rating' | 'text' | 'yesno'
}

type Template = {
  id: string
  name: string
  interview_type?: string
  criteria: Criterion[]
  is_active: boolean
  created_at: string
}

const TYPE_LABELS: Record<string, string> = {
  hr: 'HR', technical: 'Technical', panel: 'Panel', final: 'Final', assessment: 'Assessment',
}

function newCriterion(): Criterion {
  return { key: crypto.randomUUID().slice(0,8), label_en: '', label_ar: '', weight: 1, type: 'rating' }
}

export function ScorecardTemplatesClient() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading]     = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')

  const [name, setName]               = useState('')
  const [interviewType, setIvType]    = useState('')
  const [criteria, setCriteria]       = useState<Criterion[]>([newCriterion()])

  async function load() {
    setLoading(true)
    const res  = await fetch('/api/v1/scorecard-templates')
    const data = await res.json()
    setTemplates(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { void load() }, [])

  function updateCriterion(idx: number, patch: Partial<Criterion>) {
    setCriteria(prev => prev.map((c, i) => i === idx ? { ...c, ...patch } : c))
  }

  function addCriterion() { setCriteria(prev => [...prev, newCriterion()]) }
  function removeCriterion(idx: number) { setCriteria(prev => prev.filter((_, i) => i !== idx)) }

  function resetForm() {
    setName(''); setIvType(''); setCriteria([newCriterion()]); setError('')
  }

  async function save() {
    if (!name.trim()) { setError('Name is required'); return }
    const valid = criteria.filter(c => c.label_en.trim())
    if (valid.length === 0) { setError('At least one criterion with a label is required'); return }
    setSaving(true); setError('')
    const res = await fetch('/api/v1/scorecard-templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        interview_type: interviewType || null,
        criteria: valid.map(c => ({ key: c.key, label_en: c.label_en, label_ar: c.label_ar || undefined, weight: c.weight, type: c.type })),
      }),
    })
    setSaving(false)
    if (res.ok) {
      resetForm()
      setShowForm(false)
      await load()
    } else {
      const d = await res.json()
      setError(d?.error?.message ?? d?.error ?? 'Failed to save')
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => { resetForm(); setShowForm(true) }}>
          <Plus className="me-1.5 h-4 w-4" />New Template
        </Button>
      </div>

      {loading && <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>}

      {!loading && templates.length === 0 && !showForm && (
        <p className="py-8 text-center text-sm text-muted-foreground">No scorecard templates yet.</p>
      )}

      {/* Templates list */}
      {templates.map(t => (
        <div key={t.id} className="rounded-xl border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">{t.name}</p>
              {t.interview_type && (
                <p className="text-xs text-muted-foreground">{TYPE_LABELS[t.interview_type] ?? t.interview_type} interview</p>
              )}
            </div>
            <span className="text-xs text-muted-foreground">{t.criteria.length} criteria</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {t.criteria.map(c => (
              <div key={c.key} className="rounded-md bg-muted/60 px-2.5 py-1 text-xs">
                <span className="font-medium">{c.label_en}</span>
                <span className="text-muted-foreground ml-1">({c.type}, w:{c.weight})</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Create form */}
      {showForm && (
        <div className="rounded-xl border bg-card p-5 space-y-5">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-sm">New Scorecard Template</p>
            <button onClick={() => { setShowForm(false); resetForm() }} className="rounded p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Template Name *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Technical Interview" />
            </div>
            <div className="space-y-1">
              <Label>Interview Type (optional)</Label>
              <select
                value={interviewType}
                onChange={e => setIvType(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">All types</option>
                {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Criteria *</p>
              <Button size="sm" variant="outline" onClick={addCriterion}>
                <Plus className="me-1 h-3.5 w-3.5" />Add Criterion
              </Button>
            </div>

            {criteria.map((c, i) => (
              <div key={c.key} className="rounded-lg border bg-muted/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">Criterion {i + 1}</span>
                  {criteria.length > 1 && (
                    <button onClick={() => removeCriterion(i)} className="rounded p-0.5 hover:bg-muted">
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Label (EN) *</Label>
                    <Input value={c.label_en} onChange={e => updateCriterion(i, { label_en: e.target.value })} placeholder="e.g. Problem Solving" />
                  </div>
                  <div className="space-y-1">
                    <Label>Label (AR)</Label>
                    <Input value={c.label_ar} onChange={e => updateCriterion(i, { label_ar: e.target.value })} dir="rtl" className="text-right" placeholder="حل المشكلات" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Type</Label>
                    <select
                      value={c.type}
                      onChange={e => updateCriterion(i, { type: e.target.value as Criterion['type'] })}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="rating">Star rating (1-5)</option>
                      <option value="text">Free text</option>
                      <option value="yesno">Yes / No</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label>Weight</Label>
                    <Input type="number" min={1} max={10} value={c.weight} onChange={e => updateCriterion(i, { weight: Number(e.target.value) })} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {error && <p className="text-sm text-status-error">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setShowForm(false); resetForm() }}>Cancel</Button>
            <Button onClick={save} disabled={saving}>Save Template</Button>
          </div>
        </div>
      )}
    </div>
  )
}
