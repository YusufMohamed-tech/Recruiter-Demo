'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, Clock } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Override = {
  id: string
  status: 'pending' | 'approved' | 'rejected'
  justification: string
  created_at: string
  expires_at?: string
  resolved_at?: string
  rule?: { code: string; name_en: string; result_if_fail?: string }
  requester?: { name_en: string }
  approver?: { name_en: string }
}

const TABS = ['pending', 'approved', 'rejected'] as const

export function OverridesClient() {
  const [tab, setTab]         = useState<typeof TABS[number]>('pending')
  const [items, setItems]     = useState<Override[]>([])
  const [loading, setLoading] = useState(true)
  const [deciding, setDeciding] = useState<Override | null>(null)
  const [decision, setDecision] = useState<'approved' | 'rejected' | null>(null)
  const [expiresAt, setExpiresAt] = useState('')
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  useEffect(() => { load(tab) }, [tab])

  async function load(status: string) {
    setLoading(true)
    const res = await fetch(`/api/v1/compliance/overrides?status=${status}`)
    if (res.ok) setItems(await res.json())
    setLoading(false)
  }

  async function submitDecision() {
    if (!deciding || !decision) return
    setSaving(true)
    setError('')
    const body: Record<string, string> = { decision }
    if (decision === 'approved' && expiresAt) body.expires_at = expiresAt

    const res = await fetch(`/api/v1/compliance/overrides/${deciding.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setSaving(false)
    if (res.ok) {
      setDeciding(null)
      load(tab)
    } else {
      const data = await res.json()
      setError(data?.error ?? 'Failed to submit decision')
    }
  }

  const statusBadge = (s: Override['status']) => {
    if (s === 'pending')  return <span className="flex items-center gap-1 text-xs text-status-warning"><Clock className="h-3 w-3" />Pending</span>
    if (s === 'approved') return <span className="flex items-center gap-1 text-xs text-brand-green"><CheckCircle2 className="h-3 w-3" />Approved</span>
    return <span className="flex items-center gap-1 text-xs text-status-error"><XCircle className="h-3 w-3" />Rejected</span>
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border bg-muted p-1 w-fit">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
              tab === t ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">No {tab} override requests</p>
      ) : (
        <div className="space-y-3">
          {items.map(o => (
            <div key={o.id} className="rounded-lg border bg-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs text-muted-foreground">{o.rule?.code ?? '—'}</span>
                    <span className="font-medium">{o.rule?.name_en ?? '—'}</span>
                    {statusBadge(o.status)}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{o.justification}</p>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>Requested by: <strong className="text-foreground">{o.requester?.name_en ?? '—'}</strong></span>
                    <span>Submitted: {new Date(o.created_at).toLocaleDateString()}</span>
                    {o.resolved_at && <span>Resolved: {new Date(o.resolved_at).toLocaleDateString()}</span>}
                    {o.approver && <span>By: <strong className="text-foreground">{o.approver.name_en}</strong></span>}
                    {o.expires_at && <span>Expires: {new Date(o.expires_at).toLocaleDateString()}</span>}
                  </div>
                </div>
                {o.status === 'pending' && (
                  <div className="flex shrink-0 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-status-error text-status-error hover:bg-status-error/10"
                      onClick={() => { setDeciding(o); setDecision('rejected'); setExpiresAt(''); setError('') }}
                    >
                      <XCircle className="me-1.5 h-3.5 w-3.5" />Reject
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => { setDeciding(o); setDecision('approved'); setExpiresAt(''); setError('') }}
                    >
                      <CheckCircle2 className="me-1.5 h-3.5 w-3.5" />Approve
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Decision dialog */}
      <Dialog open={!!deciding} onOpenChange={() => setDeciding(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="capitalize">{decision} Override</DialogTitle>
            <DialogDescription>
              {decision === 'approved'
                ? 'Approving grants temporary relief from this rule. You cannot approve your own requests.'
                : 'Rejecting returns the record to blocked/warning status.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-md bg-muted px-4 py-3 text-sm">
              <p className="font-medium">{deciding?.rule?.name_en}</p>
              <p className="mt-1 text-xs text-muted-foreground">{deciding?.justification}</p>
            </div>
            {decision === 'approved' && (
              <div className="space-y-1.5">
                <Label>Expires At (optional)</Label>
                <Input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} />
                <p className="text-xs text-muted-foreground">Leave blank for indefinite approval</p>
              </div>
            )}
            {error && <p className="text-sm text-status-error">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeciding(null)}>Cancel</Button>
            <Button
              onClick={submitDecision}
              disabled={saving}
              variant={decision === 'rejected' ? 'destructive' : 'default'}
            >
              {saving ? 'Submitting…' : `Confirm ${decision}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
