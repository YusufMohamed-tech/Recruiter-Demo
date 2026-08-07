'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Search, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RequisitionForm } from './RequisitionForm'

type Requisition = {
  id: string
  ref_number: string
  title_en: string
  title_ar?: string
  headcount: number
  employment_type: string
  status: string
  budget_approved: boolean
  target_hire_date?: string
  created_at: string
  submitted_at?: string
  department?: { name_en: string }
  establishment?: { name_en: string }
  creator?: { name_en: string }
}

const STATUS_TABS = [
  { value: '',                 label: 'All'              },
  { value: 'draft',            label: 'Draft'            },
  { value: 'pending_approval', label: 'Pending Approval' },
  { value: 'approved',         label: 'Approved'         },
  { value: 'rejected',         label: 'Rejected'         },
  { value: 'changes_requested',label: 'Changes Needed'   },
]

const STATUS_BADGE: Record<string, string> = {
  draft:             'bg-muted text-muted-foreground',
  pending_approval:  'bg-status-info/15 text-status-info',
  approved:          'bg-brand-green/20 text-brand-dark',
  rejected:          'bg-status-error/15 text-status-error',
  changes_requested: 'bg-status-warning/15 text-status-warning',
  cancelled:         'bg-muted text-muted-foreground',
}

const EMP_TYPE_LABEL: Record<string, string> = {
  full_time: 'Full-time', part_time: 'Part-time', contract: 'Contract', internship: 'Internship',
}

export function RequisitionsClient() {
  const router = useRouter()
  const [items, setItems]       = useState<Requisition[]>([])
  const [total, setTotal]       = useState(0)
  const [loading, setLoading]   = useState(true)
  const [statusTab, setStatusTab] = useState('')
  const [search, setSearch]     = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => { load() }, [statusTab])

  async function load() {
    setLoading(true)
    const url = `/api/v1/requisitions?limit=50${statusTab ? `&status=${statusTab}` : ''}`
    const res = await fetch(url)
    if (res.ok) {
      setItems(await res.json())
      setTotal(parseInt(res.headers.get('X-Total-Count') ?? '0'))
    }
    setLoading(false)
  }

  const filtered = search
    ? items.filter(r =>
        r.title_en.toLowerCase().includes(search.toLowerCase()) ||
        r.ref_number.toLowerCase().includes(search.toLowerCase()) ||
        r.department?.name_en.toLowerCase().includes(search.toLowerCase())
      )
    : items

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search requisitions…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="ps-9"
          />
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="me-1.5 h-4 w-4" /> New Requisition
        </Button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-lg border bg-muted p-1 w-fit">
        {STATUS_TABS.map(t => (
          <button
            key={t.value}
            onClick={() => setStatusTab(t.value)}
            className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              statusTab === t.value ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm text-muted-foreground">No requisitions found</p>
          <Button variant="outline" className="mt-4" onClick={() => setCreating(true)}>
            <Plus className="me-1.5 h-4 w-4" /> Create your first requisition
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">Ref</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Department</th>
                <th className="px-4 py-3 font-medium">Headcount</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Target Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(r => (
                <tr
                  key={r.id}
                  className="hover:bg-muted/30 cursor-pointer"
                  onClick={() => router.push(`/requisitions/${r.id}`)}
                >
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{r.ref_number}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{r.title_en}</p>
                    {r.title_ar && <p className="text-xs text-muted-foreground" dir="rtl">{r.title_ar}</p>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{r.department?.name_en ?? '—'}</td>
                  <td className="px-4 py-3 text-center">{r.headcount}</td>
                  <td className="px-4 py-3 text-muted-foreground">{EMP_TYPE_LABEL[r.employment_type] ?? r.employment_type}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_BADGE[r.status] ?? 'bg-muted text-muted-foreground'}`}>
                      {r.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {r.target_hire_date ? new Date(r.target_hire_date).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {creating && (
        <RequisitionForm
          onClose={() => setCreating(false)}
          onSaved={() => { setCreating(false); load() }}
        />
      )}
    </div>
  )
}
