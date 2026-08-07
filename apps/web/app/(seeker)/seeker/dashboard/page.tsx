'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FileText, Clock, CheckCircle, XCircle, Briefcase } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

interface DashboardData {
  profile: any
  applications: any[]
  stats: { total: number; under_review: number; shortlisted: number; rejected: number }
}

export default function SeekerDashboardPage() {
  const supabase = createClient()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('seeker_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      const { data: applications } = await supabase
        .from('seeker_applications')
        .select('*, job_postings(title_en, slug, org_id, organizations(legal_name_en))')
        .eq('seeker_id', profile?.id)
        .order('created_at', { ascending: false })
        .limit(5)

      const { count: total } = await supabase
        .from('seeker_applications')
        .select('*', { count: 'exact', head: true })
        .eq('seeker_id', profile?.id)

      const { count: under_review } = await supabase
        .from('seeker_applications')
        .select('*', { count: 'exact', head: true })
        .eq('seeker_id', profile?.id)
        .eq('status', 'under_review')

      const { count: shortlisted } = await supabase
        .from('seeker_applications')
        .select('*', { count: 'exact', head: true })
        .eq('seeker_id', profile?.id)
        .eq('status', 'shortlisted')

      const { count: rejected } = await supabase
        .from('seeker_applications')
        .select('*', { count: 'exact', head: true })
        .eq('seeker_id', profile?.id)
        .eq('status', 'rejected')

      setData({
        profile,
        applications: applications || [],
        stats: {
          total: total || 0,
          under_review: under_review || 0,
          shortlisted: shortlisted || 0,
          rejected: rejected || 0,
        },
      })
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return <div className="animate-pulse space-y-4"><div className="h-32 bg-gray-200 rounded-lg" /><div className="h-64 bg-gray-200 rounded-lg" /></div>
  }

  if (!data?.profile) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">Complete your profile</h2>
        <p className="text-muted-foreground mb-4">Set up your profile to start applying for jobs</p>
        <Link href="/seeker/onboarding"><Button>Get Started</Button></Link>
      </div>
    )
  }

  const { profile, applications, stats } = data

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {profile.first_name_en}</h1>
        <p className="text-muted-foreground">Here&apos;s your job search overview</p>
      </div>

      {profile.profile_completion_pct < 100 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="font-medium text-yellow-800">Profile {profile.profile_completion_pct}% complete</p>
            <p className="text-sm text-yellow-600">Complete your profile to increase visibility to employers</p>
          </div>
          <Link href="/seeker/profile"><Button size="sm" variant="outline">Complete</Button></Link>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={FileText} label="Total Applied" value={stats.total} />
        <StatCard icon={Clock} label="Under Review" value={stats.under_review} color="text-yellow-600" />
        <StatCard icon={CheckCircle} label="Shortlisted" value={stats.shortlisted} color="text-green-600" />
        <StatCard icon={XCircle} label="Not Selected" value={stats.rejected} color="text-gray-400" />
      </div>

      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Recent Applications</h2>
          <Link href="/seeker/applications" className="text-sm text-primary hover:underline">View all</Link>
        </div>
        {applications.length === 0 ? (
          <div className="text-center py-8">
            <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-muted-foreground">No applications yet</p>
            <Link href="/jobs"><Button className="mt-3" size="sm">Browse Jobs</Button></Link>
          </div>
        ) : (
          <div className="space-y-3">
            {applications.map((app: any) => (
              <Link key={app.id} href={`/seeker/applications/${app.id}`} className="flex items-center justify-between p-3 rounded-md hover:bg-gray-50 border">
                <div>
                  <p className="font-medium text-sm">{app.job_postings?.title_en}</p>
                  <p className="text-xs text-muted-foreground">{app.job_postings?.organizations?.legal_name_en}</p>
                </div>
                <StatusBadge status={app.status} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color = 'text-foreground' }: { icon: any; label: string; value: number; color?: string }) {
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
    withdrawn: 'bg-gray-100 text-gray-500',
  }
  const labels: Record<string, string> = {
    submitted: 'Submitted',
    under_review: 'Under Review',
    shortlisted: 'Shortlisted',
    interview: 'Interview',
    offered: 'Offered',
    hired: 'Hired',
    rejected: 'Not Selected',
    withdrawn: 'Withdrawn',
  }
  return (
    <span className={`text-xs font-medium px-2 py-1 rounded-full ${styles[status] || 'bg-gray-100'}`}>
      {labels[status] || status}
    </span>
  )
}
