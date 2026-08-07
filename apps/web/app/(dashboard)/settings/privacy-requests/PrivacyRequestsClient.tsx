'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Shield, Plus, X, CheckCircle2, Clock, AlertTriangle } from 'lucide-react'

type PrivacyRequest = {
  id: string
  request_type: string
  requester_name: string
  requester_email: string
  description: string | null
  status: string
  handled_at: string | null
  resolution_notes: string | null
  created_at: string
  candidates: { id: string; name_en: string; email: string } | null
  handled_by_user: { id: string; name_en: string } | null
}

const REQUEST_TYPE_LABELS: Record<string, string> = {
  access:          'Access',
  erasure:         'Erasure (Right to be Forgotten)',
  rectification:   'Rectification',
  portability:     'Data Portability',
  objection:       'Objection to Processing',
}

const STATUS_COLORS: Record<string, string> = {
  open:       'bg-yellow-100 text-yellow-800',
  in_review:  'bg-blue-100 text-blue-800',
  completed:  'bg-green-100 text-green-800',
  rejected:   'bg-red-100 text-red-700',
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  open:      <Clock className="h-4 w-4 text-yellow-500" />,
  in_review: <AlertTriangle className="h-4 w-4 text-blue-500" />,
  completed: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  rejected:  <X className="h-4 w-4 text-red-500" />,
}

const STATUS_TABS = [
  { key: '', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'in_review', label: 'In Review' },
  { key: 'completed', label: 'Completed' },
  { key: 'rejected', label: 'Rejected' },
]

function NewRequestModal({ onSave, onClose }: { onSave: () => void; onClose: () => void }) {
  const [form, setForm] = useState({
    request_type:    'access' as string,
    requester_name:  '',
    requester_email: '',
    description:     '',
  })
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    await fetch('/api/v1/privacy-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    onSave()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">New Privacy Request</h2>
          <button onClick={onClose}><X className="h-4 w-4 text-gray-400" /></button>
        </div>

        <div className="space-y-3">
          <div>
            <Label className="text-xs">Request Type</Label>
            <select
              className="w-full h-9 mt-1 border rounded-md px-2 text-sm"
              value={form.request_type}
              onChange={e => setForm(f => ({ ...f, request_type: e.target.value }))}
            >
              {Object.entries(REQUEST_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-xs">Requester Name</Label>
            <Input className="mt-1 h-9" value={form.requester_name} onChange={e => setForm(f => ({ ...f, requester_name: e.target.value }))} />
          </div>
          <div>
            <Label className="text-xs">Requester Email</Label>
            <Input className="mt-1 h-9" type="email" value={form.requester_email} onChange={e => setForm(f => ({ ...f, requester_email: e.target.value }))} />
          </div>
          <div>
            <Label className="text-xs">Description</Label>
            <textarea
              className="w-full mt-1 border rounded-md p-2 text-sm resize-none"
              rows={3}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button size="sm" onClick={save} disabled={saving || !form.requester_name || !form.requester_email}>
            {saving ? 'Saving...' : 'Create Request'}
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </div>
  )
}

function RequestRow({ req, onUpdate }: { req: PrivacyRequest; onUpdate: () => void }) {
  const [showResolve, setShowResolve] = useState(false)
  const [notes, setNotes]             = useState('')
  const [saving, setSaving]           = useState(false)

  async function decide(status: 'completed' | 'rejected' | 'in_review') {
    setSaving(true)
    await fetch(`/api/v1/privacy-requests/${req.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, resolution_notes: notes || undefined }),
    })
    setSaving(false)
    setShowResolve(false)
    onUpdate()
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex items-start justify-between px-4 py-3">
        <div className="flex items-start gap-3">
          {STATUS_ICON[req.status] ?? <Clock className="h-4 w-4 text-gray-300" />}
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium text-sm text-gray-900">{req.requester_name}</p>
              <span className="text-xs text-gray-400">{req.requester_email}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-2 py-0.5 rounded font-medium ${STATUS_COLORS[req.status] ?? 'bg-gray-100 text-gray-700'}`}>
                {req.status.replace('_', ' ')}
              </span>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                {REQUEST_TYPE_LABELS[req.request_type] ?? req.request_type}
              </span>
              <span className="text-xs text-gray-400">{req.created_at.split('T')[0]}</span>
            </div>
            {req.description && <p className="text-xs text-gray-500 mt-1">{req.description}</p>}
            {req.candidates && (
              <p className="text-xs text-gray-400 mt-1">Candidate: {req.candidates.name_en}</p>
            )}
            {req.handled_by_user && req.handled_at && (
              <p className="text-xs text-gray-400 mt-0.5">
                Handled by {req.handled_by_user.name_en} on {req.handled_at.split('T')[0]}
              </p>
            )}
            {req.resolution_notes && (
              <p className="text-xs text-gray-500 mt-1 italic">{req.resolution_notes}</p>
            )}
          </div>
        </div>

        {req.status === 'open' || req.status === 'in_review' ? (
          <div className="flex gap-1.5 flex-shrink-0">
            {req.status === 'open' && (
              <Button variant="outline" size="sm" onClick={() => decide('in_review')}>
                Review
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setShowResolve(s => !s)}>
              Resolve
            </Button>
          </div>
        ) : null}
      </div>

      {showResolve && (
        <div className="border-t px-4 py-3 bg-gray-50 space-y-2">
          <Label className="text-xs">Resolution Notes</Label>
          <textarea
            className="w-full border rounded-md p-2 text-sm resize-none"
            rows={2}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Describe how this request was handled..."
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={() => decide('completed')} disabled={saving}>Mark Completed</Button>
            <Button size="sm" variant="outline" onClick={() => decide('rejected')} disabled={saving} className="text-red-600 border-red-200">Reject</Button>
            <Button variant="ghost" size="sm" onClick={() => setShowResolve(false)}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  )
}

export function PrivacyRequestsClient() {
  const [requests, setRequests] = useState<PrivacyRequest[]>([])
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState('')
  const [total, setTotal]       = useState(0)
  const [showNew, setShowNew]   = useState(false)

  function load() {
    setLoading(true)
    const params = new URLSearchParams({ limit: '50' })
    if (tab) params.set('status', tab)
    fetch(`/api/v1/privacy-requests?${params}`)
      .then(r => { setTotal(parseInt(r.headers.get('X-Total-Count') ?? '0')); return r.json() })
      .then(d => { setRequests(d); setLoading(false) })
  }

  useEffect(() => { load() }, [tab])

  return (
    <div className="flex flex-col h-full">
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <Shield className="h-5 w-5 text-[rgb(var(--brand-green))]" />
              Privacy Requests
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">{total} requests total</p>
          </div>
          <Button size="sm" className="gap-1.5" onClick={() => setShowNew(true)}>
            <Plus className="h-3.5 w-3.5" /> New Request
          </Button>
        </div>

        <div className="flex gap-1 border rounded-lg p-1 bg-gray-50 w-fit">
          {STATUS_TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tab === t.key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-gray-400">Loading...</div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400">
            <Shield className="h-8 w-8 mb-2 opacity-40" />
            <p className="text-sm">No privacy requests</p>
          </div>
        ) : (
          requests.map(r => <RequestRow key={r.id} req={r} onUpdate={load} />)
        )}
      </div>

      {showNew && (
        <NewRequestModal
          onSave={() => { setShowNew(false); load() }}
          onClose={() => setShowNew(false)}
        />
      )}
    </div>
  )
}
