'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function SeekerApplicationsPage() {
  const supabase = createClient()
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('seeker_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!profile) { setLoading(false); return }

      const { data } = await supabase
        .from('seeker_applications')
        .select(`
          *,
          job_postings(title_en, slug, city, employment_type,
            organizations(legal_name_en, logo_url)
          )
        `)
        .eq('seeker_id', profile.id)
        .order('created_at', { ascending: false })

      setApplications(data || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-16 bg-gray-200 rounded-lg" /><div className="h-16 bg-gray-200 rounded-lg" /><div className="h-16 bg-gray-200 rounded-lg" /></div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Applications</h1>

      {applications.length === 0 ? (
        <div className="text-center py-12 bg-white border rounded-lg">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-muted-foreground mb-2">You haven&apos;t applied to any jobs yet</p>
          <Link href="/jobs" className="text-primary hover:underline text-sm">Browse jobs</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map(app => (
            <Link
              key={app.id}
              href={`/seeker/applications/${app.id}`}
              className="flex items-center justify-between p-4 bg-white border rounded-lg hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                  {app.job_postings?.organizations?.legal_name_en?.charAt(0) || '?'}
                </div>
                <div>
                  <p className="font-medium">{app.job_postings?.title_en}</p>
                  <p className="text-sm text-muted-foreground">
                    {app.job_postings?.organizations?.legal_name_en}
                    {app.job_postings?.city && ` • ${app.job_postings.city}`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <StatusBadge status={app.status} />
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(app.submitted_at).toLocaleDateString()}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
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
