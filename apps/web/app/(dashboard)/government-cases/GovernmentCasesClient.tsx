'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Building2, ChevronRight, AlertTriangle, CheckCircle2 } from 'lucide-react'

const STATUS_TABS = [
  { key: '', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
]

const PLATFORM_TABS = [
  { key: '', label: 'All Platforms' },
  { key: 'qiwa', label: 'Qiwa' },
  { key: 'moi', label: 'MOI' },
  { key: 'gosi', label: 'GOSI' },
  { key: 'hrsd', label: 'HRSD' },
]

const STATUS_COLORS: Record<string, string> = {
  pending:     'bg-gray-100 text-gray-700',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed:   'bg-green-100 text-green-800',
  cancelled:   'bg-red-100 text-red-700',
}

const PLATFORM_COLORS: Record<string, string> = {
  qiwa: 'bg-blue-100 text-blue-800',
  moi:  'bg-purple-100 text-purple-800',
  gosi: 'bg-orange-100 text-orange-800',
  hrsd: 'bg-teal-100 text-teal-800',
}

export function GovernmentCasesClient() {
  const [cases, setCases]     = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus]   = useState('')
  const [platform, setPlatform] = useState('')
  const [total, setTotal]     = useState(0)

  useEffect(() => {
    setLoading(true)
    const p = new URLSearchParams({ limit: '50' })
    if (status)   p.set('status', status)
    if (platform) p.set('platform', platform)

    fetch(`/api/v1/government-cases?${p}`)
      .then(r => {
        setTotal(parseInt(r.headers.get('X-Total-Count') ?? '0'))
        return r.json()
      })
      .then(d => { setCases(d); setLoading(false) })
  }, [status, platform])

  async function updateStatus(id: string, newStatus: string) {
    await fetch(`/api/v1/government-cases/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    setCases(cs => cs.map(c => c.id === id ? { ...c, status: newStatus } : c))
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[rgb(var(--brand-green))]" />
              Government Cases
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">{total} cases total</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="flex gap-1 border rounded-lg p-1 bg-gray-50">
            {STATUS_TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setStatus(t.key)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  status === t.key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex gap-1 border rounded-lg p-1 bg-gray-50">
            {PLATFORM_TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setPlatform(t.key)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  platform === t.key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-gray-400">Loading...</div>
        ) : cases.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400">
            <Building2 className="h-8 w-8 mb-2 opacity-40" />
            <p className="text-sm">No government cases found</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Candidate</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Case Type</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Platform</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Reference</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Qiwa Contract</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Submitted</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {cases.map(c => {
                const candidate = c.employment_readiness_cases?.candidates
                const qiwa = c.qiwa_contract_cases?.[0]
                const hasUnresolved = qiwa?.contract_discrepancies?.some((d: any) => !d.resolved)

                return (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3">
                      <p className="font-medium text-gray-900">{candidate?.name_en ?? '—'}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{c.case_type}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium uppercase ${PLATFORM_COLORS[c.platform] ?? 'bg-gray-100 text-gray-700'}`}>
                        {c.platform}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                      {c.reference_number ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        className={`text-xs border rounded px-1.5 py-0.5 font-medium ${STATUS_COLORS[c.status] ?? 'bg-gray-100 text-gray-700'}`}
                        value={c.status}
                        onChange={e => updateStatus(c.id, e.target.value)}
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      {qiwa ? (
                        <div className="flex items-center gap-1.5">
                          {hasUnresolved
                            ? <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                            : <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                          }
                          <span className="text-xs">{qiwa.contract_status}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {c.submitted_at ? c.submitted_at.split('T')[0] : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {c.employment_readiness_cases?.id && (
                        <Link href={`/readiness/${c.employment_readiness_cases.id}`}>
                          <Button variant="ghost" size="sm" className="gap-1">
                            Case <ChevronRight className="h-3 w-3" />
                          </Button>
                        </Link>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
