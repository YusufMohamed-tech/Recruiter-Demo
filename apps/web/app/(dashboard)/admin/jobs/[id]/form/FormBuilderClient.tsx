'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Trash2, GripVertical, ChevronLeft, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type FieldType = 'text' | 'textarea' | 'select' | 'checkbox' | 'number' | 'date' | 'file'

type Field = {
  key: string
  type: FieldType
  label_en: string
  label_ar: string
  required: boolean
  options: string
  placeholder: string
}

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: 'text',     label: 'Short text'  },
  { value: 'textarea', label: 'Long text'   },
  { value: 'select',   label: 'Dropdown'    },
  { value: 'checkbox', label: 'Checkbox'    },
  { value: 'number',   label: 'Number'      },
  { value: 'date',     label: 'Date'        },
  { value: 'file',     label: 'File upload' },
]

function newField(): Field {
  return { key: crypto.randomUUID().slice(0, 8), type: 'text', label_en: '', label_ar: '', required: false, options: '', placeholder: '' }
}

export function FormBuilderClient({ jobId }: { jobId: string }) {
  const [fields, setFields] = useState<Field[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [version, setVersion] = useState<number | null>(null)

  useEffect(() => {
    fetch(`/api/v1/jobs/${jobId}/form`).then(r => r.json()).then(d => {
      if (d?.schema_json?.fields) {
        setFields(d.schema_json.fields.map((f: any) => ({
          ...f,
          options: Array.isArray(f.options) ? f.options.join('\n') : (f.options ?? ''),
        })))
        setVersion(d.version)
      }
      setLoading(false)
    })
  }, [jobId])

  function updateField(idx: number, patch: Partial<Field>) {
    setFields(fs => fs.map((f, i) => i === idx ? { ...f, ...patch } : f))
  }

  function addField() {
    setFields(fs => [...fs, newField()])
  }

  function removeField(idx: number) {
    setFields(fs => fs.filter((_, i) => i !== idx))
  }

  async function save() {
    setSaving(true); setSaved(false)
    const payload = {
      fields: fields.map(f => ({
        key:         f.key,
        type:        f.type,
        label_en:    f.label_en,
        label_ar:    f.label_ar || undefined,
        required:    f.required,
        placeholder: f.placeholder || undefined,
        options:     f.type === 'select' ? f.options.split('\n').map(s => s.trim()).filter(Boolean) : undefined,
      })).filter(f => f.label_en),
    }
    const res = await fetch(`/api/v1/jobs/${jobId}/form`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    setSaving(false)
    if (res.ok) {
      const d = await res.json()
      setVersion(d.version)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  if (loading) return <p className="py-12 text-center text-sm text-muted-foreground">Loading…</p>

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Link href={`/jobs`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Back to jobs
        </Link>
        <div className="flex items-center gap-3">
          {version && <span className="text-xs text-muted-foreground">v{version} saved</span>}
          {saved && <span className="text-xs text-brand-green font-medium">Saved!</span>}
          <Button size="sm" onClick={save} disabled={saving}>
            <Save className="me-1.5 h-4 w-4" />{saving ? 'Saving…' : 'Save Form'}
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-2">
        <div className="mb-3 px-3 py-2 rounded-md bg-muted/50">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Standard Fields (always included)</p>
          <p className="mt-1 text-xs text-muted-foreground">Full name, Email, Phone, City, Nationality, Current title, Years of experience, Education, LinkedIn URL</p>
        </div>

        <div className="space-y-3 px-1">
          {fields.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">No custom fields yet. Add one below.</p>
          )}
          {fields.map((f, i) => (
            <div key={f.key} className="rounded-lg border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Field {i + 1}</span>
                </div>
                <button onClick={() => removeField(i)} className="rounded p-1 hover:bg-muted">
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Label (EN) *</Label>
                  <Input value={f.label_en} onChange={e => updateField(i, { label_en: e.target.value })} placeholder="e.g. Portfolio URL" />
                </div>
                <div className="space-y-1">
                  <Label>Label (AR)</Label>
                  <Input value={f.label_ar} onChange={e => updateField(i, { label_ar: e.target.value })} dir="rtl" className="text-right font-arabic" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Field Type</Label>
                  <select value={f.type} onChange={e => updateField(i, { type: e.target.value as FieldType })}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                    {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>Placeholder</Label>
                  <Input value={f.placeholder} onChange={e => updateField(i, { placeholder: e.target.value })} />
                </div>
              </div>

              {f.type === 'select' && (
                <div className="space-y-1">
                  <Label>Options (one per line)</Label>
                  <textarea
                    rows={4}
                    value={f.options}
                    onChange={e => updateField(i, { options: e.target.value })}
                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    placeholder="Option A&#10;Option B&#10;Option C"
                  />
                </div>
              )}

              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={f.required} onChange={e => updateField(i, { required: e.target.checked })} className="rounded" />
                Required field
              </label>
            </div>
          ))}
        </div>

        <div className="mt-3 px-1">
          <Button variant="outline" size="sm" onClick={addField} className="w-full border-dashed">
            <Plus className="me-1.5 h-4 w-4" />Add custom field
          </Button>
        </div>
      </div>
    </div>
  )
}
