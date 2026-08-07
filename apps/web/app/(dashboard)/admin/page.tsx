'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Users, FileText, Gift, Shield, Calendar, TrendingUp, BarChart2, Building2 } from 'lucide-react'

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

function KpiCard({
  label, value, icon: Icon, color, href,
}: { label: string; value: number | string; icon: React.ElementType; color: string; href: string }) {
  return (
    <Link href={href}>
      <div className="group rounded-card border bg-white p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className={`mt-1 font-heading text-3xl font-semibold ${color}`}>{value}</p>
          </div>
          <div className="p-2 rounded-lg bg-gray-50 group-hover:bg-gray-100 transition-colors">
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function DashboardPage() {
  const [kpis, setKpis]     = useState<KPIs | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/v1/analytics/kpis')
      .then(r => r.json())
      .then(d => { setKpis(d); setLoading(false) })
  }, [])

  const v = (key: keyof KPIs) => loading ? '—' : (kpis?.[key] ?? 0)

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Welcome back to Chessboard Recruitment</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Open Requisitions"    value={v('open_requisitions')}    icon={FileText}   color="text-blue-600"   href="/requisitions" />
        <KpiCard label="Active Applications"  value={v('active_applications')}  icon={Users}      color="text-purple-600" href="/applications" />
        <KpiCard label="Pending Offers"       value={v('pending_offers')}       icon={Gift}       color="text-orange-500" href="/offers" />
        <KpiCard label="Hired This Month"     value={v('hired_this_month')}     icon={TrendingUp} color="text-[rgb(var(--brand-green))]" href="/applications" />
        <KpiCard label="Total Candidates"     value={v('total_candidates')}     icon={Users}      color="text-gray-600"   href="/candidates" />
        <KpiCard label="Scheduled Interviews" value={v('scheduled_interviews')} icon={Calendar}   color="text-indigo-600" href="/interviews" />
        <KpiCard label="Readiness Cases"      value={v('readiness_cases')}      icon={Shield}     color="text-teal-600"   href="/readiness" />
        <KpiCard label="Gov. Cases Open"      value={v('open_privacy_requests')} icon={Building2} color="text-red-500"    href="/government-cases" />
      </div>

      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing live counts across your pipeline.
        </p>
        <Link href="/analytics" className="flex items-center gap-1.5 text-sm text-[rgb(var(--brand-green))] font-medium hover:underline">
          <BarChart2 className="h-4 w-4" /> Full Analytics
        </Link>
      </div>
    </div>
  )
}
