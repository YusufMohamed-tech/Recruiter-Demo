'use client'

import { useEffect, useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Application = {
  id: string
  candidates?: { name_en: string }
  job_postings?: { title_en: string }
}

type User = { id: string; name_en: string; email: string }

type Props = {
  applicationId?: string
  onClose: () => void
  onCreated: () => void
}

export function ScheduleInterviewDialog({ applicationId, onClose, onCreated }: Props) {
  const [applications, setApplications] = useState<Application[]>([])
  const [users, setUsers]               = useState<User[]>([])
  const [saving, setSaving]             = useState(false)
  const [error, setError]               = useState('')

  const [appId, setAppId]               = useState(applicationId ?? '')
  const [title, setTitle]               = useState('Interview')
  const [type, setType]                 = useState('hr')
  const [format, setFormat]             = useState('video')
  const [scheduledAt, setScheduledAt]   = useState('')
  const [durationMins, setDuration]     = useState(60)
  const [location, setLocation]         = useState('')
  const [notes, setNotes]               = useState('')
  const [interviewerIds, setInterviewerIds] = useState<string[]>([])

  useEffect(() => {
    if (!applicationId) {
      fetch('/api/v1/applications?limit=100&status=active')
        .then(r => r.json())
        .then(d => setApplications(Array.isArray(d) ? d : []))
    }
    fetch('/api/v1/admin/users')
      .then(r => r.json())
      .then(d => setUsers(Array.isArray(d) ? d : []))
  }, [applicationId])

  function toggleInterviewer(id: string) {
    setInterviewerIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  async function submit() {
    if (!appId) { setError('Select an application'); return }
    setSaving(true); setError('')
    const res = await fetch('/api/v1/interviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        application_id:  appId,
        title,
        interview_type:  type,
        format,
        scheduled_at:    scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
        duration_mins:   durationMins,
        location:        location || undefined,
        notes:           notes || undefined,
        interviewer_ids: interviewerIds,
      }),
    })
    setSaving(false)
    if (res.ok) {
      onCreated()
    } else {
      const d = await res.json()
      setError(d?.error?.message ?? d?.error ?? 'Failed to schedule')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl border bg-card shadow-xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-heading text-lg font-semibold">Schedule Interview</h2>
          <button onClick={onClose} className="rounded p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Application selection */}
          {!applicationId && (
            <div className="space-y-1">
              <Label>Application *</Label>
              <select
                value={appId}
                onChange={e => setAppId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Select application…</option>
                {applications.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.candidates?.name_en} — {a.job_postings?.title_en}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1">
            <Label>Title *</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Interview title" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Type</Label>
              <select
                value={type}
                onChange={e => setType(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="hr">HR</option>
                <option value="technical">Technical</option>
                <option value="panel">Panel</option>
                <option value="final">Final</option>
                <option value="assessment">Assessment</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label>Format</Label>
              <select
                value={format}
                onChange={e => setFormat(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="video">Video</option>
                <option value="in_person">In Person</option>
                <option value="phone">Phone</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Date & Time</Label>
              <Input
                type="datetime-local"
                value={scheduledAt}
                onChange={e => setScheduledAt(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Duration (min)</Label>
              <Input
                type="number"
                min={15}
                max={480}
                step={15}
                value={durationMins}
                onChange={e => setDuration(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Location / Meeting URL</Label>
            <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="https://meet.google.com/… or Room 3A" />
          </div>

          {users.length > 0 && (
            <div className="space-y-2">
              <Label>Interviewers</Label>
              <div className="max-h-40 overflow-y-auto rounded-lg border divide-y">
                {users.map(u => (
                  <label key={u.id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/40 text-sm">
                    <input
                      type="checkbox"
                      checked={interviewerIds.includes(u.id)}
                      onChange={() => toggleInterviewer(u.id)}
                      className="rounded"
                    />
                    <span>{u.name_en}</span>
                    <span className="text-xs text-muted-foreground">{u.email}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1">
            <Label>Notes</Label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Preparation notes, agenda, focus areas…"
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          {error && <p className="text-sm text-status-error">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 p-5 border-t">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>
            {saving && <Loader2 className="me-1.5 h-4 w-4 animate-spin" />}
            Schedule
          </Button>
        </div>
      </div>
    </div>
  )
}
