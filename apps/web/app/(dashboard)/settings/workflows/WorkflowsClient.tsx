'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, GripVertical, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'

type Workflow = {
  id: string
  name: string
  resource_type: string
  is_active: boolean
  created_at: string
  steps: WorkflowStep[]
}

type WorkflowStep = {
  id?: string
  step_order: number
  step_name: string
  approver_type: 'user' | 'role'
  approver_id: string | null
  sla_hours: number
  approval_mode: 'any_one' | 'majority' | 'all'
}

type User = { id: string; name_en: string; email: string }

const RESOURCE_TYPES = [
  { value: 'requisition', label: 'Requisition' },
  { value: 'offer',       label: 'Offer'       },
  { value: 'override',    label: 'Override'    },
]

const EMPTY_STEP: WorkflowStep = {
  step_order: 1, step_name: '', approver_type: 'user', approver_id: null, sla_hours: 48, approval_mode: 'any_one',
}

export function WorkflowsClient() {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [users, setUsers]         = useState<User[]>([])
  const [loading, setLoading]     = useState(true)
  const [open, setOpen]           = useState(false)
  const [wfName, setWfName]       = useState('')
  const [wfType, setWfType]       = useState('requisition')
  const [wfActive, setWfActive]   = useState(true)
  const [steps, setSteps]         = useState<WorkflowStep[]>([{ ...EMPTY_STEP }])
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [wf, us] = await Promise.all([
      fetch('/api/v1/approvals/workflows').then(r => r.json()),
      fetch('/api/v1/admin/users').then(r => r.json()),
    ])
    setWorkflows(Array.isArray(wf) ? wf : [])
    setUsers(Array.isArray(us) ? us : [])
    setLoading(false)
  }

  function openCreate() {
    setWfName(''); setWfType('requisition'); setWfActive(true)
    setSteps([{ ...EMPTY_STEP }])
    setError(''); setOpen(true)
  }

  function addStep() {
    setSteps(s => [...s, { ...EMPTY_STEP, step_order: s.length + 1, step_name: '' }])
  }

  function removeStep(i: number) {
    setSteps(s => s.filter((_, idx) => idx !== i).map((st, idx) => ({ ...st, step_order: idx + 1 })))
  }

  function updateStep(i: number, field: keyof WorkflowStep, value: any) {
    setSteps(s => s.map((st, idx) => idx === i ? { ...st, [field]: value } : st))
  }

  async function save() {
    if (!wfName) { setError('Workflow name is required'); return }
    if (steps.some(s => !s.step_name)) { setError('All steps must have a name'); return }
    setSaving(true); setError('')

    const res = await fetch('/api/v1/approvals/workflows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: wfName, resource_type: wfType, is_active: wfActive, steps }),
    })
    setSaving(false)
    if (res.ok) { setOpen(false); load() }
    else { const d = await res.json(); setError(d?.error?.message ?? 'Save failed') }
  }

  async function toggleActive(wf: Workflow) {
    await fetch(`/api/v1/approvals/workflows/${wf.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !wf.is_active }),
    })
    load()
  }

  async function remove(id: string) {
    await fetch(`/api/v1/approvals/workflows/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Approval Workflows</h2>
          <p className="text-sm text-muted-foreground">Define multi-step approval chains for requisitions, offers, and overrides.</p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="me-1.5 h-4 w-4" /> New Workflow
        </Button>
      </div>

      {loading ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Loading…</p>
      ) : workflows.length === 0 ? (
        <div className="py-16 text-center rounded-lg border border-dashed">
          <p className="text-sm text-muted-foreground">No workflows yet</p>
          <Button variant="outline" className="mt-4" onClick={openCreate}><Plus className="me-1.5 h-4 w-4" />Create workflow</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {workflows.map(wf => (
            <div key={wf.id} className="rounded-lg border bg-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{wf.name}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs capitalize">{wf.resource_type}</span>
                    {wf.is_active
                      ? <span className="rounded-full bg-brand-green/20 text-brand-dark px-2 py-0.5 text-xs">Active</span>
                      : <span className="rounded-full bg-muted text-muted-foreground px-2 py-0.5 text-xs">Inactive</span>
                    }
                  </div>
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    {(wf.steps ?? []).sort((a, b) => a.step_order - b.step_order).map((s, i) => (
                      <div key={s.id ?? i} className="flex items-center gap-1">
                        {i > 0 && <span className="text-muted-foreground">→</span>}
                        <div className="rounded-md border bg-muted/50 px-2.5 py-1 text-xs">
                          <span className="font-medium">{s.step_name}</span>
                          <span className="text-muted-foreground"> · {s.sla_hours}h SLA</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => toggleActive(wf)}>
                    {wf.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <button onClick={() => remove(wf.id)} className="rounded p-1 hover:bg-muted">
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Approval Workflow</DialogTitle>
            <DialogDescription>Build a sequential approval chain. Each step must be completed before the next activates.</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Workflow Name *</Label>
                <Input value={wfName} onChange={e => setWfName(e.target.value)} placeholder="Standard Requisition Approval" />
              </div>
              <div className="space-y-1.5">
                <Label>Applies To *</Label>
                <select value={wfType} onChange={e => setWfType(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                  {RESOURCE_TYPES.map(rt => <option key={rt.value} value={rt.value}>{rt.label}</option>)}
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
              <input type="checkbox" checked={wfActive} onChange={e => setWfActive(e.target.checked)} className="rounded" />
              Set as active workflow for this resource type
            </label>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Approval Steps</Label>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={addStep}>
                  <Plus className="me-1 h-3 w-3" /> Add Step
                </Button>
              </div>
              {steps.map((step, i) => (
                <div key={i} className="rounded-lg border p-4 space-y-3 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">Step {i + 1}</span>
                    {steps.length > 1 && (
                      <button onClick={() => removeStep(i)} className="rounded p-1 hover:bg-muted">
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Step Name *</Label>
                      <Input value={step.step_name} onChange={e => updateStep(i, 'step_name', e.target.value)} placeholder="e.g. HR Manager Review" />
                    </div>
                    <div className="space-y-1">
                      <Label>Approver</Label>
                      <select value={step.approver_id ?? ''} onChange={e => updateStep(i, 'approver_id', e.target.value || null)}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                        <option value="">— Any authorised user —</option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.name_en} ({u.email})</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>SLA (hours)</Label>
                      <Input type="number" min={1} value={step.sla_hours} onChange={e => updateStep(i, 'sla_hours', parseInt(e.target.value))} />
                    </div>
                    <div className="space-y-1">
                      <Label>Approval Mode</Label>
                      <select value={step.approval_mode} onChange={e => updateStep(i, 'approval_mode', e.target.value)}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                        <option value="any_one">Any one approver</option>
                        <option value="majority">Majority</option>
                        <option value="all">All approvers</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {error && <p className="text-sm text-status-error">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Workflow'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
