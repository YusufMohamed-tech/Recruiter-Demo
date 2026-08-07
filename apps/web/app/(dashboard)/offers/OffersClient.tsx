'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CreateOfferDialog } from './CreateOfferDialog'

type Offer = {
  id: string
  status: string
  current_version: number
  expires_at?: string
  accepted_at?: string
  declined_at?: string
  withdrawn_at?: string
  created_at: string
  candidates?: { id: string; name_en: string; email: string }
  job_applications?: { id: string; job_postings?: { id: string; title_en: string } }
  creator?: { id: string; name_en: string }
}

const STATUS_TABS = ['all','draft','pending_approval','sent','accepted','declined','withdrawn'] as const
type StatusTab = typeof STATUS_TABS[number]

const STATUS_COLORS: Record<string, string> = {
  draft:            'bg-muted text-muted-foreground border-border',
  pending_approval: 'bg-yellow-500/15 text-yellow-700 border-yellow-200',
  sent:             'bg-blue-500/15 text-blue-700 border-blue-200',
  accepted:         'bg-green-500/15 text-green-700 border-green-200',
  declined:         'bg-status-error/10 text-status-error border-status-error/20',
  withdrawn:        'bg-muted text-muted-foreground border-border',
}

function isExpired(expiresAt?: string) {
  return expiresAt && new Date(expiresAt) < new Date()
}

function daysUntilExpiry(expiresAt?: string): number | null {
  if (!expiresAt) return null
  const diff = new Date(expiresAt).getTime() - Date.now()
  return Math.ceil(diff / 86400000)
}

export function OffersClient() {
  const router = useRouter()
  const [offers, setOffers]     = useState<Offer[]>([])
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState<StatusTab>('all')
  const [showCreate, setShowCreate] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ limit: '50' })
    if (tab !== 'all') params.set('status', tab)
    const res  = await fetch(`/api/v1/offers?${params}`)
    const data = await res.json()
    setOffers(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [tab])

  useEffect(() => { void load() }, [load])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div />
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="me-1.5 h-4 w-4" />New Offer
        </Button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 border-b overflow-x-auto">
        {STATUS_TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`shrink-0 px-3 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              tab === t ? 'border-brand-green text-brand-dark' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.replace(/_/g,' ')}
          </button>
        ))}
      </div>

      {loading && <div className="py-12 text-center text-sm text-muted-foreground">Loading…</div>}

      {!loading && offers.length === 0 && (
        <div className="py-12 text-center text-sm text-muted-foreground">No offers found.</div>
      )}

      {!loading && offers.length > 0 && (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="py-2.5 px-4 text-start font-medium text-muted-foreground">Candidate</th>
                <th className="py-2.5 px-4 text-start font-medium text-muted-foreground hidden md:table-cell">Job</th>
                <th className="py-2.5 px-4 text-start font-medium text-muted-foreground">Status</th>
                <th className="py-2.5 px-4 text-start font-medium text-muted-foreground hidden lg:table-cell">Expiry</th>
                <th className="py-2.5 px-4 text-start font-medium text-muted-foreground hidden xl:table-cell">Created</th>
              </tr>
            </thead>
            <tbody>
              {offers.map(o => {
                const days    = daysUntilExpiry(o.expires_at)
                const expired = isExpired(o.expires_at)
                return (
                  <tr
                    key={o.id}
                    onClick={() => router.push(`/offers/${o.id}`)}
                    className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                  >
                    <td className="py-3 px-4">
                      <p className="font-medium">{o.candidates?.name_en}</p>
                      <p className="text-xs text-muted-foreground">{o.candidates?.email}</p>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell text-muted-foreground">
                      {o.job_applications?.job_postings?.title_en ?? '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[o.status] ?? 'bg-muted'}`}>
                        {o.status.replace(/_/g,' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell text-xs">
                      {o.expires_at
                        ? expired
                          ? <span className="text-status-error font-medium">Expired</span>
                          : days != null && days <= 3
                            ? <span className="text-status-warning font-medium">{days}d left</span>
                            : <span className="text-muted-foreground">{new Date(o.expires_at).toLocaleDateString()}</span>
                        : <span className="text-muted-foreground">—</span>
                      }
                    </td>
                    <td className="py-3 px-4 hidden xl:table-cell text-xs text-muted-foreground">
                      {new Date(o.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <CreateOfferDialog
          onClose={() => setShowCreate(false)}
          onCreated={(id) => { setShowCreate(false); router.push(`/offers/${id}`) }}
        />
      )}
    </div>
  )
}
