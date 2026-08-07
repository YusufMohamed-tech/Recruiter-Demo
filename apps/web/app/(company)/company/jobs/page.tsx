'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

export default function CompanyJobsPage() {
  const supabase = createClient()
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: userRow } = await supabase.from('users').select('org_id').eq('id', user.id).single()
      if (!userRow) return

      const { data } = await supabase
        .from('job_postings')
        .select('*, seeker_applications(count)')
        .eq('org_id', userRow.org_id)
        .order('created_at', { ascending: false })

      setJobs(data || [])
      setLoading(false)
    }
    load()
  }, [])

  async function toggleStatus(jobId: string, currentStatus: string) {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published'
    await supabase.from('job_postings').update({
      status: newStatus,
      published_at: newStatus === 'published' ? new Date().toISOString() : null,
    }).eq('id', jobId)
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: newStatus } : j))
  }

  if (loading) return <div className="animate-pulse h-64 bg-gray-200 rounded-lg" />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Job Postings</h1>
        <Link href="/company/jobs/new">
          <Button><Plus className="h-4 w-4 mr-2" />Post a Job</Button>
        </Link>
      </div>

      {jobs.length === 0 ? (
        <div className="text-center py-12 bg-white border rounded-lg">
          <p className="text-muted-foreground mb-4">No job postings yet</p>
          <Link href="/company/jobs/new"><Button>Create your first job posting</Button></Link>
        </div>
      ) : (
        <div className="bg-white border rounded-lg divide-y">
          {jobs.map(job => (
            <div key={job.id} className="p-4 flex items-center justify-between">
              <div>
                <Link href={`/company/jobs/${job.id}`} className="font-medium hover:text-primary">{job.title_en}</Link>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                  {job.city && <span>{job.city}</span>}
                  <span className="capitalize">{job.employment_type?.replace('_', ' ')}</span>
                  <span>{(job as any).seeker_applications?.[0]?.count || 0} applicants</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${job.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {job.status}
                </span>
                <Button variant="ghost" size="sm" onClick={() => toggleStatus(job.id, job.status)}>
                  {job.status === 'published' ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
