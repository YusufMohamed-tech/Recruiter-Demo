'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, CheckCircle2, XCircle, Clock, Plus, X, ChevronDown, ChevronUp, FileCode } from 'lucide-react'

type CommRow = {
  id: string
  channel: string
  recipient_email: string | null
  subject: string | null
  status: string
  sent_at: string | null
  failed_at: string | null
  failure_reason: string | null
  created_at: string
  candidates: { id: string; name_en: string } | null
  job_applications: { id: string; job_postings: { title_en: string } | null } | null
}

type Template = {
  id: string
  code: string
  event_type: string
  channel: string
  subject_en: string | null
  body_en: string
  variables: string[]
  version: number
  is_active: boolean
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  sent:      <CheckCircle2 className="h-4 w-4 text-green-500" />,
  queued:    <Clock className="h-4 w-4 text-yellow-400" />,
  failed:    <XCircle className="h-4 w-4 text-red-400" />,
  delivered: <CheckCircle2 className="h-4 w-4 text-blue-500" />,
}

const EVENT_TYPE_OPTIONS = [
  'application_received', 'application_rejected', 'interview_invitation',
  'offer_sent', 'offer_accepted', 'offer_declined', 'onboarding_welcome',
  'custom',
]

function ComposeModal({ onSend, onClose }: { onSend: () => void; onClose: () => void }) {
  const [form, setForm] = useState({
    recipient_email: '',
    subject:         '',
    body:            '',
    channel:         'email',
  })
  const [sending, setSending] = useState(false)
  const [error, setError]     = useState('')

  async function send() {
    if (!form.recipient_email || !form.body) return
    setSending(true)
    setError('')
    const res = await fetch('/api/v1/communications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSending(false)
    if (!res.ok) {
      const d = await res.json()
      setError(d.error ?? 'Send failed')
    } else {
      onSend()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Compose Message</h2>
          <button onClick={onClose}><X className="h-4 w-4 text-gray-400" /></button>
        </div>

        <div className="space-y-3">
          <div>
            <Label className="text-xs">Channel</Label>
            <select
              className="w-full h-8 mt-1 border rounded-md px-2 text-sm"
              value={form.channel}
              onChange={e => setForm(f => ({ ...f, channel: e.target.value }))}
            >
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="in_app">In-app</option>
            </select>
          </div>
          <div>
            <Label className="text-xs">Recipient Email</Label>
            <Input className="mt-1 h-8" value={form.recipient_email} onChange={e => setForm(f => ({ ...f, recipient_email: e.target.value }))} />
          </div>
          <div>
            <Label className="text-xs">Subject</Label>
            <Input className="mt-1 h-8" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
          </div>
          <div>
            <Label className="text-xs">Body</Label>
            <textarea
              className="w-full mt-1 border rounded-md p-2 text-sm resize-none"
              rows={5}
              value={form.body}
              onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
            />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        <div className="flex gap-2 mt-4">
          <Button size="sm" onClick={send} disabled={sending || !form.recipient_email || !form.body}>
            {sending ? 'Sending...' : 'Send'}
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </div>
  )
}

function TemplateEditor({ template, onSave, onClose }: {
  template: Template | null
  onSave: () => void
  onClose: () => void
}) {
  const [form, setForm] = useState({
    code:       template?.code ?? '',
    event_type: template?.event_type ?? 'application_received',
    channel:    template?.channel ?? 'email',
    subject_en: template?.subject_en ?? '',
    body_en:    template?.body_en ?? '',
    variables:  template?.variables ?? [],
  })
  const [saving, setSaving] = useState(false)
  const [newVar, setNewVar] = useState('')

  async function save() {
    setSaving(true)
    await fetch('/api/v1/communication-templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    onSave()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">{template ? 'Edit Template' : 'New Template'}</h2>
          <button onClick={onClose}><X className="h-4 w-4 text-gray-400" /></button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <Label className="text-xs">Code (unique key)</Label>
            <Input className="mt-1 h-8" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} />
          </div>
          <div>
            <Label className="text-xs">Event Type</Label>
            <select
              className="w-full h-8 mt-1 border rounded-md px-2 text-sm"
              value={form.event_type}
              onChange={e => setForm(f => ({ ...f, event_type: e.target.value }))}
            >
              {EVENT_TYPE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <Label className="text-xs">Channel</Label>
            <select
              className="w-full h-8 mt-1 border rounded-md px-2 text-sm"
              value={form.channel}
              onChange={e => setForm(f => ({ ...f, channel: e.target.value }))}
            >
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="in_app">In-app</option>
            </select>
          </div>
          <div>
            <Label className="text-xs">Subject (EN)</Label>
            <Input className="mt-1 h-8" value={form.subject_en} onChange={e => setForm(f => ({ ...f, subject_en: e.target.value }))} />
          </div>
        </div>

        <div className="mb-3">
          <Label className="text-xs">Body (EN) — use {`{{variable}}`} syntax</Label>
          <textarea
            className="w-full mt-1 border rounded-md p-2 text-sm font-mono resize-none"
            rows={8}
            value={form.body_en}
            onChange={e => setForm(f => ({ ...f, body_en: e.target.value }))}
          />
        </div>

        <div className="mb-4">
          <Label className="text-xs">Variables</Label>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {form.variables.map(v => (
              <span key={v} className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                {`{{${v}}}`}
                <button onClick={() => setForm(f => ({ ...f, variables: f.variables.filter(x => x !== v) }))}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            <div className="flex items-center gap-1">
              <Input
                className="h-6 w-28 text-xs"
                placeholder="var name"
                value={newVar}
                onChange={e => setNewVar(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && newVar.trim()) {
                    setForm(f => ({ ...f, variables: [...f.variables, newVar.trim()] }))
                    setNewVar('')
                  }
                }}
              />
              <button
                className="text-xs text-[rgb(var(--brand-green))] font-medium"
                onClick={() => {
                  if (newVar.trim()) {
                    setForm(f => ({ ...f, variables: [...f.variables, newVar.trim()] }))
                    setNewVar('')
                  }
                }}
              >
                Add
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button size="sm" onClick={save} disabled={saving || !form.code || !form.body_en}>
            {saving ? 'Saving...' : 'Save Template'}
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </div>
  )
}

export function CommunicationsClient() {
  const [comms, setComms]         = useState<CommRow[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading]     = useState(true)
  const [tab, setTab]             = useState<'log' | 'templates'>('log')
  const [showCompose, setShowCompose]   = useState(false)
  const [showTemplate, setShowTemplate] = useState(false)
  const [total, setTotal]         = useState(0)

  function loadComms() {
    fetch('/api/v1/communications?limit=50')
      .then(r => { setTotal(parseInt(r.headers.get('X-Total-Count') ?? '0')); return r.json() })
      .then(d => { setComms(d); setLoading(false) })
  }

  function loadTemplates() {
    fetch('/api/v1/communication-templates').then(r => r.json()).then(setTemplates)
  }

  useEffect(() => { loadComms(); loadTemplates() }, [])

  return (
    <div className="flex flex-col h-full">
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <Mail className="h-5 w-5 text-[rgb(var(--brand-green))]" />
              Communications
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">{total} messages sent</p>
          </div>
          <div className="flex gap-2">
            {tab === 'log' && (
              <Button size="sm" className="gap-1.5" onClick={() => setShowCompose(true)}>
                <Plus className="h-3.5 w-3.5" /> Compose
              </Button>
            )}
            {tab === 'templates' && (
              <Button size="sm" className="gap-1.5" onClick={() => setShowTemplate(true)}>
                <Plus className="h-3.5 w-3.5" /> New Template
              </Button>
            )}
          </div>
        </div>

        <div className="flex gap-1 border rounded-lg p-1 bg-gray-50 w-fit">
          {(['log', 'templates'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
                tab === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'log' ? 'Message Log' : 'Templates'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {tab === 'log' && (
          loading ? (
            <div className="flex items-center justify-center h-40 text-gray-400">Loading...</div>
          ) : comms.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <Mail className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm">No messages sent yet</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Recipient</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Subject</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Candidate</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Channel</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Sent At</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {comms.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-1.5">
                        {STATUS_ICON[c.status] ?? <Clock className="h-4 w-4 text-gray-300" />}
                        <span className="text-xs capitalize text-gray-600">{c.status}</span>
                      </div>
                      {c.failure_reason && (
                        <p className="text-xs text-red-400 mt-0.5 truncate max-w-[160px]">{c.failure_reason}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{c.recipient_email ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-700 max-w-[200px] truncate">{c.subject ?? '(No subject)'}</td>
                    <td className="px-4 py-3 text-gray-600">{c.candidates?.name_en ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs uppercase bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                        {c.channel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {c.sent_at ? new Date(c.sent_at).toLocaleString() : c.created_at.split('T')[0]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}

        {tab === 'templates' && (
          <div className="p-6 space-y-3">
            {templates.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                <FileCode className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-sm">No templates yet</p>
              </div>
            ) : (
              templates.map(t => <TemplateRow key={t.id} template={t} onEdit={() => { loadTemplates() }} />)
            )}
          </div>
        )}
      </div>

      {showCompose && (
        <ComposeModal
          onSend={() => { setShowCompose(false); loadComms() }}
          onClose={() => setShowCompose(false)}
        />
      )}
      {showTemplate && (
        <TemplateEditor
          template={null}
          onSave={() => { setShowTemplate(false); loadTemplates() }}
          onClose={() => setShowTemplate(false)}
        />
      )}
    </div>
  )
}

function TemplateRow({ template, onEdit }: { template: Template; onEdit: () => void }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="border rounded-lg overflow-hidden">
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-3">
          <FileCode className="h-4 w-4 text-gray-400" />
          <div>
            <span className="font-medium text-sm text-gray-800">{template.code}</span>
            <span className="ml-2 text-xs text-gray-400">v{template.version}</span>
          </div>
          <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{template.event_type}</span>
          <span className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded uppercase">{template.channel}</span>
        </div>
        <div className="flex items-center gap-2">
          {template.variables.length > 0 && (
            <span className="text-xs text-gray-400">{template.variables.length} vars</span>
          )}
          {expanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
        </div>
      </div>
      {expanded && (
        <div className="border-t px-4 py-3 bg-gray-50">
          {template.subject_en && (
            <p className="text-xs text-gray-500 mb-1"><strong>Subject:</strong> {template.subject_en}</p>
          )}
          <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono bg-white border rounded p-2 max-h-40 overflow-y-auto">
            {template.body_en}
          </pre>
          {template.variables.length > 0 && (
            <div className="flex gap-1.5 mt-2">
              {template.variables.map(v => (
                <span key={v} className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">{`{{${v}}}`}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
