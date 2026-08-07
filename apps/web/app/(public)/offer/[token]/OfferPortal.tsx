'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, MessageSquare, Clock, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

type OfferVersion = {
  version: number; job_title: string; start_date?: string
  base_salary?: number; currency: string
  allowances?: Record<string, number>
  benefits?: { items?: string[] }
  terms_en?: string; terms_ar?: string
}

type Props = {
  token: string
  offer: {
    status: string
    current_version: number
    expires_at: string | null
    accepted_at: string | null
    declined_at: string | null
    withdrawn_at: string | null
    candidate: { name_en: string; name_ar?: string; email: string } | null
    job: { title_en: string; city?: string } | null
    version: OfferVersion | null
  }
}

const ALLOWANCE_LABELS: Record<string, string> = {
  housing: 'Housing', transport: 'Transport', food: 'Food', other: 'Other',
}

function fmt(n?: number, cur = 'SAR') {
  if (!n) return '—'
  return n.toLocaleString('en', { minimumFractionDigits: 0 }) + ' ' + cur
}

function Countdown({ expiresAt }: { expiresAt: string }) {
  const [remaining, setRemaining] = useState('')

  useEffect(() => {
    function tick() {
      const diff = new Date(expiresAt).getTime() - Date.now()
      if (diff <= 0) { setRemaining('Expired'); return }
      const d = Math.floor(diff / 86400000)
      const h = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      setRemaining(d > 0 ? `${d}d ${h}h remaining` : `${h}h ${m}m remaining`)
    }
    tick()
    const iv = setInterval(tick, 60000)
    return () => clearInterval(iv)
  }, [expiresAt])

  const diff = new Date(expiresAt).getTime() - Date.now()
  const urgent = diff < 86400000 * 3 && diff > 0

  return (
    <div className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium ${
      diff <= 0 ? 'bg-status-error/10 text-status-error' :
      urgent    ? 'bg-status-warning/10 text-status-warning' :
                  'bg-muted/50 text-muted-foreground'
    }`}>
      <Clock className="h-4 w-4 shrink-0" />{remaining}
    </div>
  )
}

type Action = 'accept' | 'decline' | 'negotiate' | null
type Stage  = 'view' | 'confirm' | 'done'

export function OfferPortal({ token, offer }: Props) {
  const [stage, setStage]         = useState<Stage>('view')
  const [pendingAction, setPending] = useState<Action>(null)
  const [notes, setNotes]         = useState('')
  const [counter, setCounter]     = useState({ salary: '', notes: '' })
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult]       = useState<{ action: string; hash?: string } | null>(null)
  const [error, setError]         = useState('')
  const [showTermsAr, setShowTermsAr] = useState(false)

  const v          = offer.version
  const isExpired  = offer.expires_at && new Date(offer.expires_at) < new Date()
  const isClosed   = ['accepted','declined','withdrawn'].includes(offer.status) || !!isExpired

  const totalAllowances = Object.values(v?.allowances ?? {}).reduce((s, x) => s + (x ?? 0), 0)
  const totalComp       = (v?.base_salary ?? 0) + totalAllowances

  async function submitResponse() {
    if (!pendingAction) return
    setSubmitting(true); setError('')

    const body: Record<string, unknown> = { action: pendingAction, candidate_notes: notes || undefined }
    if (pendingAction === 'negotiate' && counter.salary) {
      body.counter_details = { requested_salary: parseFloat(counter.salary), notes: counter.notes }
    }

    const res = await fetch(`/api/v1/public/offer/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setSubmitting(false)
    if (res.ok) {
      const d = await res.json()
      setResult({ action: pendingAction, hash: d.acceptance_hash })
      setStage('done')
    } else {
      const d = await res.json()
      setError(d?.error ?? 'Something went wrong. Please try again.')
    }
  }

  // Already settled
  if (offer.status === 'withdrawn') {
    return <ClosedScreen title="Offer Withdrawn" message="This offer has been withdrawn by the employer." icon="x" />
  }
  if (offer.status === 'accepted') {
    return <ClosedScreen title="Offer Accepted" message="You have already accepted this offer. We look forward to welcoming you!" icon="check" />
  }
  if (offer.status === 'declined') {
    return <ClosedScreen title="Offer Declined" message="You have previously declined this offer." icon="x" />
  }
  if (isExpired) {
    return <ClosedScreen title="Offer Expired" message="This offer has expired. Please contact the recruiter for assistance." icon="clock" />
  }

  if (stage === 'done' && result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-brand-dark/5 to-background p-4">
        <div className="w-full max-w-md text-center space-y-6">
          <div className={`inline-flex h-20 w-20 items-center justify-center rounded-full ${
            result.action === 'accept'    ? 'bg-green-500/20' :
            result.action === 'decline'  ? 'bg-status-error/10' :
                                           'bg-yellow-500/10'
          }`}>
            {result.action === 'accept'   && <CheckCircle2 className="h-10 w-10 text-green-600" />}
            {result.action === 'decline'  && <XCircle      className="h-10 w-10 text-status-error" />}
            {result.action === 'negotiate' && <MessageSquare className="h-10 w-10 text-yellow-600" />}
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold">
              {result.action === 'accept'    ? 'Offer Accepted!' :
               result.action === 'decline'  ? 'Offer Declined' :
                                              'Negotiation Requested'}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {result.action === 'accept'
                ? 'Congratulations! Your acceptance has been recorded. The hiring team will contact you shortly with next steps.'
                : result.action === 'decline'
                ? 'Your response has been recorded. Thank you for your consideration.'
                : 'Your counter-proposal has been submitted. The recruiter will be in touch.'}
            </p>
          </div>
          {result.hash && (
            <div className="rounded-lg bg-muted/50 p-3 text-left">
              <p className="text-xs text-muted-foreground mb-1 font-medium">Acceptance Reference</p>
              <p className="font-mono text-xs break-all text-muted-foreground">{result.hash}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (stage === 'confirm' && pendingAction) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-brand-dark/5 to-background p-4">
        <div className="w-full max-w-md space-y-5">
          <div className="rounded-xl border bg-card p-6 space-y-5">
            <h2 className="font-heading text-lg font-semibold">
              {pendingAction === 'accept'    ? 'Accept Offer'    :
               pendingAction === 'decline'  ? 'Decline Offer'  :
                                              'Request Negotiation'}
            </h2>

            {pendingAction === 'accept' && (
              <p className="text-sm text-muted-foreground">
                By accepting, you confirm that you have read all terms and conditions. Your digital acceptance will be recorded with a cryptographic hash as evidence.
              </p>
            )}

            {pendingAction === 'negotiate' && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Requested Salary ({v?.currency ?? 'SAR'})</Label>
                  <input
                    type="number"
                    value={counter.salary}
                    onChange={e => setCounter(c => ({ ...c, salary: e.target.value }))}
                    placeholder={String(v?.base_salary ?? '')}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Additional notes</Label>
                  <textarea
                    value={counter.notes}
                    onChange={e => setCounter(c => ({ ...c, notes: e.target.value }))}
                    rows={3}
                    placeholder="Explain your counter proposal…"
                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <Label>{pendingAction === 'accept' ? 'Message to employer (optional)' : 'Notes'}</Label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                placeholder={pendingAction === 'accept' ? 'Thank you for the offer…' : 'Reason for declining…'}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-status-error">
                <AlertCircle className="h-4 w-4" />{error}
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => { setStage('view'); setError('') }}>
                Back
              </Button>
              <Button
                className={`flex-1 ${pendingAction === 'decline' ? 'bg-status-error hover:bg-status-error/80' : ''}`}
                onClick={submitResponse}
                disabled={submitting}
              >
                {submitting && <Loader2 className="me-1.5 h-4 w-4 animate-spin" />}
                Confirm
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-dark/5 to-background">
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-3xl px-4 h-14 flex items-center justify-between">
          <span className="font-heading font-bold text-brand-dark">Chessboard</span>
          <span className="text-sm text-muted-foreground">Offer Letter</span>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-4 py-10 space-y-6">
        {/* Hero */}
        <div>
          <p className="text-sm text-muted-foreground mb-1">Dear {offer.candidate?.name_en},</p>
          <h1 className="font-heading text-2xl font-bold">
            We're delighted to offer you the position of{' '}
            <span className="text-brand-dark">{v?.job_title}</span>
          </h1>
          {offer.job?.title_en && (
            <p className="mt-1 text-muted-foreground">{offer.job.title_en}{offer.job.city ? ` · ${offer.job.city}` : ''}</p>
          )}
        </div>

        {/* Expiry countdown */}
        {offer.expires_at && <Countdown expiresAt={offer.expires_at} />}

        {/* Compensation */}
        {v && (
          <div className="rounded-xl border bg-card p-5 space-y-4">
            <p className="font-semibold">Compensation Package</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {v.base_salary != null && (
                <div className="rounded-xl bg-brand-green/10 border border-brand-green/30 p-4 text-center">
                  <p className="text-xl font-bold text-brand-dark">{fmt(v.base_salary, v.currency)}</p>
                  <p className="text-xs text-muted-foreground">Base Salary / month</p>
                </div>
              )}
              {Object.entries(v.allowances ?? {}).map(([k, val]) =>
                val > 0 && (
                  <div key={k} className="rounded-xl border bg-muted/40 p-4 text-center">
                    <p className="text-lg font-bold">{fmt(val, v.currency)}</p>
                    <p className="text-xs text-muted-foreground">{ALLOWANCE_LABELS[k] ?? k}</p>
                  </div>
                )
              )}
              {totalComp > 0 && (
                <div className="rounded-xl border bg-muted/40 p-4 text-center">
                  <p className="text-lg font-bold">{fmt(totalComp, v.currency)}</p>
                  <p className="text-xs text-muted-foreground">Total Package</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t">
              {v.start_date && (
                <div>
                  <p className="text-xs text-muted-foreground">Start Date</p>
                  <p className="font-medium text-sm">{new Date(v.start_date).toLocaleDateString('en', { dateStyle: 'long' })}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Benefits */}
        {v?.benefits?.items && v.benefits.items.length > 0 && (
          <div className="rounded-xl border bg-card p-5 space-y-3">
            <p className="font-semibold">Benefits</p>
            <div className="flex flex-wrap gap-2">
              {v.benefits.items.map(b => (
                <span key={b} className="inline-flex items-center gap-1.5 rounded-full bg-brand-green/10 px-3 py-1 text-xs font-medium text-brand-dark">
                  <CheckCircle2 className="h-3 w-3" />{b}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Terms */}
        {v?.terms_en && (
          <div className="rounded-xl border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-semibold">Terms & Conditions</p>
              {v?.terms_ar && (
                <button onClick={() => setShowTermsAr(v => !v)} className="text-xs text-brand-dark hover:underline">
                  {showTermsAr ? 'Show English' : 'عرض بالعربي'}
                </button>
              )}
            </div>
            {!showTermsAr
              ? <p className="text-sm text-muted-foreground whitespace-pre-wrap">{v.terms_en}</p>
              : <p className="text-sm text-muted-foreground whitespace-pre-wrap text-right font-arabic" dir="rtl">{v.terms_ar}</p>
            }
          </div>
        )}

        {/* Action buttons */}
        {!isClosed && offer.status === 'sent' && (
          <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t py-4">
            <div className="flex gap-3">
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                onClick={() => { setPending('accept'); setStage('confirm') }}
              >
                <CheckCircle2 className="me-1.5 h-4 w-4" />Accept Offer
              </Button>
              <Button
                variant="outline"
                onClick={() => { setPending('negotiate'); setStage('confirm') }}
              >
                <MessageSquare className="me-1.5 h-4 w-4" />Negotiate
              </Button>
              <Button
                variant="outline"
                className="border-status-error text-status-error hover:bg-status-error/5"
                onClick={() => { setPending('decline'); setStage('confirm') }}
              >
                <XCircle className="me-1.5 h-4 w-4" />Decline
              </Button>
            </div>
          </div>
        )}

        <p className="text-xs text-center text-muted-foreground pb-6">
          This offer is confidential and intended for {offer.candidate?.name_en} only.
          For questions, contact <a href="mailto:careers@chessboard-group.com" className="underline">careers@chessboard-group.com</a>
        </p>
      </main>
    </div>
  )
}

function ClosedScreen({ title, message, icon }: { title: string; message: string; icon: 'check' | 'x' | 'clock' }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-brand-dark/5 to-background p-4">
      <div className="w-full max-w-md text-center space-y-4">
        <div className={`inline-flex h-16 w-16 items-center justify-center rounded-full mx-auto ${
          icon === 'check' ? 'bg-green-500/20' : icon === 'clock' ? 'bg-yellow-500/20' : 'bg-muted'
        }`}>
          {icon === 'check' && <CheckCircle2 className="h-8 w-8 text-green-600" />}
          {icon === 'x'     && <XCircle      className="h-8 w-8 text-muted-foreground" />}
          {icon === 'clock' && <Clock        className="h-8 w-8 text-yellow-600" />}
        </div>
        <h1 className="font-heading text-xl font-bold">{title}</h1>
        <p className="text-muted-foreground text-sm">{message}</p>
      </div>
    </div>
  )
}
