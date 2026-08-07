'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, Video, MapPin, Phone, Clock, Calendar, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ScorecardForm } from './ScorecardForm'
import { SelectionComparison } from './SelectionComparison'

type Scorecard = {
  id: string
  overall_rating?: number
  recommendation: string
  strengths?: string
  concerns?: string
  submitted_at?: string
  interviewer?: { id: string; name_en: string }
}

type Interview = {
  id: string
  title: string
  interview_type: string
  scheduled_at?: string
  duration_mins: number
  location?: string
  format: string
  status: string
  notes?: string
  organizer?: { id: string; name_en: string }
  interview_interviewers?: Array<{ user_id: string; users: { id: string; name_en: string; email: string } }>
  interview_scorecards?: Scorecard[]
  job_applications?: {
    id: string
    candidates?: { id: string; name_en: string; email: string; current_title?: string; total_experience_years?: number }
    job_postings?: { id: string; title_en: string }
  }
}

const TYPE_LABELS: Record<string, string> = {
  hr: 'HR', technical: 'Technical', panel: 'Panel', final: 'Final', assessment: 'Assessment',
}

const STATUS_COLORS: Record<string, string> = {
  scheduled:  'bg-blue-500/15 text-blue-700 border-blue-200',
  completed:  'bg-green-500/15 text-green-700 border-green-200',
  cancelled:  'bg-muted text-muted-foreground border-border',
  no_show:    'bg-status-error/10 text-status-error border-status-error/20',
}

const RECOMMENDATION_LABELS: Record<string, { label: string; color: string }> = {
  strong_hire:    { label: 'Strong Hire',    color: 'text-green-700 bg-green-500/10' },
  hire:           { label: 'Hire',           color: 'text-green-600 bg-green-500/10' },
  neutral:        { label: 'Neutral',        color: 'text-muted-foreground bg-muted' },
  no_hire:        { label: 'No Hire',        color: 'text-status-error bg-status-error/10' },
  strong_no_hire: { label: 'Strong No Hire', color: 'text-status-error bg-status-error/10' },
}

const FORMAT_ICON: Record<string, React.ReactNode> = {
  video:      <Video className="h-4 w-4" />,
  in_person:  <MapPin className="h-4 w-4" />,
  phone:      <Phone className="h-4 w-4" />,
}

export function InterviewDetail({ id }: { id: string }) {
  const [interview, setInterview]   = useState<Interview | null>(null)
  const [loading, setLoading]       = useState(true)
  const [tab, setTab]               = useState<'details' | 'scorecards' | 'comparison'>('details')
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [statusMsg, setStatusMsg]   = useState('')

  useEffect(() => {
    fetch(`/api/v1/interviews/${id}`)
      .then(r => r.json())
      .then(d => { setInterview(d); setLoading(false) })
  }, [id])

  async function updateStatus(status: string) {
    setUpdatingStatus(true)
    const res = await fetch(`/api/v1/interviews/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setUpdatingStatus(false)
    if (res.ok) {
      setInterview(prev => prev ? { ...prev, status } : prev)
      setStatusMsg(`Marked as ${status.replace('_',' ')}`)
      setTimeout(() => setStatusMsg(''), 3000)
    }
  }

  if (loading) return <div className="py-12 text-center text-sm text-muted-foreground">Loading…</div>
  if (!interview) return <div className="py-12 text-center text-sm text-muted-foreground">Interview not found.</div>

  const candidate = interview.job_applications?.candidates
  const job       = interview.job_applications?.job_postings
  const scorecards = interview.interview_scorecards ?? []
  const interviewers = interview.interview_interviewers ?? []

  const avgRating = scorecards.filter(s => s.overall_rating).length > 0
    ? (scorecards.reduce((sum, s) => sum + (s.overall_rating ?? 0), 0) / scorecards.filter(s => s.overall_rating).length).toFixed(1)
    : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/interviews" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-heading text-xl font-semibold">{interview.title}</h1>
              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[interview.status] ?? 'bg-muted'}`}>
                {interview.status.replace('_',' ')}
              </span>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                {TYPE_LABELS[interview.interview_type] ?? interview.interview_type}
              </span>
            </div>
            {candidate && (
              <p className="text-sm text-muted-foreground mt-0.5">
                <Link href={`/candidates/${candidate.id}`} className="text-brand-dark hover:underline">{candidate.name_en}</Link>
                {job && <> · <Link href={`/jobs/${job.id}`} className="hover:underline">{job.title_en}</Link></>}
              </p>
            )}
          </div>
        </div>

        {interview.status === 'scheduled' && (
          <div className="flex gap-2 shrink-0">
            <Button size="sm" variant="outline" onClick={() => updateStatus('no_show')} disabled={updatingStatus}>
              No Show
            </Button>
            <Button size="sm" onClick={() => updateStatus('completed')} disabled={updatingStatus}>
              {updatingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="me-1.5 h-4 w-4" />}
              Mark Complete
            </Button>
          </div>
        )}
      </div>

      {statusMsg && (
        <div className="flex items-center gap-2 rounded-lg bg-status-success/10 p-3 text-sm text-status-success">
          <CheckCircle2 className="h-4 w-4" />{statusMsg}
        </div>
      )}

      {/* Score summary strip */}
      {scorecards.length > 0 && (
        <div className="flex flex-wrap gap-4 rounded-xl border bg-card p-4">
          {avgRating && (
            <div className="text-center">
              <p className="text-2xl font-bold text-brand-dark">{avgRating}<span className="text-sm text-muted-foreground">/5</span></p>
              <p className="text-xs text-muted-foreground">Avg Rating</p>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {scorecards.map(s => {
              const rec = RECOMMENDATION_LABELS[s.recommendation]
              return (
                <div key={s.id} className="rounded-lg border bg-muted/40 p-3 text-sm min-w-[140px]">
                  <p className="font-medium text-xs text-muted-foreground">{s.interviewer?.name_en}</p>
                  {s.overall_rating && <p className="font-bold mt-0.5">{'★'.repeat(Math.round(s.overall_rating))} {s.overall_rating}/5</p>}
                  <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${rec?.color}`}>{rec?.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {(['details','scorecards','comparison'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              tab === t ? 'border-brand-green text-brand-dark' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t}{t === 'scorecards' && scorecards.length > 0 ? ` (${scorecards.length})` : ''}
          </button>
        ))}
      </div>

      {tab === 'details' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <InfoCard label="Format">
            <span className="flex items-center gap-1.5">{FORMAT_ICON[interview.format]} {interview.format.replace('_',' ')}</span>
          </InfoCard>
          <InfoCard label="Date & Time">
            {interview.scheduled_at
              ? new Date(interview.scheduled_at).toLocaleString('en', { dateStyle: 'medium', timeStyle: 'short' })
              : '—'}
          </InfoCard>
          <InfoCard label="Duration">
            <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-muted-foreground" />{interview.duration_mins} min</span>
          </InfoCard>
          {interview.location && (
            <InfoCard label="Location / URL">{interview.location}</InfoCard>
          )}
          {interview.organizer && (
            <InfoCard label="Organizer">{interview.organizer.name_en}</InfoCard>
          )}
          {interviewers.length > 0 && (
            <div className="sm:col-span-2 rounded-lg border bg-card p-4">
              <p className="text-xs text-muted-foreground mb-2">Interviewers</p>
              <div className="flex flex-wrap gap-2">
                {interviewers.map(i => (
                  <span key={i.user_id} className="rounded-full bg-muted px-3 py-1 text-sm">{i.users?.name_en}</span>
                ))}
              </div>
            </div>
          )}
          {interview.notes && (
            <div className="sm:col-span-full rounded-lg border bg-card p-4">
              <p className="text-xs text-muted-foreground mb-1">Notes</p>
              <p className="text-sm whitespace-pre-wrap">{interview.notes}</p>
            </div>
          )}
        </div>
      )}

      {tab === 'scorecards' && (
        <div className="space-y-6">
          <ScorecardForm
            interviewId={id}
            interviewers={interviewers}
            existingScorecards={scorecards}
            onSubmitted={() => {
              fetch(`/api/v1/interviews/${id}`)
                .then(r => r.json())
                .then(d => setInterview(d))
            }}
          />
        </div>
      )}

      {tab === 'comparison' && interview.job_applications && (
        <SelectionComparison applicationId={interview.job_applications.id} />
      )}
    </div>
  )
}

function InfoCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <div className="text-sm font-medium">{children}</div>
    </div>
  )
}
