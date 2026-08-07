'use client'

import { useEffect, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Reason = { id: string; reason_en: string; reason_ar?: string }

export function RejectionReasonsClient() {
  const [reasons, setReasons] = useState<Reason[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving]    = useState(false)
  const [error, setError]      = useState('')
  const [reasonEn, setReasonEn] = useState('')
  const [reasonAr, setReasonAr] = useState('')

  async function load() {
    setLoading(true)
    const res  = await fetch('/api/v1/rejection-reasons')
    const data = await res.json()
    setReasons(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { void load() }, [])

  async function save() {
    if (!reasonEn.trim()) { setError('English reason is required'); return }
    setSaving(true); setError('')
    const res = await fetch('/api/v1/rejection-reasons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason_en: reasonEn, reason_ar: reasonAr || undefined }),
    })
    setSaving(false)
    if (res.ok) {
      setReasonEn(''); setReasonAr(''); setShowForm(false)
      await load()
    } else {
      const d = await res.json()
      setError(d?.error?.message ?? 'Failed to save')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowForm(v => !v)}>
          <Plus className="me-1.5 h-4 w-4" />Add Reason
        </Button>
      </div>

      {showForm && (
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-medium text-sm">New Rejection Reason</p>
            <button onClick={() => { setShowForm(false); setError('') }} className="rounded p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Reason (EN) *</Label>
              <Input value={reasonEn} onChange={e => setReasonEn(e.target.value)} placeholder="e.g. Insufficient experience" />
            </div>
            <div className="space-y-1">
              <Label>Reason (AR)</Label>
              <Input value={reasonAr} onChange={e => setReasonAr(e.target.value)} dir="rtl" className="text-right" placeholder="خبرة غير كافية" />
            </div>
          </div>
          {error && <p className="text-sm text-status-error">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => { setShowForm(false); setError('') }}>Cancel</Button>
            <Button size="sm" onClick={save} disabled={saving}>Save</Button>
          </div>
        </div>
      )}

      {loading && <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>}
      {!loading && reasons.length === 0 && !showForm && (
        <p className="py-8 text-center text-sm text-muted-foreground">No rejection reasons added yet.</p>
      )}

      <div className="rounded-lg border divide-y">
        {reasons.map(r => (
          <div key={r.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium">{r.reason_en}</p>
              {r.reason_ar && <p className="text-xs text-muted-foreground font-arabic" dir="rtl">{r.reason_ar}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
