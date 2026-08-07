'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Shield, CheckCircle2, Circle, AlertTriangle, Clock,
  RefreshCw, ChevronLeft, Plus, X, Building2, Users,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────

type ChecklistItem = {
  id: string
  item_type: string
  label_en: string
  mandatory: boolean
  status: string
  due_date: string | null
  notes: string | null
  waive_reason: string | null
  owner: { id: string; name_en: string } | null
}

type GovCase = {
  id: string
  case_type: string
  platform: string
  status: string
  reference_number: string | null
  submitted_at: string | null
  completed_at: string | null
  notes: string | null
  qiwa_contract_cases: QiwaCase[]
}

type QiwaCase = {
  id: string
  contract_number: string | null
  contract_status: string
  submitted_at: string | null
  signed_at: string | null
  qiwa_ref: string | null
  contract_discrepancies: Discrepancy[]
}

type Discrepancy = {
  id: string
  field_name: string
  offer_value: string | null
  contract_value: string | null
  resolved: boolean
  resolution_notes: string | null
}

type JoiningConfirmation = {
  identity_verified: boolean
  attendance_confirmed: boolean
  documents_received: boolean
  notes: string | null
  no_show: boolean
  no_show_reason: string | null
  confirmed_by_user: { id: string; name_en: string } | null
}

type ReadinessCase = {
  id: string
  status: string
  branch_type: string
  readiness_score: number
  mandatory_blockers: { item_type: string; label_en: string }[]
  target_join_date: string | null
  actual_join_date: string | null
  candidates: { id: string; name_en: string; name_ar: string; email: string; nationality: string } | null
  job_applications: { id: string; job_postings: { id: string; title_en: string; city: string } | null } | null
  offers: { id: string; current_version: number; status: string; offer_versions: { version: number; basic_salary: number; currency: string; total_compensation: number }[] } | null
  assigned_user: { id: string; name_en: string } | null
  readiness_checklist_items: ChecklistItem[]
  government_cases: GovCase[]
  joining_confirmations: JoiningConfirmation[] | JoiningConfirmation | null
}

// ── Constants ─────────────────────────────────────────────────────────────────

const BRANCH_LABELS: Record<string, string> = {
  saudi: 'Saudi', resident_expat: 'Resident Expat', new_expat: 'New Expat',
}

const ITEM_TYPE_LABELS: Record<string, string> = {
  compliance_readiness: 'Compliance',
  contract_readiness:   'Contract',
  government_process:   'Government Process',
  payroll_gosi:         'Payroll / GOSI',
  candidate_docs:       'Candidate Documents',
  internal_onboarding:  'Internal Onboarding',
}

const PLATFORM_LABELS: Record<string, string> = {
  qiwa: 'Qiwa', moi: 'MOI', gosi: 'GOSI', hrsd: 'HRSD',
}

const GOV_STATUS_COLORS: Record<string, string> = {
  pending:     'bg-gray-100 text-gray-700',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed:   'bg-green-100 text-green-800',
  cancelled:   'bg-red-100 text-red-700',
}

const CASE_STATUS_FLOW = ['open', 'in_progress', 'ready', 'joined', 'no_show']

// ── Score Arc ─────────────────────────────────────────────────────────────────

function ScoreArc({ score, blocked }: { score: number; blocked: boolean }) {
  const color = blocked ? '#ef4444' : score >= 80 ? '#22c55e' : score >= 50 ? '#eab308' : '#ef4444'
  const r = 40
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ

  return (
    <div className="flex flex-col items-center">
      <svg width="96" height="96" className="-rotate-90">
        <circle cx="48" cy="48" r={r} fill="none" stroke="#e5e7eb" strokeWidth="8" />
        <circle
          cx="48" cy="48" r={r} fill="none"
          stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="mt-[-68px] flex flex-col items-center">
        <span className="text-xl font-bold" style={{ color }}>{score}%</span>
        {blocked && <span className="text-xs font-medium text-red-500">BLOCKED</span>}
      </div>
    </div>
  )
}

// ── Checklist Group ───────────────────────────────────────────────────────────

function ChecklistGroup({
  caseId, items, onRefresh,
}: { caseId: string; items: ChecklistItem[]; onRefresh: () => void }) {
  const grouped: Record<string, ChecklistItem[]> = {}
  for (const item of items) {
    ;(grouped[item.item_type] ??= []).push(item)
  }

  async function updateItem(itemId: string, patch: Record<string, unknown>) {
    await fetch(`/api/v1/readiness/${caseId}/checklist/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    onRefresh()
  }

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([type, groupItems]) => (
        <div key={type}>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            {ITEM_TYPE_LABELS[type] ?? type}
          </p>
          <div className="space-y-1">
            {groupItems.map(item => {
              const done = item.status === 'completed' || item.status === 'waived'
              const blocked = item.status === 'blocked'
              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 p-2.5 rounded-lg border ${
                    done ? 'bg-green-50 border-green-100' :
                    blocked ? 'bg-red-50 border-red-100' :
                    item.mandatory ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100'
                  }`}
                >
                  <button
                    onClick={() => updateItem(item.id, {
                      status: done ? 'pending' : 'completed',
                    })}
                    className="flex-shrink-0"
                  >
                    {done
                      ? <CheckCircle2 className="h-5 w-5 text-green-500" />
                      : blocked
                      ? <AlertTriangle className="h-5 w-5 text-red-400" />
                      : <Circle className="h-5 w-5 text-gray-300 hover:text-gray-400" />
                    }
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${done ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                      {item.label_en}
                    </p>
                    {item.waive_reason && (
                      <p className="text-xs text-gray-400">Waived: {item.waive_reason}</p>
                    )}
                    {item.due_date && (
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {item.due_date}
                      </p>
                    )}
                  </div>
                  {item.mandatory && !done && (
                    <span className="text-xs text-red-500 font-medium flex-shrink-0">Required</span>
                  )}
                  {!done && (
                    <select
                      className="text-xs border rounded px-1.5 py-1 text-gray-600 bg-white"
                      value={item.status}
                      onChange={e => updateItem(item.id, { status: e.target.value })}
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="waived">Waived</option>
                      <option value="blocked">Blocked</option>
                    </select>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Government Cases Panel ─────────────────────────────────────────────────

function GovCasesPanel({
  caseId, cases, onRefresh,
}: { caseId: string; cases: GovCase[]; onRefresh: () => void }) {
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ case_type: '', platform: 'qiwa', reference_number: '', notes: '' })

  async function createCase() {
    await fetch(`/api/v1/readiness/${caseId}/government-cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setCreating(false)
    setForm({ case_type: '', platform: 'qiwa', reference_number: '', notes: '' })
    onRefresh()
  }

  async function updateGovCase(govId: string, patch: Record<string, unknown>) {
    await fetch(`/api/v1/government-cases/${govId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    onRefresh()
  }

  return (
    <div className="space-y-3">
      {cases.map(gc => {
        const qiwa = gc.qiwa_contract_cases?.[0]
        const unresolvedDiscrepancies = qiwa?.contract_discrepancies?.filter(d => !d.resolved) ?? []

        return (
          <div key={gc.id} className="border rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-gray-400" />
                <span className="font-medium text-sm">{gc.case_type}</span>
                <span className="text-xs text-gray-400 bg-white border rounded px-1.5 py-0.5">
                  {PLATFORM_LABELS[gc.platform] ?? gc.platform}
                </span>
                {gc.reference_number && (
                  <span className="text-xs text-gray-400">#{gc.reference_number}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${GOV_STATUS_COLORS[gc.status] ?? 'bg-gray-100 text-gray-700'}`}>
                  {gc.status.replace('_', ' ')}
                </span>
                <select
                  className="text-xs border rounded px-1.5 py-1"
                  value={gc.status}
                  onChange={e => updateGovCase(gc.id, { status: e.target.value })}
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {qiwa && (
              <div className="px-4 py-3 border-t">
                <p className="text-xs font-medium text-gray-500 mb-2">Qiwa Contract</p>
                <div className="flex gap-4 text-xs text-gray-600">
                  <span>Contract #: {qiwa.contract_number ?? '—'}</span>
                  <span>Status: {qiwa.contract_status}</span>
                  {qiwa.qiwa_ref && <span>Qiwa Ref: {qiwa.qiwa_ref}</span>}
                  {qiwa.signed_at && <span>Signed: {qiwa.signed_at.split('T')[0]}</span>}
                </div>
                {unresolvedDiscrepancies.length > 0 && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-red-600 font-medium">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {unresolvedDiscrepancies.length} unresolved discrepanc{unresolvedDiscrepancies.length > 1 ? 'ies' : 'y'} — blocks ready-to-join
                  </div>
                )}
              </div>
            )}

            {gc.notes && (
              <div className="px-4 py-2 border-t text-xs text-gray-500">{gc.notes}</div>
            )}
          </div>
        )
      })}

      {creating ? (
        <div className="border rounded-lg p-4 space-y-3">
          <p className="text-sm font-medium">New Government Case</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Case Type</Label>
              <Input
                className="h-8 mt-1"
                placeholder="e.g. Contract, Visa, Transfer"
                value={form.case_type}
                onChange={e => setForm(f => ({ ...f, case_type: e.target.value }))}
              />
            </div>
            <div>
              <Label className="text-xs">Platform</Label>
              <select
                className="w-full h-8 mt-1 border rounded-md px-2 text-sm"
                value={form.platform}
                onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}
              >
                <option value="qiwa">Qiwa</option>
                <option value="moi">MOI</option>
                <option value="gosi">GOSI</option>
                <option value="hrsd">HRSD</option>
              </select>
            </div>
            <div>
              <Label className="text-xs">Reference Number</Label>
              <Input
                className="h-8 mt-1"
                value={form.reference_number}
                onChange={e => setForm(f => ({ ...f, reference_number: e.target.value }))}
              />
            </div>
            <div>
              <Label className="text-xs">Notes</Label>
              <Input
                className="h-8 mt-1"
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={createCase} disabled={!form.case_type}>Create</Button>
            <Button variant="ghost" size="sm" onClick={() => setCreating(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setCreating(true)}>
          <Plus className="h-3.5 w-3.5" /> Add Government Case
        </Button>
      )}
    </div>
  )
}

// ── Joining Confirmation Form ──────────────────────────────────────────────

function JoiningForm({
  caseId, existing, onRefresh,
}: { caseId: string; existing: JoiningConfirmation | null; onRefresh: () => void }) {
  const [form, setForm] = useState({
    identity_verified:    existing?.identity_verified    ?? false,
    attendance_confirmed: existing?.attendance_confirmed ?? false,
    documents_received:   existing?.documents_received   ?? false,
    notes:                existing?.notes                ?? '',
    no_show:              existing?.no_show              ?? false,
    no_show_reason:       existing?.no_show_reason       ?? '',
  })
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    await fetch(`/api/v1/readiness/${caseId}/joining-confirmation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    onRefresh()
  }

  return (
    <div className="space-y-4">
      {existing?.confirmed_by_user && (
        <p className="text-xs text-gray-500">
          Last confirmed by {existing.confirmed_by_user.name_en}
        </p>
      )}

      <div className="space-y-3">
        {[
          { key: 'identity_verified',    label: 'Identity verified' },
          { key: 'attendance_confirmed', label: 'Attendance confirmed' },
          { key: 'documents_received',   label: 'Documents received' },
        ].map(({ key, label }) => (
          <label key={key} className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={(form as any)[key]}
              onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-[rgb(var(--brand-green))]"
            />
            <span className="text-sm text-gray-700">{label}</span>
          </label>
        ))}
      </div>

      <div>
        <Label className="text-xs">Notes</Label>
        <textarea
          className="w-full mt-1 border rounded-md p-2 text-sm resize-none"
          rows={2}
          value={form.notes}
          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
        />
      </div>

      <div className="flex items-start gap-3 p-3 rounded-lg border border-red-100 bg-red-50">
        <input
          type="checkbox"
          checked={form.no_show}
          onChange={e => setForm(f => ({ ...f, no_show: e.target.checked }))}
          className="mt-0.5 h-4 w-4 rounded border-red-300"
        />
        <div className="flex-1">
          <p className="text-sm font-medium text-red-700">Candidate did not show up</p>
          {form.no_show && (
            <Input
              className="mt-2 h-8"
              placeholder="Reason..."
              value={form.no_show_reason}
              onChange={e => setForm(f => ({ ...f, no_show_reason: e.target.value }))}
            />
          )}
        </div>
      </div>

      <Button size="sm" onClick={save} disabled={saving}>
        {saving ? 'Saving...' : existing ? 'Update Confirmation' : 'Record Joining'}
      </Button>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────

export function ReadinessDetail({ id }: { id: string }) {
  const [cas, setCas]       = useState<ReadinessCase | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab]       = useState<'checklist' | 'government' | 'joining'>('checklist')
  const [recalculating, setRecalculating] = useState(false)

  const TABS: { key: typeof tab; label: string }[] = [
    { key: 'checklist', label: 'Readiness Checklist' },
    { key: 'government', label: 'Government Cases' },
    { key: 'joining', label: 'Joining Confirmation' },
  ]

  function load() {
    fetch(`/api/v1/readiness/${id}`)
      .then(r => r.json())
      .then(d => { setCas(d); setLoading(false) })
  }

  useEffect(() => { load() }, [id])

  async function recalculate() {
    setRecalculating(true)
    await fetch(`/api/v1/readiness/${id}/sere`, { method: 'POST' })
    load()
    setRecalculating(false)
  }

  async function updateStatus(status: string) {
    await fetch(`/api/v1/readiness/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    load()
  }

  if (loading) return <div className="flex items-center justify-center h-40 text-gray-400">Loading...</div>
  if (!cas) return <div className="p-6 text-red-500">Readiness case not found.</div>

  const blockers = Array.isArray(cas.mandatory_blockers) ? cas.mandatory_blockers : []
  const isBlocked = blockers.length > 0
  const joiningConf = Array.isArray(cas.joining_confirmations)
    ? (cas.joining_confirmations[0] ?? null)
    : (cas.joining_confirmations ?? null)

  const currentVer = cas.offers?.offer_versions?.find(v => v.version === cas.offers?.current_version)

  const checklistItems = Array.isArray(cas.readiness_checklist_items) ? cas.readiness_checklist_items : []
  const doneCount = checklistItems.filter(i => i.status === 'completed' || i.status === 'waived').length
  const mandatoryRemaining = checklistItems.filter(i => i.mandatory && i.status !== 'completed' && i.status !== 'waived').length

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center gap-2 mb-3">
          <Link href="/readiness" className="text-gray-400 hover:text-gray-600">
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-lg font-semibold">
            {cas.candidates?.name_en ?? 'Unnamed Candidate'} — Readiness Case
          </h1>
          <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
            {BRANCH_LABELS[cas.branch_type] ?? cas.branch_type}
          </span>
        </div>

        <div className="flex items-start gap-6">
          {/* Score arc */}
          <ScoreArc score={cas.readiness_score} blocked={isBlocked} />

          {/* Meta */}
          <div className="flex-1 space-y-2">
            <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
              <div className="text-gray-500">Role
                <span className="ml-2 text-gray-800">
                  {cas.job_applications?.job_postings?.title_en ?? '—'}
                </span>
              </div>
              <div className="text-gray-500">Email
                <span className="ml-2 text-gray-800">{cas.candidates?.email ?? '—'}</span>
              </div>
              {currentVer && (
                <div className="text-gray-500">Offer
                  <span className="ml-2 text-gray-800">
                    {currentVer.currency} {Number(currentVer.total_compensation).toLocaleString()} / mo
                  </span>
                </div>
              )}
              <div className="text-gray-500">Target Join
                <span className="ml-2 text-gray-800">{cas.target_join_date ?? '—'}</span>
              </div>
            </div>

            {/* Status bar */}
            <div className="flex items-center gap-2 mt-3">
              <span className="text-xs text-gray-500">Status:</span>
              {CASE_STATUS_FLOW.map(s => (
                <button
                  key={s}
                  onClick={() => s !== 'no_show' && updateStatus(s)}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                    cas.status === s
                      ? 'bg-[rgb(var(--brand-green))] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* Blockers */}
            {isBlocked && (
              <div className="mt-2 p-2.5 bg-red-50 border border-red-100 rounded-lg">
                <p className="text-xs font-semibold text-red-600 mb-1 flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" /> Critical Blockers
                </p>
                <ul className="list-disc list-inside space-y-0.5">
                  {blockers.map((b, i) => (
                    <li key={i} className="text-xs text-red-700">{b.label_en}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button variant="outline" size="sm" onClick={recalculate} disabled={recalculating} className="gap-1.5">
              <RefreshCw className={`h-3.5 w-3.5 ${recalculating ? 'animate-spin' : ''}`} />
              Recalculate
            </Button>
            {cas.offers?.id && (
              <Link href={`/offers/${cas.offers.id}`}>
                <Button variant="ghost" size="sm">View Offer</Button>
              </Link>
            )}
          </div>
        </div>

        {/* Checklist progress bar */}
        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-[rgb(var(--brand-green))]"
              style={{ width: `${checklistItems.length > 0 ? (doneCount / checklistItems.length) * 100 : 0}%` }}
            />
          </div>
          <span className="text-xs text-gray-500">
            {doneCount}/{checklistItems.length} items complete
            {mandatoryRemaining > 0 && <span className="text-red-500 ml-2">{mandatoryRemaining} mandatory remaining</span>}
          </span>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b px-6">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? 'border-[rgb(var(--brand-green))] text-[rgb(var(--brand-green))]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto p-6">
        {tab === 'checklist' && (
          <ChecklistGroup caseId={id} items={checklistItems} onRefresh={load} />
        )}

        {tab === 'government' && (
          <GovCasesPanel
            caseId={id}
            cases={Array.isArray(cas.government_cases) ? cas.government_cases : []}
            onRefresh={load}
          />
        )}

        {tab === 'joining' && (
          <div className="max-w-lg">
            {mandatoryRemaining > 0 ? (
              <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-100 rounded-lg mb-4">
                <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Ready-to-join gate blocked</p>
                  <p className="text-xs text-yellow-700 mt-0.5">
                    {mandatoryRemaining} mandatory checklist item{mandatoryRemaining > 1 ? 's' : ''} must be completed before confirming joining.
                  </p>
                </div>
              </div>
            ) : null}
            <JoiningForm caseId={id} existing={joiningConf} onRefresh={load} />
          </div>
        )}
      </div>
    </div>
  )
}
