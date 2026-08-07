'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, Star, Loader2, ChevronRight, AlertCircle, CheckCircle2, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScheduleInterviewDialog } from '../../interviews/ScheduleInterviewDialog'

type StageEvent = {
  id: string
  from_stage?: string
  to_stage: string
  notes?: string
  created_at: string
  users?: { name_en: string }
}

type Application = {
  id: string
  current_stage: string
  status: string
  ai_match_score?: number
  ai_match_breakdown?: {
    overall_score: number
    breakdown: Record<string, { score: number; notes_en: string }>
    strengths_en: string[]
    gaps_en: string[]
    recommendation_en: string
  }
  assigned_to?: string
  created_at: string
  updated_at: string
  candidates?: {
    id: string; name_en: string; name_ar?: string; email: string; phone?: string
    current_title?: string; current_city?: string; nationality?: string
    total_experience_years?: number; education_level?: string; linkedin_url?: string
  }
  job_postings?: {
    id: string; title_en: string; slug: string
    min_experience_years?: number; education_level?: string
    requirements_en?: string
    departments?: { name_en: string }
  }
  application_stage_events?: StageEvent[]
}

const STAGES = ['applied','screening','shortlisted','interview','assessment','offer','hired']
const STAGE_LABELS: Record<string, string> = {
  applied: 'Applied', screening: 'Screening', shortlisted: 'Shortlisted',
  interview: 'Interview', assessment: 'Assessment', offer: 'Offer', hired: 'Hired', rejected: 'Rejected',
}
const EDU_LABELS: Record<string, string> = {
  high_school: 'High School', diploma: 'Diploma', bachelor: "Bachelor's", master: "Master's", phd: 'PhD',
}

function ScoreBar({ score, label }: { score: number; label: string }) {
  const color = score >= 75 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-400'
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground capitalize">{label}</span>
        <span className="font-medium">{score}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  )
}

export function ApplicationWorkspace({ id }: { id: string }) {
  const [app, setApp]         = useState<Application | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab]         = useState<'overview' | 'timeline' | 'actions' | 'interviews' | 'comms'>('overview')
  const [showSchedule, setShowSchedule] = useState(false)

  // Actions state
  const [advancing, setAdvancing]   = useState(false)
  const [advanceTo, setAdvanceTo]   = useState('')
  const [advanceNote, setAdvNote]   = useState('')
  const [rejecting, setRejecting]   = useState(false)
  const [rejectNote, setRejectNote] = useState('')
  const [scoring, setScoring]       = useState(false)
  const [parsing, setParsing]       = useState(false)
  const [cvText, setCvText]         = useState('')
  const [showCvInput, setShowCvInput] = useState(false)
  const [actionMsg, setActionMsg]     = useState('')
  const [actionErr, setActionErr]     = useState('')

  useEffect(() => {
    fetch(`/api/v1/applications/${id}`)
      .then(r => r.json())
      .then(d => { setApp(d); setLoading(false) })
  }, [id])

  function notify(msg: string, err?: boolean) {
    err ? setActionErr(msg) : setActionMsg(msg)
    setTimeout(() => { setActionMsg(''); setActionErr('') }, 3500)
  }

  async function advance() {
    if (!advanceTo) return
    setAdvancing(true)
    const res = await fetch(`/api/v1/applications/${id}/advance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to_stage: advanceTo, notes: advanceNote || undefined }),
    })
    setAdvancing(false)
    if (res.ok) {
      setApp(a => a ? { ...a, current_stage: advanceTo } : a)
      setAdvanceTo(''); setAdvNote('')
      notify(`Advanced to ${STAGE_LABELS[advanceTo]}`)
    } else {
      const d = await res.json()
      notify(d?.error ?? 'Failed to advance', true)
    }
  }

  async function reject() {
    setRejecting(true)
    const res = await fetch(`/api/v1/applications/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: rejectNote || undefined }),
    })
    setRejecting(false)
    if (res.ok) {
      setApp(a => a ? { ...a, status: 'rejected' } : a)
      setRejectNote('')
      notify('Application rejected')
    } else {
      notify('Failed to reject', true)
    }
  }

  async function runScore() {
    setScoring(true)
    const res = await fetch(`/api/v1/applications/${id}/score`, { method: 'POST' })
    setScoring(false)
    if (res.ok) {
      const d = await res.json()
      setApp(a => a ? { ...a, ai_match_score: d.score, ai_match_breakdown: d.breakdown } : a)
      notify(`Match score: ${d.score.toFixed(0)}%`)
    } else {
      notify('Scoring failed', true)
    }
  }

  async function runParse() {
    if (!cvText.trim()) return
    setParsing(true)
    const res = await fetch(`/api/v1/applications/${id}/parse-cv`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cv_text: cvText }),
    })
    setParsing(false)
    if (res.ok) {
      notify('CV parsed and profile updated')
      setShowCvInput(false)
      setCvText('')
    } else {
      notify('CV parsing failed', true)
    }
  }

  if (loading) return <div className="py-12 text-center text-sm text-muted-foreground">Loading…</div>
  if (!app) return <div className="py-12 text-center text-sm text-muted-foreground">Application not found.</div>

  const c    = app.candidates
  const j    = app.job_postings
  const bd   = app.ai_match_breakdown
  const isRejected = app.status === 'rejected'
  const currentIdx = STAGES.indexOf(app.current_stage)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/applications" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="font-heading text-xl font-semibold">{c?.name_en}</h1>
            <p className="text-sm text-muted-foreground">
              Applied for <Link href={`/jobs/${j?.id}`} className="text-brand-dark hover:underline">{j?.title_en}</Link>
              {j?.departments?.name_en && ` · ${j.departments.name_en}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isRejected
            ? <span className="rounded-full bg-status-error/10 px-3 py-1 text-xs font-medium text-status-error">Rejected</span>
            : <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">{STAGE_LABELS[app.current_stage] ?? app.current_stage}</span>
          }
          {app.ai_match_score != null && (
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-green/10 px-3 py-1 text-xs font-medium text-brand-dark">
              <Star className="h-3 w-3" />{app.ai_match_score.toFixed(0)}% match
            </span>
          )}
        </div>
      </div>

      {/* Stage pipeline indicator */}
      {!isRejected && (
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {STAGES.map((s, i) => (
            <div key={s} className="flex items-center gap-1 shrink-0">
              <div className={`flex h-7 items-center justify-center rounded-full px-3 text-xs font-medium ${
                i < currentIdx  ? 'bg-brand-green text-brand-dark' :
                i === currentIdx ? 'bg-brand-dark text-white' :
                                   'bg-muted text-muted-foreground'
              }`}>
                {i < currentIdx ? <CheckCircle2 className="h-3.5 w-3.5" /> : STAGE_LABELS[s]}
              </div>
              {i < STAGES.length - 1 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
            </div>
          ))}
        </div>
      )}

      {/* Feedback bar */}
      {(actionMsg || actionErr) && (
        <div className={`flex items-center gap-2 rounded-lg p-3 text-sm ${actionErr ? 'bg-status-error/10 text-status-error' : 'bg-status-success/10 text-status-success'}`}>
          {actionErr ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          {actionMsg || actionErr}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {(['overview','timeline','interviews','comms','actions'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              tab === t ? 'border-brand-green text-brand-dark' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Candidate Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Candidate Information</h3>
            <div className="grid grid-cols-2 gap-3">
              <InfoCard label="Email" value={c?.email ?? '—'} />
              <InfoCard label="Phone" value={c?.phone ?? '—'} />
              <InfoCard label="City" value={c?.current_city ?? '—'} />
              <InfoCard label="Nationality" value={c?.nationality ?? '—'} />
              <InfoCard label="Education" value={c?.education_level ? (EDU_LABELS[c.education_level] ?? c.education_level) : '—'} />
              <InfoCard label="Experience" value={c?.total_experience_years != null ? `${c.total_experience_years} yrs` : '—'} />
            </div>
            {c?.id && (
              <Link href={`/candidates/${c.id}`} className="text-sm text-brand-dark hover:underline">View full profile →</Link>
            )}
          </div>

          {/* AI Score */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">AI Match Score</h3>
              <Button size="sm" variant="outline" onClick={runScore} disabled={scoring}>
                {scoring ? <><Loader2 className="me-1.5 h-3.5 w-3.5 animate-spin" />Scoring…</> : 'Run Score'}
              </Button>
            </div>
            {!bd && (
              <p className="text-sm text-muted-foreground py-4 text-center">No score yet. Click "Run Score" to evaluate this candidate against the job requirements.</p>
            )}
            {bd && (
              <div className="space-y-4">
                <div className="rounded-xl border bg-card p-4 text-center">
                  <p className="text-3xl font-bold text-brand-dark">{bd.overall_score.toFixed(0)}%</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Overall Match</p>
                </div>
                <div className="space-y-2.5">
                  {Object.entries(bd.breakdown).map(([key, val]) => (
                    <ScoreBar key={key} label={key} score={val.score} />
                  ))}
                </div>
                {bd.strengths_en?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Strengths</p>
                    <ul className="space-y-1">
                      {bd.strengths_en.map(s => <li key={s} className="text-xs flex gap-1.5"><span className="text-green-600">+</span>{s}</li>)}
                    </ul>
                  </div>
                )}
                {bd.gaps_en?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Gaps</p>
                    <ul className="space-y-1">
                      {bd.gaps_en.map(g => <li key={g} className="text-xs flex gap-1.5"><span className="text-red-500">−</span>{g}</li>)}
                    </ul>
                  </div>
                )}
                {bd.recommendation_en && (
                  <p className="text-xs text-muted-foreground italic border-t pt-3">{bd.recommendation_en}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Timeline Tab */}
      {tab === 'timeline' && (
        <div className="space-y-3">
          {(!app.application_stage_events || app.application_stage_events.length === 0) && (
            <p className="py-8 text-center text-sm text-muted-foreground">No stage events yet.</p>
          )}
          {app.application_stage_events?.slice().reverse().map(event => (
            <div key={event.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="h-2 w-2 rounded-full bg-brand-green mt-1.5 shrink-0" />
                <div className="flex-1 w-px bg-border mt-1" />
              </div>
              <div className="pb-4 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">
                    {event.from_stage ? `${STAGE_LABELS[event.from_stage] ?? event.from_stage} → ` : ''}
                    {STAGE_LABELS[event.to_stage] ?? event.to_stage}
                  </p>
                  <p className="text-xs text-muted-foreground shrink-0">{new Date(event.created_at).toLocaleString()}</p>
                </div>
                {event.users?.name_en && (
                  <p className="text-xs text-muted-foreground mt-0.5">by {event.users.name_en}</p>
                )}
                {event.notes && <p className="mt-1 text-sm text-muted-foreground">{event.notes}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Actions Tab */}
      {tab === 'actions' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Advance Stage */}
          {!isRejected && app.current_stage !== 'hired' && (
            <div className="rounded-xl border bg-card p-5 space-y-4">
              <h3 className="font-semibold text-sm">Advance Stage</h3>
              <div className="space-y-1">
                <Label>Move to stage</Label>
                <select
                  value={advanceTo}
                  onChange={e => setAdvanceTo(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Select stage…</option>
                  {STAGES.slice(currentIdx + 1).map(s => (
                    <option key={s} value={s}>{STAGE_LABELS[s]}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Notes (optional)</Label>
                <Input value={advanceNote} onChange={e => setAdvNote(e.target.value)} placeholder="Add a note…" />
              </div>
              <Button onClick={advance} disabled={!advanceTo || advancing} className="w-full">
                {advancing ? <Loader2 className="me-1.5 h-4 w-4 animate-spin" /> : null}
                Advance Stage
              </Button>
            </div>
          )}

          {/* Reject */}
          {!isRejected && (
            <div className="rounded-xl border bg-card p-5 space-y-4">
              <h3 className="font-semibold text-sm">Reject Application</h3>
              <div className="space-y-1">
                <Label>Reason / notes (optional)</Label>
                <Input value={rejectNote} onChange={e => setRejectNote(e.target.value)} placeholder="Rejection reason…" />
              </div>
              <Button variant="outline" onClick={reject} disabled={rejecting} className="w-full border-status-error text-status-error hover:bg-status-error/5">
                {rejecting ? <Loader2 className="me-1.5 h-4 w-4 animate-spin" /> : null}
                Reject Application
              </Button>
            </div>
          )}

          {/* Parse CV */}
          <div className="rounded-xl border bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Parse CV (AI)</h3>
              <Button size="sm" variant="outline" onClick={() => setShowCvInput(v => !v)}>
                {showCvInput ? 'Cancel' : 'Paste CV'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Paste CV text to extract structured profile data using Claude AI.</p>
            {showCvInput && (
              <div className="space-y-3">
                <textarea
                  value={cvText}
                  onChange={e => setCvText(e.target.value)}
                  rows={8}
                  placeholder="Paste CV / resume text here…"
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
                <Button onClick={runParse} disabled={parsing || !cvText.trim()} className="w-full">
                  {parsing ? <><Loader2 className="me-1.5 h-4 w-4 animate-spin" />Parsing…</> : 'Parse CV'}
                </Button>
              </div>
            )}
          </div>

          {/* AI Score (action card) */}
          <div className="rounded-xl border bg-card p-5 space-y-4">
            <h3 className="font-semibold text-sm">AI Match Scoring</h3>
            <p className="text-xs text-muted-foreground">Score candidate against job requirements using Claude AI.</p>
            <Button onClick={runScore} disabled={scoring} className="w-full">
              {scoring ? <><Loader2 className="me-1.5 h-4 w-4 animate-spin" />Scoring…</> : 'Run AI Score'}
            </Button>
          </div>
        </div>
      )}

      {/* Interviews Tab */}
      {tab === 'interviews' && app && (
        <InterviewsTab applicationId={app.id} />
      )}

      {/* Comms Tab */}
      {tab === 'comms' && app && (
        <CommsTab applicationId={app.id} candidateEmail={app.candidates?.email} />
      )}

      {showSchedule && app && (
        <ScheduleInterviewDialog
          applicationId={app.id}
          onClose={() => setShowSchedule(false)}
          onCreated={() => setShowSchedule(false)}
        />
      )}
    </div>
  )
}

function InterviewsTab({ applicationId }: { applicationId: string }) {
  const [interviews, setInterviews] = useState<Array<{
    id: string; title: string; interview_type: string; scheduled_at?: string
    status: string; format: string; interview_scorecards?: Array<{ overall_rating?: number; recommendation: string }>
  }>>([])
  const [loading, setLoading] = useState(true)
  const [showSchedule, setShowSchedule] = useState(false)

  useEffect(() => {
    fetch(`/api/v1/interviews?application_id=${applicationId}`)
      .then(r => r.json())
      .then(d => { setInterviews(Array.isArray(d) ? d : []); setLoading(false) })
  }, [applicationId])

  const TYPE_LABELS: Record<string, string> = { hr: 'HR', technical: 'Technical', panel: 'Panel', final: 'Final', assessment: 'Assessment' }
  const STATUS_COLORS: Record<string, string> = {
    scheduled: 'bg-blue-500/15 text-blue-700', completed: 'bg-green-500/15 text-green-700',
    cancelled: 'bg-muted text-muted-foreground', no_show: 'bg-status-error/10 text-status-error',
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowSchedule(true)}>
          <Calendar className="me-1.5 h-4 w-4" />Schedule Interview
        </Button>
      </div>

      {loading && <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>}
      {!loading && interviews.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">No interviews scheduled yet.</p>
      )}

      {interviews.map(iv => {
        const scorecards = iv.interview_scorecards ?? []
        const rated      = scorecards.filter(s => s.overall_rating)
        const avg        = rated.length > 0
          ? (rated.reduce((s, sc) => s + (sc.overall_rating ?? 0), 0) / rated.length).toFixed(1)
          : null
        return (
          <div key={iv.id} className="flex items-center justify-between rounded-xl border bg-card p-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[iv.status] ?? 'bg-muted'}`}>
                  {iv.status.replace('_',' ')}
                </span>
                <span className="text-xs text-muted-foreground">{TYPE_LABELS[iv.interview_type] ?? iv.interview_type}</span>
              </div>
              <p className="font-medium text-sm">{iv.title}</p>
              {iv.scheduled_at && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(iv.scheduled_at).toLocaleString('en', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {avg && <span className="text-sm font-bold">★ {avg}/5</span>}
              <Link href={`/interviews/${iv.id}`} className="text-sm text-brand-dark hover:underline">View</Link>
            </div>
          </div>
        )
      })}

      {showSchedule && (
        <ScheduleInterviewDialog
          applicationId={applicationId}
          onClose={() => setShowSchedule(false)}
          onCreated={() => { setShowSchedule(false); fetch(`/api/v1/interviews?application_id=${applicationId}`).then(r => r.json()).then(d => setInterviews(Array.isArray(d) ? d : [])) }}
        />
      )}
    </div>
  )
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm font-medium truncate">{value}</p>
    </div>
  )
}

function CommsTab({ applicationId, candidateEmail }: { applicationId: string; candidateEmail?: string }) {
  const [comms, setComms]         = useState<Array<{
    id: string; channel: string; recipient_email: string | null; subject: string | null
    status: string; sent_at: string | null; body: string; created_at: string
  }>>([])
  const [loading, setLoading]     = useState(true)
  const [showCompose, setShowCompose] = useState(false)
  const [form, setForm]           = useState({ subject: '', body: '', recipient_email: candidateEmail ?? '' })
  const [sending, setSending]     = useState(false)

  function loadComms() {
    fetch(`/api/v1/communications?application_id=${applicationId}&limit=20`)
      .then(r => r.json())
      .then(d => { setComms(Array.isArray(d) ? d : []); setLoading(false) })
  }

  useEffect(() => { loadComms() }, [applicationId])

  async function send() {
    setSending(true)
    await fetch('/api/v1/communications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, application_id: applicationId, channel: 'email' }),
    })
    setSending(false)
    setShowCompose(false)
    setForm(f => ({ ...f, subject: '', body: '' }))
    loadComms()
  }

  const STATUS_STYLE: Record<string, string> = {
    sent:      'text-green-600',
    queued:    'text-yellow-600',
    failed:    'text-red-500',
    delivered: 'text-blue-600',
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowCompose(s => !s)}>
          {showCompose ? 'Cancel' : '+ Compose Email'}
        </Button>
      </div>

      {showCompose && (
        <div className="border rounded-xl p-4 space-y-3 bg-gray-50">
          <p className="text-sm font-medium">New Email</p>
          <div>
            <Label className="text-xs">To</Label>
            <Input className="mt-1 h-8" value={form.recipient_email} onChange={e => setForm(f => ({ ...f, recipient_email: e.target.value }))} />
          </div>
          <div>
            <Label className="text-xs">Subject</Label>
            <Input className="mt-1 h-8" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
          </div>
          <div>
            <Label className="text-xs">Body</Label>
            <textarea
              className="w-full mt-1 border rounded-md p-2 text-sm resize-none bg-white"
              rows={4}
              value={form.body}
              onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
            />
          </div>
          <Button size="sm" onClick={send} disabled={sending || !form.recipient_email || !form.body}>
            {sending ? 'Sending…' : 'Send'}
          </Button>
        </div>
      )}

      {loading && <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>}
      {!loading && comms.length === 0 && !showCompose && (
        <p className="py-8 text-center text-sm text-muted-foreground">No communications yet.</p>
      )}
      {comms.map(c => (
        <div key={c.id} className="border rounded-xl p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-medium text-gray-800">{c.subject ?? '(No subject)'}</p>
            <span className={`text-xs font-medium capitalize ${STATUS_STYLE[c.status] ?? 'text-gray-400'}`}>
              {c.status}
            </span>
          </div>
          <p className="text-xs text-gray-400">{c.recipient_email} · {c.sent_at ? new Date(c.sent_at).toLocaleString() : c.created_at.split('T')[0]}</p>
          <p className="text-sm text-gray-600 mt-2 line-clamp-2">{c.body}</p>
        </div>
      ))}
    </div>
  )
}
