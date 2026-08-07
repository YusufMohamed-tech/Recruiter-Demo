'use client'

import { useEffect, useState } from 'react'
import {
  Users, FileText, Gift, Shield, Calendar,
  BarChart2, TrendingUp, Clock, RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

// ── Types ─────────────────────────────────────────────────────────────────────

type KPIs = {
  open_requisitions:     number
  active_applications:   number
  pending_offers:        number
  readiness_cases:       number
  scheduled_interviews:  number
  total_candidates:      number
  hired_this_month:      number
  open_privacy_requests: number
}

type FunnelAggregate = {
  total_applications: number
  stage_applied:      number
  stage_screening:    number
  stage_interview:    number
  stage_assessment:   number
  stage_offer:        number
  stage_hired:        number
  total_rejected:     number
  avg_days_in_pipeline: number
}

type SourceRow = {
  channel_name:    string
  channel_type:    string
  applications:    number
  hires:           number
  conversion_rate: number
}

type TTFRow = {
  department_id:   string | null
  employment_type: string
  median_days:     number
  p75_days:        number
  sample_size:     number
}

// ── Small chart helpers (pure CSS/SVG, no library needed) ─────────────────────

function BarH({ value, max, color = 'bg-[rgb(var(--brand-green))]' }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500 w-8 text-right">{value}</span>
    </div>
  )
}

function FunnelBar({ label, value, max, pct }: { label: string; value: number; max: number; pct: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-28 text-right truncate">{label}</span>
      <div className="flex-1 relative h-7 bg-gray-100 rounded overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full bg-[rgb(var(--brand-green)/0.7)] rounded transition-all"
          style={{ width: `${max > 0 ? (value / max) * 100 : 0}%` }}
        />
        <span className="absolute right-2 top-0 h-full flex items-center text-xs font-medium text-gray-700">
          {value} <span className="ml-1 text-gray-400">({pct}%)</span>
        </span>
      </div>
    </div>
  )
}

// ── KPI Tile ──────────────────────────────────────────────────────────────────

function KpiTile({
  label, value, icon: Icon, color, sub,
}: { label: string; value: number | string; icon: React.ElementType; color: string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className={`mt-1 text-3xl font-bold ${color}`}>{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`p-2 rounded-lg bg-gray-50`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function AnalyticsClient() {
  const [kpis, setKpis]     = useState<KPIs | null>(null)
  const [funnel, setFunnel] = useState<FunnelAggregate | null>(null)
  const [sources, setSources] = useState<SourceRow[]>([])
  const [ttf, setTtf]       = useState<TTFRow[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const [kRes, fRes, sRes, tRes] = await Promise.all([
      fetch('/api/v1/analytics/kpis').then(r => r.json()),
      fetch('/api/v1/analytics/funnel').then(r => r.json()),
      fetch('/api/v1/analytics/sources').then(r => r.json()),
      fetch('/api/v1/analytics/time-to-fill').then(r => r.json()),
    ])
    setKpis(kRes)
    setFunnel(fRes.aggregate ?? null)
    setSources(Array.isArray(sRes) ? sRes : [])
    setTtf(Array.isArray(tRes) ? tRes : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const funnelStages = funnel ? [
    { label: 'Applied',    value: funnel.stage_applied },
    { label: 'Screening',  value: funnel.stage_screening },
    { label: 'Interview',  value: funnel.stage_interview },
    { label: 'Assessment', value: funnel.stage_assessment },
    { label: 'Offer',      value: funnel.stage_offer },
    { label: 'Hired',      value: funnel.stage_hired },
  ] : []
  const funnelMax = funnelStages[0]?.value ?? 1
  const convRate = funnel && funnel.total_applications > 0
    ? ((funnel.stage_hired / funnel.total_applications) * 100).toFixed(1)
    : '0.0'

  const maxApps = Math.max(...sources.map(s => s.applications), 1)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-[rgb(var(--brand-green))]" />
            Analytics
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Live metrics across the recruitment pipeline</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-1.5">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* KPI tiles */}
      <section>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Key Metrics</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiTile label="Open Requisitions"    value={kpis?.open_requisitions ?? '—'}     icon={FileText}  color="text-blue-600"   sub="Approved, unfilled" />
          <KpiTile label="Active Applications"  value={kpis?.active_applications ?? '—'}   icon={Users}     color="text-purple-600" sub="Not hired or rejected" />
          <KpiTile label="Pending Offers"       value={kpis?.pending_offers ?? '—'}         icon={Gift}      color="text-orange-500" sub="Draft + approval + sent" />
          <KpiTile label="Hired This Month"     value={kpis?.hired_this_month ?? '—'}       icon={TrendingUp} color="text-[rgb(var(--brand-green))]" />
          <KpiTile label="Total Candidates"     value={kpis?.total_candidates ?? '—'}      icon={Users}     color="text-gray-600" />
          <KpiTile label="Scheduled Interviews" value={kpis?.scheduled_interviews ?? '—'}  icon={Calendar}  color="text-indigo-600" />
          <KpiTile label="Readiness Cases"      value={kpis?.readiness_cases ?? '—'}       icon={Shield}    color="text-teal-600"   sub="Open + in progress" />
          <KpiTile label="Privacy Requests"     value={kpis?.open_privacy_requests ?? '—'} icon={Shield}    color="text-red-500"    sub="Open requests" />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Funnel */}
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Pipeline Funnel</h2>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400">Conversion:</span>
              <span className="font-semibold text-[rgb(var(--brand-green))]">{convRate}%</span>
            </div>
          </div>
          {loading ? (
            <div className="h-40 flex items-center justify-center text-gray-300">Loading...</div>
          ) : funnelStages.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-gray-300 text-sm">No pipeline data yet</div>
          ) : (
            <div className="space-y-2">
              {funnelStages.map(s => (
                <FunnelBar
                  key={s.label}
                  label={s.label}
                  value={s.value}
                  max={funnelMax}
                  pct={funnelMax > 0 ? Math.round((s.value / funnelMax) * 100) : 0}
                />
              ))}
            </div>
          )}
          {funnel && (
            <div className="mt-4 pt-4 border-t flex gap-6 text-sm text-gray-500">
              <span>Total: <strong className="text-gray-800">{funnel.total_applications}</strong></span>
              <span>Rejected: <strong className="text-red-500">{funnel.total_rejected}</strong></span>
              <span>Avg days: <strong className="text-gray-800">{Number(funnel.avg_days_in_pipeline ?? 0).toFixed(1)}</strong></span>
            </div>
          )}
        </div>

        {/* Source Analytics */}
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-4">Source Analytics</h2>
          {loading ? (
            <div className="h-40 flex items-center justify-center text-gray-300">Loading...</div>
          ) : sources.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-gray-300 text-sm">No source data yet</div>
          ) : (
            <div className="space-y-3">
              {sources.map(s => (
                <div key={s.channel_name ?? 'unknown'}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{s.channel_name ?? 'Unknown'}</span>
                    <span className="text-xs text-gray-400">{s.conversion_rate ?? 0}% hire rate</span>
                  </div>
                  <BarH value={s.applications} max={maxApps} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Time to Fill */}
      <div className="bg-white rounded-xl border p-5 shadow-sm">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Clock className="h-4 w-4 text-gray-400" /> Time to Fill
        </h2>
        {loading ? (
          <div className="h-20 flex items-center justify-center text-gray-300">Loading...</div>
        ) : ttf.length === 0 ? (
          <div className="h-20 flex items-center justify-center text-gray-300 text-sm">
            No closed jobs with date data yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 font-medium text-gray-500">Employment Type</th>
                  <th className="pb-2 font-medium text-gray-500 text-right">Median Days</th>
                  <th className="pb-2 font-medium text-gray-500 text-right">P75 Days</th>
                  <th className="pb-2 font-medium text-gray-500 text-right">Sample</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {ttf.map((r, i) => (
                  <tr key={i}>
                    <td className="py-2 text-gray-700 capitalize">{r.employment_type?.replace('_', ' ') ?? '—'}</td>
                    <td className="py-2 text-right font-semibold text-gray-800">{Number(r.median_days).toFixed(1)}</td>
                    <td className="py-2 text-right text-gray-500">{Number(r.p75_days).toFixed(1)}</td>
                    <td className="py-2 text-right text-gray-400">{r.sample_size}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
