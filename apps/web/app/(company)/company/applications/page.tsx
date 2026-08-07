'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

const STATUSES = ['all', 'submitted', 'under_review', 'shortlisted', 'interview', 'offered', 'hired', 'rejected']

export default function CompanyApplicationsPage() {
  const supabase = createClient()
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => { load() }, [filter])

  async function load() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: userRow } = await supabase.from('users').select('org_id').eq('id', user.id).single()
    if (!userRow) return

    let query = supabase
      .from('seeker_applications')
      .select('*, seeker_profiles(first_name_en, last_name_en, headline, city), job_postings(title_en)')
      .eq('org_id', userRow.org_id)
      .order('submitted_at', { ascending: false })

    if (filter !== 'all') query = query.eq('status', filter)

    const { data } = await query
    setApplications(data || [])
    setLoading(false)
  }

  async function updateStatus(appId: string, newStatus: string) {
    const updates: any = { status: newStatus, updated_at: new Date().toISOString() }
    if (newStatus === 'under_review') updates.reviewed_at = new Date().toISOString()
    if (newStatus === 'shortlisted') updates.shortlisted_at = new Date().toISOString()
    if (newStatus === 'rejected') updates.rejected_at = new Date().toISOString()

    await supabase.from('seeker_applications').update(updates).eq('id', appId)
    setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a))
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Applications</h1>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 text-xs rounded-full border ${filter === s ? 'bg-brand-primary text-white border-brand-primary' : 'bg-white text-muted-foreground hover:bg-gray-50'}`}
          >
            {s === 'all' ? 'All' : s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-200 rounded-lg animate-pulse" />)}</div>
      ) : applications.length === 0 ? (
        <div className="text-center py-12 bg-white border rounded-lg">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-muted-foreground">No applications {filter !== 'all' ? `with status "${filter.replace('_', ' ')}"` : 'yet'}</p>
        </div>
      ) : (
        <div className="bg-white border rounded-lg divide-y">
          {applications.map(app => (
            <div key={app.id} className="p-4 flex items-center justify-between">
              <Link href={`/company/applications/${app.id}`} className="flex-1">
                <p className="font-medium">
                  {(app as any).seeker_profiles?.first_name_en} {(app as any).seeker_profiles?.last_name_en}
                </p>
                <p className="text-sm text-muted-foreground">
                  {(app as any).job_postings?.title_en}
                  {(app as any).seeker_profiles?.city && ` • ${(app as any).seeker_profiles.city}`}
                </p>
              </Link>
              <div className="flex items-center gap-2">
                <StatusBadge status={app.status} />
                {app.status === 'submitted' && (
                  <Button size="sm" variant="outline" onClick={() => updateStatus(app.id, 'under_review')}>Review</Button>
                )}
                {app.status === 'under_review' && (
                  <Button size="sm" onClick={() => updateStatus(app.id, 'shortlisted')}>Shortlist</Button>
                )}
              </div>
            </div>
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
  }
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${styles[status] || 'bg-gray-100'}`}>
      {status.replace('_', ' ')}
    </span>
  )
}
