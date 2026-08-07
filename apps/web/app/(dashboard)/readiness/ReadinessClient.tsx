'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Shield, Search, ChevronRight } from 'lucide-react'

const STATUS_TABS = [
  { key: '', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'ready', label: 'Ready' },
  { key: 'joined', label: 'Joined' },
  { key: 'no_show', label: 'No Show' },
]

const BRANCH_LABELS: Record<string, string> = {
  saudi:          'Saudi',
  resident_expat: 'Resident Expat',
  new_expat:      'New Expat',
}

const BRANCH_COLORS: Record<string, string> = {
  saudi:          'bg-green-100 text-green-800',
  resident_expat: 'bg-blue-100 text-blue-800',
  new_expat:      'bg-purple-100 text-purple-800',
}

const STATUS_COLORS: Record<string, string> = {
  open:        'bg-gray-100 text-gray-700',
  in_progress: 'bg-yellow-100 text-yellow-800',
  ready:       'bg-green-100 text-green-800',
  joined:      'bg-[rgb(var(--brand-green)/0.15)] text-[rgb(var(--brand-green))]',
  no_show:     'bg-red-100 text-red-800',
}

function ScoreBadge({ score, blockers }: { score: number; blockers: unknown[] }) {
  const blocked = Array.isArray(blockers) && blockers.length > 0
  const color = blocked ? 'text-red-600' : score >= 80 ? 'text-green-600' : score >= 50 ? 'text-yellow-600' : 'text-red-600'
  return (
    <div className="flex items-center gap-1">
      <div className="w-16 h-1.5 rounded-full bg-gray-200 overflow-hidden">
        <div
          className={`h-full rounded-full ${blocked ? 'bg-red-400' : score >= 80 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-400' : 'bg-red-400'}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={`text-xs font-medium ${color}`}>{score}%</span>
      {blocked && <span className="text-xs text-red-500 font-medium">BLOCKED</span>}
    </div>
  )
}

export function ReadinessClient() {
  const [cases, setCases]       = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState('')
  const [search, setSearch]     = useState('')
  const [total, setTotal]       = useState(0)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ limit: '50' })
    if (tab) params.set('status', tab)

    fetch(`/api/v1/readiness?${params}`)
      .then(r => {
        setTotal(parseInt(r.headers.get('X-Total-Count') ?? '0'))
        return r.json()
      })
      .then(d => { setCases(d); setLoading(false) })
  }, [tab])

  const filtered = cases.filter(c => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      c.candidates?.name_en?.toLowerCase().includes(q) ||
      c.candidates?.name_ar?.toLowerCase().includes(q) ||
      c.candidates?.email?.toLowerCase().includes(q) ||
      c.job_applications?.job_postings?.title_en?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="flex flex-col h-full">
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <Shield className="h-5 w-5 text-[rgb(var(--brand-green))]" />
              Employment Readiness (SERE)
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">{total} cases total</p>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-4">
          <div className="flex gap-1 border rounded-lg p-1 bg-gray-50">
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
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              className="pl-8 h-9"
              placeholder="Search by name or role..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-gray-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400">
            <Shield className="h-8 w-8 mb-2 opacity-40" />
            <p className="text-sm">No readiness cases found</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Candidate</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Role</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Branch</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">SERE Score</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Target Join</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3">
                    <p className="font-medium text-gray-900">{c.candidates?.name_en}</p>
                    <p className="text-xs text-gray-400">{c.candidates?.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {c.job_applications?.job_postings?.title_en ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${BRANCH_COLORS[c.branch_type] ?? 'bg-gray-100 text-gray-700'}`}>
                      {BRANCH_LABELS[c.branch_type] ?? c.branch_type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <ScoreBadge score={c.readiness_score} blockers={c.mandatory_blockers ?? []} />
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium capitalize ${STATUS_COLORS[c.status] ?? 'bg-gray-100 text-gray-700'}`}>
                      {c.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {c.target_join_date ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/readiness/${c.id}`}>
                      <Button variant="ghost" size="sm" className="gap-1">
                        View <ChevronRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
