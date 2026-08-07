'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeft, CheckCircle2, XCircle, AlertTriangle, Clock, Edit, Send,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ComplianceBadge, type ComplianceResult } from '@/components/compliance/ComplianceBadge'
import { RequisitionForm } from '../RequisitionForm'

type Requisition = any
type ApprovalRequest = any
type VersionItem = any

const STATUS_BADGE: Record<string, { cls: string; label: string }> = {
  draft:             { cls: 'bg-muted text-muted-foreground',         label: 'Draft'            },
  pending_approval:  { cls: 'bg-status-info/15 text-status-info',     label: 'Pending Approval' },
  approved:          { cls: 'bg-brand-green/20 text-brand-dark',       label: 'Approved'         },
  rejected:          { cls: 'bg-status-error/15 text-status-error',   label: 'Rejected'         },
  changes_requested: { cls: 'bg-status-warning/15 text-status-warning',label: 'Changes Needed'  },
  cancelled:         { cls: 'bg-muted text-muted-foreground',         label: 'Cancelled'        },
}

const STEP_ICON: Record<string, React.ElementType> = {
  completed: CheckCircle2, rejected: XCircle, changes_requested: AlertTriangle,
  active: Clock, pending: Clock,
}
const STEP_CLS: Record<string, string> = {
  completed: 'text-brand-green', rejected: 'text-status-error',
  changes_requested: 'text-status-warning', active: 'text-status-info', pending: 'text-muted-foreground',
}

export function RequisitionDetail({ id }: { id: string }) {
  const router = useRouter()
  const [req, setReq]           = useState<Requisition | null>(null)
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([])
  const [versions, setVersions] = useState<VersionItem[]>([])
  const [tab, setTab]           = useState<'details' | 'approvals' | 'history'>('details')
  const [loading, setLoading]   = useState(true)
  const [editing, setEditing]   = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitResult, setSubmitResult] = useState<any>(null)

  useEffect(() => { loadAll() }, [id])

  async function loadAll() {
    setLoading(true)
    const [r, a, v] = await Promise.all([
      fetch(`/api/v1/requisitions/${id}`).then(x => x.json()),
      fetch(`/api/v1/approvals/requests?resource_type=requisition&resource_id=${id}`).then(x => x.json()),
      fetch(`/api/v1/requisitions/${id}/versions`).then(x => x.json()),
    ])
    setReq(Array.isArray(r) ? null : r)
    setApprovals(Array.isArray(a) ? a : [])
    setVersions(Array.isArray(v) ? v : [])
    setLoading(false)
  }

  async function submitForApproval() {
    setSubmitting(true); setSubmitError(''); setSubmitResult(null)
    const res = await fetch(`/api/v1/requisitions/${id}/submit`, { method: 'POST' })
    const data = await res.json()
    setSubmitting(false)
    if (res.ok) {
      setSubmitResult(data)
      loadAll()
    } else {
      setSubmitError(data?.error ?? 'Submission failed')
      if (data?.compliance) setSubmitResult(data)
    }
  }

  async function decide(requestId: string, stepId: string, decision: string, comments?: string) {
    const res = await fetch(`/api/v1/approvals/requests/${requestId}/decide`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step_id: stepId, decision, comments }),
    })
    if (res.ok) loadAll()
  }

  if (loading) return <p className="py-12 text-center text-sm text-muted-foreground">Loading…</p>
  if (!req) return <p className="py-12 text-center text-sm text-status-error">Requisition not found.</p>

  const badge = STATUS_BADGE[req.status] ?? { cls: 'bg-muted text-muted-foreground', label: req.status }
  const canEdit   = ['draft','changes_requested'].includes(req.status)
  const canSubmit = ['draft','changes_requested'].includes(req.status)
  const latestApproval = approvals[0] ?? null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link href="/requisitions" className="mt-1 text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-sm text-muted-foreground">{req.ref_number}</span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.cls}`}>{badge.label}</span>
            </div>
            <h1 className="mt-1 font-heading text-2xl font-semibold">{req.title_en}</h1>
            {req.title_ar && <p className="text-sm text-muted-foreground" dir="rtl">{req.title_ar}</p>}
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          {canEdit && (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              <Edit className="me-1.5 h-4 w-4" /> Edit
            </Button>
          )}
          {canSubmit && (
            <Button size="sm" onClick={submitForApproval} disabled={submitting}>
              <Send className="me-1.5 h-4 w-4" /> {submitting ? 'Submitting…' : 'Submit for Approval'}
            </Button>
          )}
        </div>
      </div>

      {submitError && (
        <div className="rounded-md bg-status-error/10 border border-status-error/30 px-4 py-3 text-sm text-status-error">
          {submitError}
        </div>
      )}

      {submitResult?.compliance && submitResult.compliance.overall_result === 'BLOCKED' && (
        <div className="rounded-md border border-status-error/30 bg-status-error/5 p-4">
          <p className="text-sm font-medium text-status-error mb-2">Compliance blocked submission:</p>
          <ul className="space-y-1">
            {submitResult.compliance.items?.filter((i: any) => i.result === 'BLOCKED').map((i: any) => (
              <li key={i.rule_code} className="text-xs text-status-error">• [{i.rule_code}] {i.message_en}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex gap-6">
          {(['details','approvals','history'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-3 text-sm font-medium capitalize border-b-2 -mb-px transition-colors ${
                tab === t ? 'border-brand-green text-brand-dark' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {t}
              {t === 'approvals' && latestApproval && (
                <span className="ms-1.5 rounded-full bg-status-info/20 px-1.5 py-0.5 text-xs text-status-info">
                  {latestApproval.status}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {tab === 'details' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <InfoCard label="Department" value={req.department?.name_en ?? '—'} />
          <InfoCard label="Establishment" value={req.establishment?.name_en ?? '—'} />
          <InfoCard label="Headcount" value={String(req.headcount)} />
          <InfoCard label="Employment Type" value={req.employment_type?.replace(/_/g, ' ') ?? '—'} />
          <InfoCard label="Nationality Preference" value={req.nationality_pref ?? 'Any'} />
          <InfoCard label="Min Experience" value={req.min_experience_years != null ? `${req.min_experience_years} yrs` : '—'} />
          <InfoCard label="Education Level" value={req.education_level ?? '—'} />
          <InfoCard label="Salary Range (SAR)" value={
            req.salary_min || req.salary_max
              ? `${req.salary_min?.toLocaleString() ?? '?'} – ${req.salary_max?.toLocaleString() ?? '?'}`
              : '—'
          } />
          <InfoCard label="Budget Approved" value={req.budget_approved ? 'Yes' : 'No'} highlight={!req.budget_approved} />
          <InfoCard label="Target Hire Date" value={req.target_hire_date ? new Date(req.target_hire_date).toLocaleDateString() : '—'} />
          <InfoCard label="Created By" value={req.creator?.name_en ?? '—'} />
          <InfoCard label="Submitted" value={req.submitted_at ? new Date(req.submitted_at).toLocaleDateString() : '—'} />
          {req.justification_en && (
            <div className="md:col-span-2 lg:col-span-3 rounded-lg border bg-card p-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Justification (EN)</p>
              <p className="text-sm">{req.justification_en}</p>
            </div>
          )}
          {req.justification_ar && (
            <div className="md:col-span-2 lg:col-span-3 rounded-lg border bg-card p-4" dir="rtl">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">المبرر</p>
              <p className="text-sm font-arabic">{req.justification_ar}</p>
            </div>
          )}
        </div>
      )}

      {tab === 'approvals' && (
        <div className="space-y-4">
          {approvals.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">No approval requests yet. Submit the requisition to start the approval flow.</p>
          ) : (
            approvals.map((ar: any) => (
              <div key={ar.id} className="rounded-lg border bg-card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Approval Request</p>
                    <p className="text-xs text-muted-foreground">
                      by {ar.requester?.name_en} · {new Date(ar.submitted_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                    ar.status === 'approved' ? 'bg-brand-green/20 text-brand-dark' :
                    ar.status === 'pending'  ? 'bg-status-info/15 text-status-info' :
                    'bg-status-error/15 text-status-error'
                  }`}>{ar.status}</span>
                </div>
                <ol className="space-y-3">
                  {(ar.steps ?? []).sort((a: any, b: any) => a.step_order - b.step_order).map((step: any) => {
                    const Icon = STEP_ICON[step.status] ?? Clock
                    const cls = STEP_CLS[step.status] ?? 'text-muted-foreground'
                    return (
                      <li key={step.id} className="flex items-start gap-3">
                        <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${cls}`} />
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="text-sm font-medium">{step.step_name}</p>
                              <p className="text-xs text-muted-foreground">{step.approver?.name_en ?? 'Any user'}</p>
                            </div>
                            {step.status === 'active' && (
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline"
                                  className="border-status-error text-status-error hover:bg-status-error/10 h-7 px-2 text-xs"
                                  onClick={() => decide(ar.id, step.id, 'rejected')}>
                                  Reject
                                </Button>
                                <Button size="sm"
                                  className="h-7 px-2 text-xs"
                                  onClick={() => decide(ar.id, step.id, 'approved')}>
                                  Approve
                                </Button>
                              </div>
                            )}
                          </div>
                          {step.decision && (
                            <p className="mt-1 text-xs text-muted-foreground capitalize">
                              {step.decision} · {step.decided_at ? new Date(step.decided_at).toLocaleDateString() : ''}
                              {step.comments && ` · "${step.comments}"`}
                            </p>
                          )}
                        </div>
                      </li>
                    )
                  })}
                </ol>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'history' && (
        <div className="space-y-3">
          {versions.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">No version history yet.</p>
          ) : (
            versions.map((v: any) => (
              <div key={v.id} className="rounded-lg border bg-card p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Version {v.version}</p>
                  <p className="text-xs text-muted-foreground">
                    {v.changed_by?.name_en ?? '—'} · {new Date(v.created_at).toLocaleDateString()}
                  </p>
                </div>
                <details className="mt-2">
                  <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">View snapshot</summary>
                  <pre className="mt-2 overflow-auto rounded bg-muted p-3 text-xs">{JSON.stringify(v.snapshot, null, 2)}</pre>
                </details>
              </div>
            ))
          )}
        </div>
      )}

      {editing && (
        <RequisitionForm
          initial={{ ...req, id: req.id }}
          onClose={() => setEditing(false)}
          onSaved={() => { setEditing(false); loadAll() }}
        />
      )}
    </div>
  )
}

function InfoCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-1 text-sm font-medium ${highlight ? 'text-status-warning' : ''}`}>{value}</p>
    </div>
  )
}
