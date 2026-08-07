'use client'

import { Briefcase, CheckCircle2, Clock, XCircle } from 'lucide-react'

type Application = {
  id: string
  current_stage: string
  status: string
  ai_match_score?: number
  created_at: string
  job_postings?: { id: string; title_en: string; city?: string; employment_type?: string }
}

type Candidate = {
  id: string
  name_en: string
  email: string
  phone?: string
  current_title?: string
  current_city?: string
  nationality?: string
  job_applications?: Application[]
}

const STAGE_LABELS: Record<string, string> = {
  applied:     'Application received',
  screening:   'Under review',
  shortlisted: 'Shortlisted',
  interview:   'Interview scheduled',
  assessment:  'Assessment',
  offer:       'Offer extended',
  hired:       'Hired',
  rejected:    'Not progressing',
}

const STAGE_DESC: Record<string, string> = {
  applied:     'Your application has been received and is in the queue for review.',
  screening:   'Our team is reviewing your profile and application.',
  shortlisted: 'Congratulations — you have been shortlisted for further consideration.',
  interview:   'You have been selected for an interview. Our team will reach out shortly.',
  assessment:  'You have been invited to complete an assessment.',
  offer:       'We are pleased to extend you an offer. Our team will contact you with details.',
  hired:       'Welcome to the team!',
  rejected:    'Thank you for your interest. We will keep your profile on file for future opportunities.',
}

const STAGE_PROGRESS: Record<string, number> = {
  applied: 1, screening: 2, shortlisted: 3, interview: 4, assessment: 5, offer: 6, hired: 7, rejected: 0,
}

function StageIcon({ stage }: { stage: string }) {
  if (stage === 'hired')    return <CheckCircle2 className="h-5 w-5 text-green-600" />
  if (stage === 'rejected') return <XCircle className="h-5 w-5 text-status-error" />
  return <Clock className="h-5 w-5 text-brand-dark" />
}

export function CandidatePortal({ candidate }: { candidate: Candidate }) {
  const apps = candidate.job_applications ?? []

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-dark/5 to-background">
      {/* Nav */}
      <nav className="border-b bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-3xl px-4 h-14 flex items-center justify-between">
          <span className="font-heading font-bold text-lg text-brand-dark">Chessboard</span>
          <span className="text-sm text-muted-foreground">Candidate Portal</span>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-4 py-10 space-y-8">
        {/* Welcome */}
        <div>
          <h1 className="font-heading text-2xl font-semibold">Welcome, {candidate.name_en}</h1>
          <p className="mt-1 text-muted-foreground">{candidate.email}</p>
        </div>

        {apps.length === 0 && (
          <div className="rounded-xl border bg-card p-8 text-center">
            <Briefcase className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No active applications found.</p>
          </div>
        )}

        {apps.map(app => {
          const stage   = app.status === 'rejected' ? 'rejected' : app.current_stage
          const progress = STAGE_PROGRESS[stage] ?? 0
          const isActive = app.status === 'active'

          return (
            <div key={app.id} className="rounded-xl border bg-card overflow-hidden">
              {/* Job header */}
              <div className="border-b bg-muted/30 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-heading font-semibold">{app.job_postings?.title_en}</h2>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {app.job_postings?.city && (
                        <span className="text-xs text-muted-foreground">{app.job_postings.city}</span>
                      )}
                      {app.job_postings?.employment_type && (
                        <span className="text-xs text-muted-foreground capitalize">{app.job_postings.employment_type.replace('_',' ')}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StageIcon stage={stage} />
                    <span className="text-sm font-medium">{STAGE_LABELS[stage] ?? stage}</span>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-5">
                {/* Progress bar */}
                {isActive && (
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-2">
                      <span>Applied</span>
                      <span>Offer</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-brand-green transition-all duration-500"
                        style={{ width: `${(progress / 6) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Status description */}
                <div className={`rounded-lg p-4 text-sm ${
                  stage === 'hired'    ? 'bg-green-500/10 text-green-800' :
                  stage === 'rejected' ? 'bg-status-error/10 text-status-error' :
                  stage === 'offer'    ? 'bg-brand-green/10 text-brand-dark' :
                                        'bg-muted/50 text-muted-foreground'
                }`}>
                  {STAGE_DESC[stage]}
                </div>

                <p className="text-xs text-muted-foreground">Applied on {new Date(app.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>
          )
        })}

        {/* Footer */}
        <p className="text-xs text-center text-muted-foreground pb-6">
          This link is private and expires after 7 days. For enquiries, contact{' '}
          <a href="mailto:careers@chessboard-group.com" className="underline">careers@chessboard-group.com</a>
        </p>
      </main>
    </div>
  )
}
