'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, Send, AlertCircle, CheckCircle2, Copy, Loader2, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type OfferVersion = {
  id: string; version: number; job_title: string; start_date?: string
  base_salary?: number; currency: string
  allowances: Record<string, number>
  benefits: { items?: string[] }
  terms_en?: string; terms_ar?: string; created_at: string
}

type OfferResponse = {
  id: string; action: string; candidate_notes?: string; counter_details?: Record<string, unknown>; created_at: string
}

type Offer = {
  id: string; status: string; current_version: number
  expires_at?: string; accepted_at?: string; declined_at?: string
  withdrawn_at?: string; withdraw_reason?: string; acceptance_hash?: string
  created_at: string
  candidates?: { id: string; name_en: string; name_ar?: string; email: string; phone?: string; nationality?: string }
  job_applications?: { id: string; current_stage: string; job_postings?: { id: string; title_en: string } }
  creator?: { id: string; name_en: string }
  offer_versions?: OfferVersion[]
  offer_responses?: OfferResponse[]
}

const STATUS_COLORS: Record<string, string> = {
  draft:            'bg-muted text-muted-foreground border-border',
  pending_approval: 'bg-yellow-500/15 text-yellow-700 border-yellow-200',
  sent:             'bg-blue-500/15 text-blue-700 border-blue-200',
  accepted:         'bg-green-500/15 text-green-700 border-green-200',
  declined:         'bg-status-error/10 text-status-error border-status-error/20',
  withdrawn:        'bg-muted text-muted-foreground border-border',
}

const ALLOWANCE_LABELS: Record<string, string> = {
  housing: 'Housing', transport: 'Transport', food: 'Food', other: 'Other',
}

function fmt(n?: number, cur = 'SAR') {
  if (n == null) return '—'
  return n.toLocaleString('en', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' ' + cur
}

function daysLeft(exp?: string) {
  if (!exp) return null
  const diff = Math.ceil((new Date(exp).getTime() - Date.now()) / 86400000)
  return diff
}

export function OfferDetail({ id }: { id: string }) {
  const [offer, setOffer]         = useState<Offer | null>(null)
  const [loading, setLoading]     = useState(true)
  const [tab, setTab]             = useState<'package' | 'activity' | 'approval'>('package')
  const [offerUrl, setOfferUrl]   = useState('')
  const [copied, setCopied]       = useState(false)
  const [actionMsg, setActionMsg] = useState('')
  const [actionErr, setActionErr] = useState('')
  const [withDrawReason, setWdrReason] = useState('')
  const [showWdr, setShowWdr]     = useState(false)
  const [busy, setBusy]           = useState(false)

  useEffect(() => {
    fetch(`/api/v1/offers/${id}`)
      .then(r => r.json())
      .then(d => { setOffer(d); setLoading(false) })
  }, [id])

  function notify(msg: string, err?: boolean) {
    err ? setActionErr(msg) : setActionMsg(msg)
    setTimeout(() => { setActionMsg(''); setActionErr('') }, 4000)
  }

  async function send() {
    setBusy(true)
    const res = await fetch(`/api/v1/offers/${id}/send`, { method: 'POST' })
    setBusy(false)
    if (res.ok) {
      const d = await res.json()
      setOfferUrl(d.url)
      setOffer(o => o ? { ...o, status: 'sent' } : o)
      notify('Offer sent — copy link to share with candidate')
    } else {
      const d = await res.json()
      notify(d?.error ?? 'Failed to send', true)
    }
  }

  async function submitApproval() {
    setBusy(true)
    const res = await fetch(`/api/v1/offers/${id}/submit-approval`, { method: 'POST' })
    setBusy(false)
    if (res.ok) {
      const d = await res.json()
      setOffer(o => o ? { ...o, status: 'pending_approval' } : o)
      notify(d.skipped ? 'No workflow found — offer is ready to send' : 'Submitted for approval')
    } else {
      const d = await res.json()
      notify(d?.error ?? 'Failed', true)
    }
  }

  async function withdraw() {
    setBusy(true)
    const res = await fetch(`/api/v1/offers/${id}/withdraw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: withDrawReason || undefined }),
    })
    setBusy(false)
    if (res.ok) {
      setOffer(o => o ? { ...o, status: 'withdrawn', withdrawn_at: new Date().toISOString(), withdraw_reason: withDrawReason || undefined } : o)
      setShowWdr(false)
      notify('Offer withdrawn')
    } else {
      notify('Failed to withdraw', true)
    }
  }

  async function copyLink() {
    const url = offerUrl || (offer ? `${window.location.origin}/offer/${(offer as any).access_token ?? ''}` : '')
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return <div className="py-12 text-center text-sm text-muted-foreground">Loading…</div>
  if (!offer)  return <div className="py-12 text-center text-sm text-muted-foreground">Offer not found.</div>

  const currentVer  = offer.offer_versions?.find(v => v.version === offer.current_version) ?? offer.offer_versions?.at(-1)
  const days        = daysLeft(offer.expires_at)
  const isExpired   = days != null && days < 0
  const canSend     = ['draft','pending_approval'].includes(offer.status)
  const canApprove  = offer.status === 'draft'
  const canWithdraw = ['draft','pending_approval','sent'].includes(offer.status)

  const totalAllowances = currentVer
    ? Object.values(currentVer.allowances ?? {}).reduce((s, v) => s + (v ?? 0), 0)
    : 0
  const totalComp = (currentVer?.base_salary ?? 0) + totalAllowances

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/offers" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-heading text-xl font-semibold">
                {offer.candidates?.name_en}
              </h1>
              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[offer.status] ?? 'bg-muted'}`}>
                {offer.status.replace(/_/g,' ')}
              </span>
              {offer.offer_versions && offer.offer_versions.length > 1 && (
                <span className="text-xs text-muted-foreground">v{offer.current_version}</span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {currentVer?.job_title}
              {offer.job_applications?.job_postings?.title_en && ` · ${offer.job_applications.job_postings.title_en}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          {canApprove && (
            <Button size="sm" variant="outline" onClick={submitApproval} disabled={busy}>
              Submit for Approval
            </Button>
          )}
          {canSend && (
            <Button size="sm" onClick={send} disabled={busy}>
              {busy ? <Loader2 className="me-1.5 h-4 w-4 animate-spin" /> : <Send className="me-1.5 h-4 w-4" />}
              Send to Candidate
            </Button>
          )}
          {canWithdraw && (
            <Button size="sm" variant="outline" onClick={() => setShowWdr(v => !v)} disabled={busy}
              className="border-status-error text-status-error hover:bg-status-error/5">
              Withdraw
            </Button>
          )}
        </div>
      </div>

      {/* Expiry warning */}
      {offer.expires_at && offer.status === 'sent' && (
        <div className={`flex items-center gap-2 rounded-lg p-3 text-sm ${
          isExpired ? 'bg-status-error/10 text-status-error' :
          days != null && days <= 3 ? 'bg-status-warning/10 text-status-warning' :
          'bg-muted/50 text-muted-foreground'
        }`}>
          <Clock className="h-4 w-4 shrink-0" />
          {isExpired ? 'This offer has expired.' :
           `Expires in ${days} day${days !== 1 ? 's' : ''} — ${new Date(offer.expires_at).toLocaleDateString()}`}
        </div>
      )}

      {/* Feedback */}
      {(actionMsg || actionErr) && (
        <div className={`flex items-center gap-2 rounded-lg p-3 text-sm ${actionErr ? 'bg-status-error/10 text-status-error' : 'bg-status-success/10 text-status-success'}`}>
          {actionErr ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          {actionMsg || actionErr}
        </div>
      )}

      {/* Offer link */}
      {(offerUrl || offer.status === 'sent' || offer.status === 'accepted') && (
        <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-3 text-sm">
          <code className="flex-1 truncate text-xs text-muted-foreground">
            {offerUrl || `Offer link available — use Send to generate`}
          </code>
          {offerUrl && (
            <Button size="sm" variant="outline" onClick={copyLink}>
              <Copy className="me-1.5 h-3.5 w-3.5" />{copied ? 'Copied!' : 'Copy Link'}
            </Button>
          )}
        </div>
      )}

      {/* Withdrawal confirm */}
      {showWdr && (
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <p className="font-medium text-sm">Confirm Withdrawal</p>
          <div className="space-y-1">
            <Label>Reason (optional)</Label>
            <Input value={withDrawReason} onChange={e => setWdrReason(e.target.value)} placeholder="Reason for withdrawal…" />
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowWdr(false)}>Cancel</Button>
            <Button size="sm" onClick={withdraw} disabled={busy}
              className="bg-status-error hover:bg-status-error/80 text-white">
              Confirm Withdraw
            </Button>
          </div>
        </div>
      )}

      {/* Acceptance hash */}
      {offer.accepted_at && offer.acceptance_hash && (
        <div className="rounded-xl border bg-green-500/5 border-green-200 p-4 space-y-1">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <p className="font-semibold text-sm text-green-700">Accepted</p>
            <span className="text-xs text-muted-foreground">{new Date(offer.accepted_at).toLocaleString()}</span>
          </div>
          <p className="text-xs text-muted-foreground font-mono break-all">Evidence hash: {offer.acceptance_hash}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {(['package','activity','approval'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              tab === t ? 'border-brand-green text-brand-dark' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t === 'approval' ? 'Approval' : t}
          </button>
        ))}
      </div>

      {/* Package tab */}
      {tab === 'package' && currentVer && (
        <div className="space-y-6">
          {/* Compensation summary */}
          <div className="rounded-xl border bg-card p-5 space-y-4">
            <p className="font-semibold text-sm">Compensation Package</p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <CompCard label="Base Salary" value={fmt(currentVer.base_salary, currentVer.currency)} highlight />
              {Object.entries(currentVer.allowances ?? {}).map(([k, v]) => (
                v > 0 && <CompCard key={k} label={ALLOWANCE_LABELS[k] ?? k} value={fmt(v, currentVer.currency)} />
              ))}
              {totalAllowances > 0 && (
                <CompCard label="Total Allowances" value={fmt(totalAllowances, currentVer.currency)} />
              )}
              {totalComp > 0 && (
                <CompCard label="Total Package" value={fmt(totalComp, currentVer.currency)} highlight />
              )}
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <InfoCard label="Job Title" value={currentVer.job_title} />
            <InfoCard label="Start Date" value={currentVer.start_date ? new Date(currentVer.start_date).toLocaleDateString() : '—'} />
            <InfoCard label="Currency" value={currentVer.currency} />
            <InfoCard label="Version" value={`v${currentVer.version}`} />
          </div>

          {/* Benefits */}
          {currentVer.benefits?.items && currentVer.benefits.items.length > 0 && (
            <div className="rounded-xl border bg-card p-5 space-y-3">
              <p className="font-semibold text-sm">Benefits</p>
              <div className="flex flex-wrap gap-2">
                {currentVer.benefits.items.map(b => (
                  <span key={b} className="inline-flex items-center gap-1 rounded-full bg-brand-green/10 px-3 py-1 text-xs font-medium text-brand-dark">
                    <CheckCircle2 className="h-3 w-3" />{b}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Terms */}
          {currentVer.terms_en && (
            <div className="rounded-xl border bg-card p-5 space-y-2">
              <p className="font-semibold text-sm">Terms & Conditions</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{currentVer.terms_en}</p>
            </div>
          )}
          {currentVer.terms_ar && (
            <div className="rounded-xl border bg-card p-5 space-y-2">
              <p className="font-semibold text-sm text-right font-arabic">الشروط والأحكام</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap text-right font-arabic" dir="rtl">{currentVer.terms_ar}</p>
            </div>
          )}

          {/* Version history */}
          {offer.offer_versions && offer.offer_versions.length > 1 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-muted-foreground">Version History</p>
              {offer.offer_versions.slice().reverse().map(v => (
                <div key={v.id} className={`flex items-center justify-between rounded-lg border px-4 py-3 text-sm ${v.version === offer.current_version ? 'bg-brand-green/5 border-brand-green/30' : ''}`}>
                  <div className="flex items-center gap-3">
                    <span className="font-medium">v{v.version}</span>
                    {v.version === offer.current_version && <span className="text-xs text-brand-dark font-medium">current</span>}
                  </div>
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <span>{v.job_title}</span>
                    <span>{fmt(v.base_salary, v.currency)}</span>
                    <span className="text-xs">{new Date(v.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Activity tab */}
      {tab === 'activity' && (
        <div className="space-y-3">
          {(!offer.offer_responses || offer.offer_responses.length === 0) && (
            <p className="py-8 text-center text-sm text-muted-foreground">No candidate responses yet.</p>
          )}
          {offer.offer_responses?.slice().reverse().map(r => (
            <div key={r.id} className="rounded-xl border bg-card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                  r.action === 'accept'    ? 'bg-green-500/10 text-green-700' :
                  r.action === 'decline'  ? 'bg-status-error/10 text-status-error' :
                                            'bg-yellow-500/10 text-yellow-700'
                }`}>{r.action}</span>
                <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span>
              </div>
              {r.candidate_notes && <p className="text-sm text-muted-foreground">{r.candidate_notes}</p>}
              {r.counter_details && Object.keys(r.counter_details).length > 0 && (
                <pre className="text-xs bg-muted/50 rounded p-2 overflow-x-auto">{JSON.stringify(r.counter_details, null, 2)}</pre>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Approval tab */}
      {tab === 'approval' && (
        <ApprovalStatus offerId={id} />
      )}
    </div>
  )
}

function ApprovalStatus({ offerId }: { offerId: string }) {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    fetch(`/api/v1/approvals/requests?resource_type=offer&resource_id=${offerId}`)
      .then(r => r.json())
      .then(d => { setRequests(Array.isArray(d) ? d : []); setLoading(false) })
  }, [offerId])

  if (loading) return <div className="py-8 text-center text-sm text-muted-foreground">Loading…</div>
  if (requests.length === 0) return (
    <div className="py-8 text-center text-sm text-muted-foreground">
      No approval requests. Submit for approval to start the chain.
    </div>
  )

  return (
    <div className="space-y-4">
      {requests.map((req: any) => (
        <div key={req.id} className="rounded-xl border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">Approval Request</span>
            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
              req.status === 'approved' ? 'bg-green-500/10 text-green-700 border-green-200' :
              req.status === 'rejected' ? 'bg-status-error/10 text-status-error border-status-error/20' :
              'bg-yellow-500/10 text-yellow-700 border-yellow-200'
            }`}>{req.status}</span>
          </div>
          <div className="space-y-2">
            {(req.steps ?? []).map((step: any) => (
              <div key={step.id} className="flex items-center gap-3 text-sm">
                <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  step.status === 'approved' ? 'bg-green-500 text-white' :
                  step.status === 'rejected' ? 'bg-status-error text-white' :
                  step.status === 'active'   ? 'bg-brand-dark text-white' :
                  'bg-muted text-muted-foreground'
                }`}>{step.step_order}</div>
                <span className="font-medium flex-1">{step.step_name}</span>
                <span className="text-muted-foreground">{step.approver?.name_en}</span>
                <span className="text-xs text-muted-foreground capitalize">{step.status}</span>
                {step.comments && <span className="text-xs text-muted-foreground italic">{step.comments}</span>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function CompCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 text-center ${highlight ? 'bg-brand-green/10 border-brand-green/30' : 'bg-card'}`}>
      <p className="text-lg font-bold">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  )
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  )
}
