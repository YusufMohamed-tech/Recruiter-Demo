'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, AlertCircle, User } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

type Candidate = {
  id: string
  name_en: string
  name_ar?: string
  email: string
  phone?: string
  current_title?: string
  current_city?: string
  nationality?: string
  education_level?: string
  total_experience_years?: number
  tags: string[]
  is_duplicate: boolean
  created_at: string
}

const EDU_LABELS: Record<string, string> = {
  high_school: 'High School',
  diploma:     'Diploma',
  bachelor:    "Bachelor's",
  master:      "Master's",
  phd:         'PhD',
}

export function CandidatesClient() {
  const router = useRouter()
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [total, setTotal]           = useState(0)
  const [loading, setLoading]       = useState(true)
  const [q, setQ]                   = useState('')
  const [dupe, setDupe]             = useState(false)
  const [page, setPage]             = useState(1)
  const limit = 25

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (q)    params.set('q', q)
    if (dupe) params.set('duplicate', '1')
    const res = await fetch(`/api/v1/candidates?${params}`)
    const data = await res.json()
    setCandidates(Array.isArray(data) ? data : [])
    setTotal(parseInt(res.headers.get('X-Total-Count') ?? '0'))
    setLoading(false)
  }, [q, dupe, page])

  useEffect(() => { void load() }, [load])

  function handleSearch(value: string) {
    setQ(value)
    setPage(1)
  }

  const pages = Math.ceil(total / limit)

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="ps-9"
          />
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            checked={dupe}
            onChange={e => { setDupe(e.target.checked); setPage(1) }}
            className="rounded"
          />
          Duplicates only
        </label>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="py-2.5 px-4 text-start font-medium text-muted-foreground">Candidate</th>
              <th className="py-2.5 px-4 text-start font-medium text-muted-foreground hidden md:table-cell">Title</th>
              <th className="py-2.5 px-4 text-start font-medium text-muted-foreground hidden lg:table-cell">Location</th>
              <th className="py-2.5 px-4 text-start font-medium text-muted-foreground hidden lg:table-cell">Education</th>
              <th className="py-2.5 px-4 text-start font-medium text-muted-foreground hidden xl:table-cell">Experience</th>
              <th className="py-2.5 px-4 text-start font-medium text-muted-foreground">Applied</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">Loading…</td></tr>
            )}
            {!loading && candidates.length === 0 && (
              <tr><td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">No candidates found.</td></tr>
            )}
            {candidates.map(c => (
              <tr
                key={c.id}
                onClick={() => router.push(`/candidates/${c.id}`)}
                className="border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-medium truncate">{c.name_en}</p>
                        {c.is_duplicate && (
                          <span title="Possible duplicate">
                            <AlertCircle className="h-3.5 w-3.5 text-status-warning shrink-0" />
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">{c.current_title ?? '—'}</td>
                <td className="py-3 px-4 text-muted-foreground hidden lg:table-cell">{c.current_city ?? '—'}</td>
                <td className="py-3 px-4 text-muted-foreground hidden lg:table-cell">{c.education_level ? EDU_LABELS[c.education_level] ?? c.education_level : '—'}</td>
                <td className="py-3 px-4 text-muted-foreground hidden xl:table-cell">{c.total_experience_years != null ? `${c.total_experience_years} yrs` : '—'}</td>
                <td className="py-3 px-4 text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{total} candidates</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <span className="text-muted-foreground">{page} / {pages}</span>
            <Button variant="outline" size="sm" disabled={page === pages} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  )
}
