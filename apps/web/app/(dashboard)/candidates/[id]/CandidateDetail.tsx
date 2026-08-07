'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, Copy, ExternalLink, AlertCircle, Briefcase, GraduationCap, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Application = {
  id: string
  current_stage: string
  status: string
  ai_match_score?: number
  created_at: string
  job_postings?: { id: string; title_en: string; slug: string }
}

type Candidate = {
  id: string
  name_en: string
  name_ar?: string
  email: string
  phone?: string
  current_city?: string
  nationality?: string
  gender?: string
  education_level?: string
  total_experience_years?: number
  current_title?: string
  linkedin_url?: string
  tags: string[]
  is_duplicate: boolean
  created_at: string
  parsed_profile?: {
    education?: Array<{ institution: string; degree: string; field?: string; year?: number }>
    experience?: Array<{ company: string; title: string; from?: string; to?: string; description?: string }>
    skills?: string[]
    certifications?: string[]
    languages?: string[]
    summary?: string
  }
  job_applications?: Application[]
}

const STAGE_LABELS: Record<string, string> = {
  applied:     'Applied',
  screening:   'Screening',
  shortlisted: 'Shortlisted',
  interview:   'Interview',
  assessment:  'Assessment',
  offer:       'Offer',
  hired:       'Hired',
  rejected:    'Rejected',
}

const EDU_LABELS: Record<string, string> = {
  high_school: 'High School', diploma: 'Diploma',
  bachelor: "Bachelor's", master: "Master's", phd: 'PhD',
}

export function CandidateDetail({ id }: { id: string }) {
  const [candidate, setCandidate] = useState<Candidate | null>(null)
  const [loading, setLoading]     = useState(true)
  const [portalLink, setPortalLink] = useState('')
  const [copyDone, setCopyDone]     = useState(false)
  const [tab, setTab] = useState<'overview' | 'applications' | 'parsed'>('overview')

  useEffect(() => {
    fetch(`/api/v1/candidates/${id}`)
      .then(r => r.json())
      .then(d => { setCandidate(d); setLoading(false) })
  }, [id])

  async function generatePortalLink() {
    const res = await fetch(`/api/v1/candidates/${id}/portal-link`, { method: 'POST' })
    const d   = await res.json()
    setPortalLink(d.url)
  }

  async function copyLink() {
    await navigator.clipboard.writeText(portalLink)
    setCopyDone(true)
    setTimeout(() => setCopyDone(false), 2000)
  }

  if (loading) return <div className="py-12 text-center text-sm text-muted-foreground">Loading…</div>
  if (!candidate) return <div className="py-12 text-center text-sm text-muted-foreground">Candidate not found.</div>

  const parsed = candidate.parsed_profile

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/candidates" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-2xl font-semibold">{candidate.name_en}</h1>
              {candidate.is_duplicate && (
                <span className="inline-flex items-center gap-1 rounded-full bg-status-warning/10 px-2 py-0.5 text-xs font-medium text-status-warning">
                  <AlertCircle className="h-3 w-3" />Possible duplicate
                </span>
              )}
            </div>
            {candidate.name_ar && <p className="text-sm text-muted-foreground font-arabic" dir="rtl">{candidate.name_ar}</p>}
            {candidate.current_title && <p className="mt-0.5 text-sm text-muted-foreground">{candidate.current_title}</p>}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={generatePortalLink}>
            <ExternalLink className="me-1.5 h-4 w-4" />Portal Link
          </Button>
        </div>
      </div>

      {portalLink && (
        <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-3 text-sm">
          <code className="flex-1 truncate text-xs">{portalLink}</code>
          <Button size="sm" variant="outline" onClick={copyLink}>
            <Copy className="me-1.5 h-3.5 w-3.5" />{copyDone ? 'Copied!' : 'Copy'}
          </Button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {(['overview','applications','parsed'] as const).map(t => (
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

      {tab === 'overview' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <InfoCard label="Email" value={candidate.email} />
          <InfoCard label="Phone" value={candidate.phone ?? '—'} />
          <InfoCard label="City" value={candidate.current_city ?? '—'} />
          <InfoCard label="Nationality" value={candidate.nationality ?? '—'} />
          <InfoCard label="Gender" value={candidate.gender ?? '—'} />
          <InfoCard label="Education" value={candidate.education_level ? (EDU_LABELS[candidate.education_level] ?? candidate.education_level) : '—'} />
          <InfoCard label="Experience" value={candidate.total_experience_years != null ? `${candidate.total_experience_years} years` : '—'} />
          {candidate.linkedin_url && (
            <div className="rounded-lg border bg-card p-4">
              <p className="text-xs text-muted-foreground mb-1">LinkedIn</p>
              <a href={candidate.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-dark underline truncate block">
                View Profile
              </a>
            </div>
          )}
          <InfoCard label="Added" value={new Date(candidate.created_at).toLocaleDateString()} />
          {candidate.tags?.length > 0 && (
            <div className="rounded-lg border bg-card p-4 col-span-full sm:col-span-2">
              <p className="text-xs text-muted-foreground mb-2">Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {candidate.tags.map(t => (
                  <span key={t} className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">{t}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'applications' && (
        <div className="space-y-3">
          {(!candidate.job_applications || candidate.job_applications.length === 0) && (
            <p className="py-8 text-center text-sm text-muted-foreground">No applications yet.</p>
          )}
          {candidate.job_applications?.map(app => (
            <div key={app.id} className="flex items-center justify-between rounded-lg border bg-card p-4">
              <div className="flex items-center gap-3">
                <Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="font-medium text-sm">{app.job_postings?.title_en ?? 'Unknown job'}</p>
                  <p className="text-xs text-muted-foreground">Applied {new Date(app.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {app.ai_match_score != null && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium">
                    <Star className="h-3 w-3 text-brand-green" />{app.ai_match_score.toFixed(0)}%
                  </span>
                )}
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  app.status === 'rejected' ? 'bg-status-error/10 text-status-error' :
                  app.current_stage === 'hired' ? 'bg-status-success/10 text-status-success' :
                  'bg-muted text-muted-foreground'
                }`}>{app.status === 'rejected' ? 'Rejected' : (STAGE_LABELS[app.current_stage] ?? app.current_stage)}</span>
                <Link href={`/applications/${app.id}`} className="text-xs text-brand-dark underline">View</Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'parsed' && (
        <div className="space-y-6">
          {!parsed && (
            <p className="py-8 text-center text-sm text-muted-foreground">No parsed CV data. Use the parse-cv action from an application.</p>
          )}
          {parsed?.summary && (
            <div>
              <h3 className="font-semibold text-sm mb-2">Summary</h3>
              <p className="text-sm text-muted-foreground">{parsed.summary}</p>
            </div>
          )}
          {parsed?.skills && parsed.skills.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm mb-2">Skills</h3>
              <div className="flex flex-wrap gap-1.5">
                {parsed.skills.map(s => (
                  <span key={s} className="rounded-full bg-brand-green/15 px-2.5 py-0.5 text-xs font-medium text-brand-dark">{s}</span>
                ))}
              </div>
            </div>
          )}
          {parsed?.experience && parsed.experience.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Briefcase className="h-4 w-4" /> Experience</h3>
              <div className="space-y-3">
                {parsed.experience.map((e, i) => (
                  <div key={i} className="rounded-lg border bg-card p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm">{e.title}</p>
                        <p className="text-xs text-muted-foreground">{e.company}</p>
                      </div>
                      <p className="text-xs text-muted-foreground shrink-0">{e.from}{e.to ? ` – ${e.to}` : ''}</p>
                    </div>
                    {e.description && <p className="mt-2 text-xs text-muted-foreground">{e.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {parsed?.education && parsed.education.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><GraduationCap className="h-4 w-4" /> Education</h3>
              <div className="space-y-2">
                {parsed.education.map((e, i) => (
                  <div key={i} className="rounded-lg border bg-card p-4">
                    <p className="font-medium text-sm">{e.degree}{e.field ? `, ${e.field}` : ''}</p>
                    <p className="text-xs text-muted-foreground">{e.institution}{e.year ? ` · ${e.year}` : ''}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {parsed?.certifications && parsed.certifications.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm mb-2">Certifications</h3>
              <ul className="space-y-1">
                {parsed.certifications.map(c => <li key={c} className="text-sm text-muted-foreground">• {c}</li>)}
              </ul>
            </div>
          )}
          {parsed?.languages && parsed.languages.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm mb-2">Languages</h3>
              <div className="flex flex-wrap gap-1.5">
                {parsed.languages.map(l => (
                  <span key={l} className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">{l}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  )
}
