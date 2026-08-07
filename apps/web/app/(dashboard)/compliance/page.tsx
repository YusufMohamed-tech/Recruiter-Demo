import { Suspense } from 'react'
import Link from 'next/link'
import { createServerSupabase } from '@/lib/supabase/server'
import { ComplianceBadge, type ComplianceResult } from '@/components/compliance/ComplianceBadge'
import { AlertTriangle, CheckCircle2, XCircle, Clock, ShieldAlert } from 'lucide-react'
import { redirect } from 'next/navigation'

async function getStats() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('org_id').eq('id', user.id).single()
  const orgId = profile?.org_id
  const today = new Date().toISOString().split('T')[0]

  const [
    { data: rules },
    { data: recentEvals },
    { data: pendingOverrides },
    { data: staleRules },
  ] = await Promise.all([
    supabase.from('compliance_rules').select('id, status, review_due_at, code, name_en, name_ar, result_if_fail').eq('org_id', orgId),
    supabase.from('compliance_evaluations')
      .select('id, overall_result, evaluated_at, resource_type, resource_id')
      .eq('org_id', orgId)
      .order('evaluated_at', { ascending: false })
      .limit(10),
    supabase.from('compliance_overrides')
      .select(`
        id, justification, created_at,
        rule:compliance_rules(code, name_en),
        requester:users!requested_by(name_en)
      `)
      .eq('org_id', orgId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('compliance_rules')
      .select('id, code, name_en, name_ar, review_due_at, result_if_fail')
      .eq('org_id', orgId)
      .eq('status', 'active')
      .lt('review_due_at', today)
      .order('review_due_at', { ascending: true })
      .limit(5),
  ])

  const active = rules?.filter(r => r.status === 'active').length ?? 0
  const staleCount = staleRules?.length ?? 0
  const evals50 = recentEvals ?? []
  const blocked = evals50.filter(e => e.overall_result === 'BLOCKED').length
  const blockRate = evals50.length ? Math.round((blocked / evals50.length) * 100) : 0
  const pendingCount = pendingOverrides?.length ?? 0

  return { rules: rules ?? [], active, staleCount, blockRate, recentEvals: evals50, pendingOverrides: pendingOverrides ?? [], staleRules: staleRules ?? [], pendingCount }
}

export default async function ComplianceDashboard() {
  const stats = await getStats()

  const kpis = [
    {
      label: 'Active Rules',
      value: stats.active,
      icon: CheckCircle2,
      iconCls: 'text-brand-green',
      href: '/compliance/rules',
    },
    {
      label: 'Stale Rules',
      value: stats.staleCount,
      icon: Clock,
      iconCls: stats.staleCount > 0 ? 'text-status-warning' : 'text-muted-foreground',
      href: '/compliance/rules?stale=1',
    },
    {
      label: 'Block Rate (recent)',
      value: `${stats.blockRate}%`,
      icon: XCircle,
      iconCls: stats.blockRate > 20 ? 'text-status-error' : 'text-muted-foreground',
      href: undefined,
    },
    {
      label: 'Pending Overrides',
      value: stats.pendingCount,
      icon: AlertTriangle,
      iconCls: stats.pendingCount > 0 ? 'text-status-warning' : 'text-muted-foreground',
      href: '/compliance/overrides',
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Compliance</h1>
        <p className="mt-1 text-sm text-muted-foreground">Monitor rules, evaluations, and override requests</p>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map(k => (
          <div key={k.label} className="rounded-lg border bg-card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{k.label}</p>
                <p className="mt-1 font-heading text-3xl font-bold">{k.value}</p>
              </div>
              <k.icon className={`h-5 w-5 ${k.iconCls}`} />
            </div>
            {k.href && (
              <Link href={k.href} className="mt-3 block text-xs text-brand-green hover:underline">
                View →
              </Link>
            )}
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Stale rules queue */}
        <div className="rounded-lg border bg-card">
          <div className="flex items-center justify-between border-b px-5 py-3">
            <h2 className="font-medium">Stale Rules</h2>
            <Link href="/compliance/rules?stale=1" className="text-xs text-brand-green hover:underline">View all</Link>
          </div>
          {stats.staleRules.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted-foreground">No stale rules — all up to date</p>
          ) : (
            <ul className="divide-y">
              {stats.staleRules.map(r => (
                <li key={r.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium">{r.name_en}</p>
                    <p className="text-xs text-muted-foreground">Review due: {r.review_due_at}</p>
                  </div>
                  <ComplianceBadge result={r.result_if_fail as ComplianceResult} size="sm" />
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Pending overrides */}
        <div className="rounded-lg border bg-card">
          <div className="flex items-center justify-between border-b px-5 py-3">
            <h2 className="font-medium">Pending Overrides</h2>
            <Link href="/compliance/overrides" className="text-xs text-brand-green hover:underline">View all</Link>
          </div>
          {stats.pendingOverrides.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted-foreground">No pending override requests</p>
          ) : (
            <ul className="divide-y">
              {stats.pendingOverrides.map((o: any) => (
                <li key={o.id} className="px-5 py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{o.rule?.name_en ?? '—'}</p>
                    <span className="rounded-full bg-status-warning/15 px-2 py-0.5 text-xs font-medium text-status-warning">Pending</span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{o.justification}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">by {o.requester?.name_en ?? '—'}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Recent evaluations */}
      <div className="rounded-lg border bg-card">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h2 className="font-medium">Recent Evaluations</h2>
        </div>
        {stats.recentEvals.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">No evaluations yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="px-5 py-2 font-medium">Resource Type</th>
                  <th className="px-5 py-2 font-medium">Resource ID</th>
                  <th className="px-5 py-2 font-medium">Result</th>
                  <th className="px-5 py-2 font-medium">Evaluated</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {stats.recentEvals.map((e: any) => (
                  <tr key={e.id} className="hover:bg-muted/30">
                    <td className="px-5 py-3 capitalize">{e.resource_type}</td>
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{e.resource_id.slice(0, 8)}…</td>
                    <td className="px-5 py-3">
                      <ComplianceBadge result={e.overall_result as ComplianceResult} size="sm" />
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {new Date(e.evaluated_at).toLocaleDateString()}
                    </td>
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
