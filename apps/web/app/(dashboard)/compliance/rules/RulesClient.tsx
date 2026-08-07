'use client'

import { useEffect, useState } from 'react'
import { ComplianceBadge, type ComplianceResult } from '@/components/compliance/ComplianceBadge'
import { Plus, Pencil, Trash2, Clock } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

type Rule = {
  id: string
  code: string
  name_en: string
  name_ar: string
  rule_type: string
  result_if_fail: ComplianceResult
  status: string
  review_due_at?: string
  effective_from?: string
  effective_until?: string
  version: number
  description_en?: string
  description_ar?: string
  condition_json?: unknown
  source_url?: string
  applies_to?: string[]
}

const RESULT_OPTIONS = ['BLOCKED', 'WARNING', 'MANUAL_REVIEW'] as const
const STATUS_OPTIONS  = ['active', 'draft', 'inactive']     as const

const EMPTY: Partial<Rule> = {
  code: '', name_en: '', name_ar: '', rule_type: 'document',
  result_if_fail: 'BLOCKED', status: 'active',
  description_en: '', description_ar: '',
  condition_json: '{}',
  source_url: '', applies_to: [],
}

export function RulesClient() {
  const [rules, setRules]       = useState<Rule[]>([])
  const [loading, setLoading]   = useState(true)
  const [staleOnly, setStaleOnly] = useState(false)
  const [editing, setEditing]   = useState<Partial<Rule> | null>(null)
  const [open, setOpen]         = useState(false)
  const [saving, setSaving]     = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [condError, setCondError] = useState('')

  useEffect(() => { load() }, [staleOnly])

  async function load() {
    setLoading(true)
    const url = staleOnly ? '/api/v1/compliance/rules?stale=1' : '/api/v1/compliance/rules'
    const res = await fetch(url)
    if (res.ok) setRules(await res.json())
    setLoading(false)
  }

  function openCreate() {
    setEditing({ ...EMPTY })
    setCondError('')
    setOpen(true)
  }

  function openEdit(r: Rule) {
    setEditing({
      ...r,
      condition_json: typeof r.condition_json === 'string'
        ? r.condition_json
        : JSON.stringify(r.condition_json, null, 2),
    })
    setCondError('')
    setOpen(true)
  }

  async function save() {
    if (!editing) return
    setSaving(true)
    let cj: unknown
    try { cj = JSON.parse(editing.condition_json as string ?? '{}') }
    catch { setCondError('Invalid JSON in condition'); setSaving(false); return }
    setCondError('')

    const payload = { ...editing, condition_json: cj }
    const isNew   = !editing.id
    const url     = isNew ? '/api/v1/compliance/rules' : `/api/v1/compliance/rules/${editing.id}`
    const method  = isNew ? 'POST' : 'PATCH'

    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    setSaving(false)
    if (res.ok) { setOpen(false); load() }
  }

  async function softDelete(id: string) {
    await fetch(`/api/v1/compliance/rules/${id}`, { method: 'DELETE' })
    setDeleteId(null)
    load()
  }

  const today = new Date().toISOString().split('T')[0]
  const isStale = (r: Rule) => r.review_due_at ? r.review_due_at < today : false

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={staleOnly} onChange={e => setStaleOnly(e.target.checked)} className="rounded" />
            Show stale only
          </label>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="me-1.5 h-4 w-4" /> New Rule
        </Button>
      </div>

      {loading ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Loading…</p>
      ) : rules.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">No rules found</p>
      ) : (
        <div className="rounded-lg border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Rule</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">If Fail</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Review Due</th>
                <th className="px-4 py-3 font-medium">Ver.</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {rules.map(r => (
                <tr key={r.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{r.code}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{r.name_en}</p>
                    <p className="text-xs text-muted-foreground" dir="rtl">{r.name_ar}</p>
                  </td>
                  <td className="px-4 py-3 capitalize text-muted-foreground">{r.rule_type}</td>
                  <td className="px-4 py-3">
                    <ComplianceBadge result={r.result_if_fail} size="sm" />
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      r.status === 'active'   ? 'bg-brand-green/20 text-brand-dark'
                    : r.status === 'draft'    ? 'bg-muted text-muted-foreground'
                    :                           'bg-status-error/15 text-status-error'
                    }`}>{r.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    {r.review_due_at ? (
                      <span className={`flex items-center gap-1 text-xs ${isStale(r) ? 'text-status-warning font-medium' : 'text-muted-foreground'}`}>
                        {isStale(r) && <Clock className="h-3 w-3" />}
                        {r.review_due_at}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">v{r.version}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(r)} className="rounded p-1 hover:bg-muted" title="Edit">
                        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                      <button onClick={() => setDeleteId(r.id)} className="rounded p-1 hover:bg-muted" title="Deactivate">
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Edit Rule' : 'New Compliance Rule'}</DialogTitle>
            <DialogDescription>Define the condition and enforcement level for this rule.</DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Code *">
                  <Input value={editing.code ?? ''} onChange={e => setEditing(p => ({ ...p, code: e.target.value }))} placeholder="KSA-001" />
                </Field>
                <Field label="Type *">
                  <select value={editing.rule_type ?? 'document'} onChange={e => setEditing(p => ({ ...p, rule_type: e.target.value }))}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                    {['document','nitaqat','contract','government','payroll','internal'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Name (EN) *">
                  <Input value={editing.name_en ?? ''} onChange={e => setEditing(p => ({ ...p, name_en: e.target.value }))} />
                </Field>
                <Field label="Name (AR) *">
                  <Input value={editing.name_ar ?? ''} onChange={e => setEditing(p => ({ ...p, name_ar: e.target.value }))} className="text-right font-arabic" dir="rtl" />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="If Fail *">
                  <select value={editing.result_if_fail ?? 'BLOCKED'} onChange={e => setEditing(p => ({ ...p, result_if_fail: e.target.value as ComplianceResult }))}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                    {RESULT_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </Field>
                <Field label="Status *">
                  <select value={editing.status ?? 'active'} onChange={e => setEditing(p => ({ ...p, status: e.target.value }))}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                    {STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Field label="Effective From">
                  <Input type="date" value={editing.effective_from ?? ''} onChange={e => setEditing(p => ({ ...p, effective_from: e.target.value }))} />
                </Field>
                <Field label="Effective Until">
                  <Input type="date" value={editing.effective_until ?? ''} onChange={e => setEditing(p => ({ ...p, effective_until: e.target.value }))} />
                </Field>
                <Field label="Review Due">
                  <Input type="date" value={editing.review_due_at ?? ''} onChange={e => setEditing(p => ({ ...p, review_due_at: e.target.value }))} />
                </Field>
              </div>
              <Field label="Condition JSON *">
                <Textarea
                  rows={5}
                  value={editing.condition_json as string ?? '{}'}
                  onChange={e => setEditing(p => ({ ...p, condition_json: e.target.value }))}
                  className="font-mono text-xs"
                  spellCheck={false}
                />
                {condError && <p className="mt-1 text-xs text-status-error">{condError}</p>}
                <p className="mt-1 text-xs text-muted-foreground">
                  Shapes: <code>{'{field, operator, value}'}</code> · <code>{'{if:{}, then:{}}'}</code> · <code>{'{and:[...]}'}</code>
                </p>
              </Field>
              <Field label="Source URL">
                <Input value={editing.source_url ?? ''} onChange={e => setEditing(p => ({ ...p, source_url: e.target.value }))} placeholder="https://hrsd.gov.sa/..." />
              </Field>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Rule'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Soft-delete confirm */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Deactivate Rule</DialogTitle>
            <DialogDescription>This sets the rule status to inactive. It will no longer block evaluations but can be reactivated.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteId && softDelete(deleteId)}>Deactivate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  )
}
