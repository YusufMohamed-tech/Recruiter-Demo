'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Briefcase, FileText, Users, Clock, TrendingUp, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

export default function CompanyDashboardPage() {
  const supabase = createClient()
  const [stats, setStats] = useState({ jobs: 0, applications: 0, pending: 0, team: 0 })
  const [recentApps, setRecentApps] = useState<any[]>([])
  const [orgName, setOrgName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: userRow } = await supabase.from('users').select('org_id').eq('id', user.id).single()
      if (!userRow) return

      const orgId = userRow.org_id

      const { data: org } = await supabase.from('organizations').select('legal_name_en').eq('id', orgId).single()
      setOrgName(org?.legal_name_en || '')

      const [jobsRes, appsRes, pendingRes, teamRes] = await Promise.all([
        supabase.from('job_postings').select('*', { count: 'exact', head: true }).eq('org_id', orgId).eq('status', 'published'),
        supabase.from('seeker_applications').select('*', { count: 'exact', head: true }).eq('org_id', orgId),
        supabase.from('seeker_applications').select('*', { count: 'exact', head: true }).eq('org_id', orgId).eq('status', 'submitted'),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('org_id', orgId),
      ])

      setStats({
        jobs: jobsRes.count || 0,
        applications: appsRes.count || 0,
        pending: pendingRes.count || 0,
        team: teamRes.count || 0,
      })

      const { data: recent } = await supabase
        .from('seeker_applications')
        .select('id, status, submitted_at, seeker_profiles(first_name_en, last_name_en), job_postings(title_en)')
        .eq('org_id', orgId)
        .order('submitted_at', { ascending: false })
        .limit(5)

      setRecentApps(recent || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-32 bg-gray-200 rounded-lg" /><div className="h-64 bg-gray-200 rounded-lg" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">{orgName}</p>
        </div>
        <Link href="/company/jobs/new">
          <Button><Plus className="h-4 w-4 mr-2" />Post a Job</Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Briefcase} label="Active Jobs" value={stats.jobs} color="text-blue-600" />
        <StatCard icon={FileText} label="Total Applications" value={stats.applications} color="text-green-600" />
        <StatCard icon={Clock} label="Pending Review" value={stats.pending} color="text-yellow-600" />
        <StatCard icon={Users} label="Team Members" value={stats.team} color="text-purple-600" />
      </div>

      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Recent Applications</h2>
          <Link href="/company/applications" className="text-sm text-primary hover:underline">View all</Link>
        </div>
        {recentApps.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-muted-foreground">No applications yet</p>
            <p className="text-sm text-muted-foreground">Post a job to start receiving applications</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentApps.map(app => (
              <Link key={app.id} href={`/company/applications/${app.id}`} className="flex items-center justify-between p-3 rounded-md hover:bg-gray-50 border">
                <div>
                  <p className="font-medium text-sm">
                    {(app as any).seeker_profiles?.first_name_en} {(app as any).seeker_profiles?.last_name_en}
                  </p>
                  <p className="text-xs text-muted-foreground">{(app as any).job_postings?.title_en}</p>
                </div>
                <div className="text-right">
                  <StatusBadge status={app.status} />
                  <p className="text-xs text-muted-foreground mt-1">{new Date(app.submitted_at).toLocaleDateString()}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-lg border p-4">
      <Icon className={`h-5 w-5 mb-2 ${color}`} />
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    submitted: 'bg-blue-100 text-blue-700',
    under_review: 'bg-yellow-100 text-yellow-700',
    shortlisted: 'bg-green-100 text-green-700',
    interview: 'bg-purple-100 text-purple-700',
    offered: 'bg-amber-100 text-amber-700',
    hired: 'bg-green-100 text-green-800',
    rejected: 'bg-gray-100 text-gray-600',
  }
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[status] || 'bg-gray-100'}`}>
      {status.replace('_', ' ')}
    </span>
  )
}
