'use client'

import { useEffect, useState } from 'react'
import { Plus, Search, Globe, Eye, EyeOff, Pencil, Trash2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { JobForm } from './JobForm'

type Job = {
  id: string
  slug: string
  title_en: string
  title_ar?: string
  city?: string
  employment_type: string
  status: string
  deadline?: string
  published_at?: string
  department?: { name_en: string }
}

const STATUS_TABS = [
  { value: '',          label: 'All'       },
  { value: 'draft',     label: 'Draft'     },
  { value: 'published', label: 'Published' },
  { value: 'closed',    label: 'Closed'    },
]

const STATUS_BADGE: Record<string, string> = {
  draft:     'bg-muted text-muted-foreground',
  published: 'bg-brand-green/20 text-brand-dark',
  closed:    'bg-status-error/15 text-status-error',
}

const EMP_LABEL: Record<string, string> = {
  full_time: 'Full-time', part_time: 'Part-time', contract: 'Contract', internship: 'Internship',
}

export function JobsClient() {
  const [jobs, setJobs]         = useState<Job[]>([])
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState('')
  const [search, setSearch]     = useState('')
  const [editing, setEditing]   = useState<string | 'new' | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => { load() }, [tab])

  async function load() {
    setLoading(true)
    const qs = tab ? `&status=${tab}` : ''
    const res = await fetch(`/api/v1/jobs?limit=50${qs}`)
    if (res.ok) setJobs(await res.json())
    setLoading(false)
  }

  async function setStatus(id: string, action: 'publish' | 'close' | 'unpublish') {
    await fetch(`/api/v1/jobs/${id}/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    load()
  }

  async function remove(id: string) {
    await fetch(`/api/v1/jobs/${id}`, { method: 'DELETE' })
    setDeleting(null)
    load()
  }

  const filtered = search
    ? jobs.filter(j =>
        j.title_en.toLowerCase().includes(search.toLowerCase()) ||
        j.department?.name_en?.toLowerCase().includes(search.toLowerCase())
      )
    : jobs

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search jobs…" value={search} onChange={e => setSearch(e.target.value)} className="ps-9" />
        </div>
        <Button onClick={() => setEditing('new')}><Plus className="me-1.5 h-4 w-4" />New Job</Button>
      </div>

      <div className="flex gap-1 rounded-lg border bg-muted p-1 w-fit">
        {STATUS_TABS.map(t => (
          <button key={t.value} onClick={() => setTab(t.value)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === t.value ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}>{t.label}</button>
        ))}
      </div>

      {loading ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm text-muted-foreground">No jobs found</p>
          <Button variant="outline" className="mt-4" onClick={() => setEditing('new')}>
            <Plus className="me-1.5 h-4 w-4" />Create first job posting
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Department</th>
                <th className="px-4 py-3 font-medium">City</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Deadline</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(j => (
                <tr key={j.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <p className="font-medium">{j.title_en}</p>
                    {j.title_ar && <p className="text-xs text-muted-foreground" dir="rtl">{j.title_ar}</p>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{j.department?.name_en ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{j.city ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{EMP_LABEL[j.employment_type] ?? j.employment_type}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_BADGE[j.status] ?? 'bg-muted text-muted-foreground'}`}>
                      {j.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {j.deadline ? new Date(j.deadline).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {j.status === 'draft'     && <ActionBtn icon={Globe} title="Publish" onClick={() => setStatus(j.id, 'publish')} />}
                      {j.status === 'published' && <ActionBtn icon={EyeOff} title="Close" onClick={() => setStatus(j.id, 'close')} />}
                      {j.status === 'published' && (
                        <a href={`/careers/${j.slug}`} target="_blank" rel="noopener noreferrer"
                          className="rounded p-1 hover:bg-muted" title="View public page">
                          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                        </a>
                      )}
                      <ActionBtn icon={Pencil} title="Edit" onClick={() => setEditing(j.id)} />
                      {j.status !== 'published' && <ActionBtn icon={Trash2} title="Delete" onClick={() => setDeleting(j.id)} />}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <JobForm
          id={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load() }}
        />
      )}

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="rounded-xl border bg-card p-6 shadow-xl max-w-sm w-full mx-4">
            <p className="font-medium">Delete job posting?</p>
            <p className="mt-1 text-sm text-muted-foreground">This action cannot be undone.</p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setDeleting(null)}>Cancel</Button>
              <Button variant="destructive" size="sm" onClick={() => remove(deleting)}>Delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ActionBtn({ icon: Icon, title, onClick }: { icon: React.ElementType; title: string; onClick: () => void }) {
  return (
    <button onClick={onClick} title={title} className="rounded p-1 hover:bg-muted">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
    </button>
  )
}
