'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, ClipboardList, ChevronDown, ChevronUp } from 'lucide-react'

type AuditEvent = {
  id: string
  actor_type: string
  actor_id: string | null
  action: string
  resource_type: string
  resource_id: string | null
  old_values: Record<string, unknown> | null
  new_values: Record<string, unknown> | null
  ip_address: string | null
  created_at: string
  actor: { id: string; name_en: string } | null
}

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-green-100 text-green-800',
  update: 'bg-blue-100 text-blue-800',
  delete: 'bg-red-100 text-red-700',
  login:  'bg-gray-100 text-gray-700',
  export: 'bg-purple-100 text-purple-800',
}

function DiffView({ oldVal, newVal }: { oldVal: Record<string, unknown> | null; newVal: Record<string, unknown> | null }) {
  if (!oldVal && !newVal) return null
  const allKeys = new Set([...Object.keys(oldVal ?? {}), ...Object.keys(newVal ?? {})])
  const changed = [...allKeys].filter(k => JSON.stringify((oldVal ?? {})[k]) !== JSON.stringify((newVal ?? {})[k]))
  if (changed.length === 0) return <p className="text-xs text-gray-400">No field changes recorded</p>
  return (
    <table className="w-full text-xs mt-1">
      <thead>
        <tr className="text-gray-400">
          <th className="text-left pb-1 font-medium w-1/4">Field</th>
          <th className="text-left pb-1 font-medium">Before</th>
          <th className="text-left pb-1 font-medium">After</th>
        </tr>
      </thead>
      <tbody>
        {changed.map(k => (
          <tr key={k} className="border-t border-gray-100">
            <td className="py-1 font-mono text-gray-500">{k}</td>
            <td className="py-1 text-red-500 font-mono truncate max-w-[160px]">
              {(oldVal ?? {})[k] !== undefined ? JSON.stringify((oldVal ?? {})[k]) : '—'}
            </td>
            <td className="py-1 text-green-600 font-mono truncate max-w-[160px]">
              {(newVal ?? {})[k] !== undefined ? JSON.stringify((newVal ?? {})[k]) : '—'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function EventRow({ event }: { event: AuditEvent }) {
  const [expanded, setExpanded] = useState(false)
  const hasDetail = event.old_values || event.new_values
  return (
    <div className="border-b last:border-0">
      <div
        className={`flex items-start gap-4 px-6 py-3 ${hasDetail ? 'cursor-pointer hover:bg-gray-50' : ''}`}
        onClick={() => hasDetail && setExpanded(e => !e)}
      >
        <div className="flex-shrink-0 pt-0.5">
          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${ACTION_COLORS[event.action] ?? 'bg-gray-100 text-gray-700'}`}>
            {event.action}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-800">
            <span className="font-medium">{event.actor?.name_en ?? event.actor_id ?? 'System'}</span>
            {' '}<span className="text-gray-500">{event.action}d</span>{' '}
            <span className="font-medium capitalize">{event.resource_type.replace('_', ' ')}</span>
            {event.resource_id && <span className="text-gray-400 text-xs ml-1 font-mono">{event.resource_id.slice(0, 8)}…</span>}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{new Date(event.created_at).toLocaleString()}{event.ip_address ? ` · ${event.ip_address}` : ''}</p>
        </div>
        {hasDetail && (
          <div className="flex-shrink-0">
            {expanded ? <ChevronUp className="h-4 w-4 text-gray-300" /> : <ChevronDown className="h-4 w-4 text-gray-300" />}
          </div>
        )}
      </div>
      {expanded && hasDetail && (
        <div className="px-6 pb-3">
          <DiffView oldVal={event.old_values} newVal={event.new_values} />
        </div>
      )}
    </div>
  )
}

export function AuditLogClient() {
  const [events, setEvents]     = useState<AuditEvent[]>([])
  const [loading, setLoading]   = useState(true)
  const [total, setTotal]       = useState(0)
  const [search, setSearch]     = useState('')
  const [resourceType, setResourceType] = useState('')
  const [action, setAction]     = useState('')
  const [page, setPage]         = useState(1)

  const LIMIT = 50

  function load(p = 1) {
    setLoading(true)
    const params = new URLSearchParams({ page: String(p), limit: String(LIMIT) })
    if (resourceType) params.set('resource_type', resourceType)
    if (action)       params.set('action', action)

    fetch(`/api/v1/audit?${params}`)
      .then(r => { setTotal(parseInt(r.headers.get('X-Total-Count') ?? '0')); return r.json() })
      .then(d => { setEvents(d); setLoading(false) })
  }

  useEffect(() => { load(page) }, [page, resourceType, action])

  const filtered = events.filter(e => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      e.action.toLowerCase().includes(q) ||
      e.resource_type.toLowerCase().includes(q) ||
      (e.actor?.name_en?.toLowerCase().includes(q) ?? false) ||
      (e.resource_id?.toLowerCase().includes(q) ?? false)
    )
  })

  return (
    <div className="flex flex-col h-full">
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-[rgb(var(--brand-green))]" />
              Audit Log
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">{total} events recorded</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              className="pl-8 h-9 w-64"
              placeholder="Search events..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="h-9 border rounded-md px-2 text-sm"
            value={resourceType}
            onChange={e => { setResourceType(e.target.value); setPage(1) }}
          >
            <option value="">All resource types</option>
            {['job_requisition','job_posting','candidate','job_application','offer','user','role','approval_request'].map(t => (
              <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
            ))}
          </select>
          <select
            className="h-9 border rounded-md px-2 text-sm"
            value={action}
            onChange={e => { setAction(e.target.value); setPage(1) }}
          >
            <option value="">All actions</option>
            {['create','update','delete','login','export','approve','reject'].map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-gray-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400">
            <ClipboardList className="h-8 w-8 mb-2 opacity-40" />
            <p className="text-sm">No audit events found</p>
          </div>
        ) : (
          <div>
            {filtered.map(e => <EventRow key={e.id} event={e} />)}
          </div>
        )}
      </div>

      {total > LIMIT && (
        <div className="border-t px-6 py-3 flex items-center justify-between">
          <span className="text-sm text-gray-500">Page {page} of {Math.ceil(total / LIMIT)}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= Math.ceil(total / LIMIT)} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  )
}
