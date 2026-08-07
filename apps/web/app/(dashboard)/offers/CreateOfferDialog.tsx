'use client'

import { useEffect, useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Application = {
  id: string
  candidates?: { name_en: string }
  job_postings?: { title_en: string }
}

type Props = {
  applicationId?: string
  onClose: () => void
  onCreated: (offerId: string) => void
}

const ALLOWANCE_KEYS = [
  { key: 'housing',     label: 'Housing' },
  { key: 'transport',   label: 'Transport' },
  { key: 'food',        label: 'Food' },
  { key: 'other',       label: 'Other' },
]

const BENEFIT_OPTIONS = [
  'Medical Insurance', 'Annual Leave (21 days)', 'Annual Leave (30 days)',
  'Flight Allowance', 'End of Service', 'GOSI', 'Performance Bonus',
]

export function CreateOfferDialog({ applicationId, onClose, onCreated }: Props) {
  const [applications, setApplications] = useState<Application[]>([])
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  const [appId, setAppId]             = useState(applicationId ?? '')
  const [jobTitle, setJobTitle]       = useState('')
  const [startDate, setStartDate]     = useState('')
  const [baseSalary, setBaseSalary]   = useState('')
  const [currency, setCurrency]       = useState('SAR')
  const [allowances, setAllowances]   = useState<Record<string, string>>({})
  const [benefits, setBenefits]       = useState<string[]>([])
  const [termsEn, setTermsEn]         = useState('')
  const [termsAr, setTermsAr]         = useState('')
  const [expiresAt, setExpiresAt]     = useState('')

  useEffect(() => {
    if (!applicationId) {
      fetch('/api/v1/applications?limit=100&status=active')
        .then(r => r.json())
        .then(d => setApplications(Array.isArray(d) ? d : []))
    }
  }, [applicationId])

  function toggleBenefit(b: string) {
    setBenefits(prev => prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b])
  }

  async function submit() {
    if (!appId)     { setError('Select an application'); return }
    if (!jobTitle)  { setError('Job title is required'); return }
    setSaving(true); setError('')

    const allowancesNum = Object.fromEntries(
      Object.entries(allowances)
        .filter(([, v]) => v !== '')
        .map(([k, v]) => [k, parseFloat(v)])
    )

    const res = await fetch('/api/v1/offers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        application_id: appId,
        job_title:      jobTitle,
        start_date:     startDate || undefined,
        base_salary:    baseSalary ? parseFloat(baseSalary) : undefined,
        currency,
        allowances:     allowancesNum,
        benefits,
        terms_en:       termsEn || undefined,
        terms_ar:       termsAr || undefined,
        expires_at:     expiresAt ? new Date(expiresAt).toISOString() : undefined,
      }),
    })
    setSaving(false)
    if (res.ok) {
      const d = await res.json()
      onCreated(d.id)
    } else {
      const d = await res.json()
      setError(d?.error?.message ?? d?.error ?? 'Failed to create offer')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl rounded-xl border bg-card shadow-xl overflow-y-auto max-h-[92vh]">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-heading text-lg font-semibold">Create Offer Package</h2>
          <button onClick={onClose} className="rounded p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>

        <div className="p-5 space-y-4">
          {!applicationId && (
            <div className="space-y-1">
              <Label>Application *</Label>
              <select
                value={appId}
                onChange={e => setAppId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Select application…</option>
                {applications.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.candidates?.name_en} — {a.job_postings?.title_en}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1 col-span-2">
              <Label>Job Title *</Label>
              <Input value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="e.g. Senior Software Engineer" />
            </div>
            <div className="space-y-1">
              <Label>Start Date</Label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Offer Expiry</Label>
              <Input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1 col-span-2">
              <Label>Base Salary</Label>
              <Input type="number" min={0} value={baseSalary} onChange={e => setBaseSalary(e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-1">
              <Label>Currency</Label>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="SAR">SAR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Allowances ({currency}/month)</p>
            <div className="grid grid-cols-2 gap-2">
              {ALLOWANCE_KEYS.map(a => (
                <div key={a.key} className="space-y-0.5">
                  <Label className="text-xs">{a.label}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={allowances[a.key] ?? ''}
                    onChange={e => setAllowances(prev => ({ ...prev, [a.key]: e.target.value }))}
                    placeholder="0"
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Benefits</p>
            <div className="grid grid-cols-2 gap-1.5">
              {BENEFIT_OPTIONS.map(b => (
                <label key={b} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={benefits.includes(b)} onChange={() => toggleBenefit(b)} className="rounded" />
                  {b}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <Label>Terms & Conditions (EN)</Label>
            <textarea
              value={termsEn}
              onChange={e => setTermsEn(e.target.value)}
              rows={4}
              placeholder="Employment terms, conditions, probation period…"
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-1">
            <Label>Terms & Conditions (AR)</Label>
            <textarea
              value={termsAr}
              onChange={e => setTermsAr(e.target.value)}
              rows={3}
              dir="rtl"
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm font-arabic shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-right"
            />
          </div>

          {error && <p className="text-sm text-status-error">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 p-5 border-t">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>
            {saving && <Loader2 className="me-1.5 h-4 w-4 animate-spin" />}Create Offer
          </Button>
        </div>
      </div>
    </div>
  )
}
