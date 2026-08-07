'use client'

import { useEffect, useState } from 'react'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

type Criterion = {
  key: string
  label_en: string
  label_ar?: string
  weight: number
  type: 'rating' | 'text' | 'yesno'
}

type Template = {
  id: string
  name: string
  criteria: Criterion[]
}

type Interviewer = { user_id: string; users: { id: string; name_en: string; email: string } }

type ExistingScorecard = {
  id: string
  overall_rating?: number
  recommendation: string
  strengths?: string
  concerns?: string
  submitted_at?: string
  interviewer?: { id: string; name_en: string }
}

type Props = {
  interviewId: string
  interviewers: Interviewer[]
  existingScorecards: ExistingScorecard[]
  onSubmitted: () => void
}

const RECOMMENDATIONS = [
  { value: 'strong_hire',    label: 'Strong Hire' },
  { value: 'hire',           label: 'Hire' },
  { value: 'neutral',        label: 'Neutral' },
  { value: 'no_hire',        label: 'No Hire' },
  { value: 'strong_no_hire', label: 'Strong No Hire' },
]

const REC_COLOR: Record<string, string> = {
  strong_hire:    'border-green-500 bg-green-500/10 text-green-700',
  hire:           'border-green-400 bg-green-400/10 text-green-700',
  neutral:        'border-border bg-muted text-muted-foreground',
  no_hire:        'border-status-error bg-status-error/10 text-status-error',
  strong_no_hire: 'border-status-error bg-status-error/15 text-status-error',
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className={`text-xl transition-colors ${(hover || value) >= star ? 'text-brand-green' : 'text-muted'}`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

export function ScorecardForm({ interviewId, interviewers, existingScorecards, onSubmitted }: Props) {
  const [templates, setTemplates]       = useState<Template[]>([])
  const [selectedTemplate, setTemplate] = useState<Template | null>(null)
  const [scores, setScores]             = useState<Record<string, { rating: number; notes: string }>>({})
  const [overallRating, setOverallRating] = useState(0)
  const [recommendation, setRecommendation] = useState('neutral')
  const [strengths, setStrengths]       = useState('')
  const [concerns, setConcerns]         = useState('')
  const [saving, setSaving]             = useState(false)
  const [saved, setSaved]               = useState(false)
  const [error, setError]               = useState('')

  useEffect(() => {
    fetch('/api/v1/scorecard-templates').then(r => r.json()).then(d => {
      if (Array.isArray(d) && d.length > 0) {
        setTemplates(d)
        setTemplate(d[0])
      }
    })
  }, [])

  function updateScore(key: string, field: 'rating' | 'notes', value: string | number) {
    setScores(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }))
  }

  async function submit() {
    setSaving(true); setError(''); setSaved(false)
    const res = await fetch(`/api/v1/interviews/${interviewId}/scorecard`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        template_id:    selectedTemplate?.id,
        scores,
        overall_rating: overallRating || undefined,
        recommendation,
        strengths:      strengths || undefined,
        concerns:       concerns || undefined,
      }),
    })
    setSaving(false)
    if (res.ok) {
      setSaved(true)
      onSubmitted()
      setTimeout(() => setSaved(false), 4000)
    } else {
      const d = await res.json()
      setError(d?.error?.message ?? d?.error ?? 'Failed to submit scorecard')
    }
  }

  return (
    <div className="space-y-6">
      {/* Submitted scorecards */}
      {existingScorecards.length > 0 && (
        <div>
          <p className="text-sm font-semibold mb-3">Submitted Scorecards ({existingScorecards.length})</p>
          <div className="space-y-3">
            {existingScorecards.map(sc => {
              const recInfo = { label: sc.recommendation.replace(/_/g,' '), color: REC_COLOR[sc.recommendation] ?? 'bg-muted' }
              return (
                <div key={sc.id} className="rounded-xl border bg-card p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">{sc.interviewer?.name_en}</p>
                    <div className="flex items-center gap-2">
                      {sc.overall_rating && (
                        <span className="text-sm font-bold">{'★'.repeat(Math.round(sc.overall_rating))} {sc.overall_rating}/5</span>
                      )}
                      <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${recInfo.color}`}>
                        {recInfo.label}
                      </span>
                    </div>
                  </div>
                  {sc.strengths && <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Strengths:</span> {sc.strengths}</p>}
                  {sc.concerns  && <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Concerns:</span> {sc.concerns}</p>}
                  {sc.submitted_at && (
                    <p className="text-xs text-muted-foreground">Submitted {new Date(sc.submitted_at).toLocaleString()}</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Submit / update my scorecard */}
      <div className="rounded-xl border bg-card p-5 space-y-5">
        <p className="font-semibold text-sm">My Scorecard</p>

        {/* Template selector */}
        {templates.length > 0 && (
          <div className="space-y-1">
            <Label>Template</Label>
            <select
              value={selectedTemplate?.id ?? ''}
              onChange={e => setTemplate(templates.find(t => t.id === e.target.value) ?? null)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">No template (free-form)</option>
              {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        )}

        {/* Template criteria */}
        {selectedTemplate && selectedTemplate.criteria.length > 0 && (
          <div className="space-y-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Criteria</p>
            {selectedTemplate.criteria.map(c => (
              <div key={c.key} className="space-y-1.5">
                <Label>{c.label_en}</Label>
                {c.type === 'rating' && (
                  <div className="space-y-1">
                    <StarRating value={scores[c.key]?.rating ?? 0} onChange={v => updateScore(c.key, 'rating', v)} />
                    <input
                      type="text"
                      value={scores[c.key]?.notes ?? ''}
                      onChange={e => updateScore(c.key, 'notes', e.target.value)}
                      placeholder="Notes…"
                      className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>
                )}
                {c.type === 'text' && (
                  <textarea
                    value={scores[c.key]?.notes ?? ''}
                    onChange={e => updateScore(c.key, 'notes', e.target.value)}
                    rows={2}
                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                )}
                {c.type === 'yesno' && (
                  <div className="flex gap-3">
                    {['yes','no'].map(v => (
                      <label key={v} className="flex items-center gap-2 cursor-pointer text-sm">
                        <input
                          type="radio"
                          name={`yesno-${c.key}`}
                          value={v}
                          checked={scores[c.key]?.notes === v}
                          onChange={() => updateScore(c.key, 'notes', v)}
                        />
                        {v.charAt(0).toUpperCase() + v.slice(1)}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Overall rating */}
        <div className="space-y-1.5">
          <Label>Overall Rating</Label>
          <StarRating value={overallRating} onChange={setOverallRating} />
        </div>

        {/* Recommendation */}
        <div className="space-y-2">
          <Label>Recommendation</Label>
          <div className="flex flex-wrap gap-2">
            {RECOMMENDATIONS.map(r => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRecommendation(r.value)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                  recommendation === r.value ? REC_COLOR[r.value] : 'border-border text-muted-foreground hover:border-foreground'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <Label>Strengths</Label>
          <textarea
            value={strengths}
            onChange={e => setStrengths(e.target.value)}
            rows={2}
            placeholder="Key strengths observed…"
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>

        <div className="space-y-1">
          <Label>Concerns</Label>
          <textarea
            value={concerns}
            onChange={e => setConcerns(e.target.value)}
            rows={2}
            placeholder="Areas of concern or gaps…"
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>

        {error && <p className="text-sm text-status-error">{error}</p>}
        {saved && (
          <div className="flex items-center gap-2 text-sm text-status-success">
            <CheckCircle2 className="h-4 w-4" />Scorecard submitted successfully
          </div>
        )}

        <Button onClick={submit} disabled={saving} className="w-full">
          {saving && <Loader2 className="me-1.5 h-4 w-4 animate-spin" />}
          Submit Scorecard
        </Button>
      </div>
    </div>
  )
}
