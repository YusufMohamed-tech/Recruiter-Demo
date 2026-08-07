'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bookmark, MapPin, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

export default function SavedJobsPage() {
  const supabase = createClient()
  const [savedJobs, setSavedJobs] = useState<any[]>([])
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
        .from('seeker_saved_jobs')
        .select(`
          *,
          job_postings(id, title_en, slug, city, employment_type, salary_visible, salary_min, salary_max, created_at,
            organizations(legal_name_en, logo_url)
          )
        `)
        .eq('seeker_id', profile.id)
        .order('saved_at', { ascending: false })

      setSavedJobs(data || [])
      setLoading(false)
    }
    load()
  }, [])

  async function handleRemove(savedId: string) {
    await supabase.from('seeker_saved_jobs').delete().eq('id', savedId)
    setSavedJobs(prev => prev.filter(s => s.id !== savedId))
  }

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-20 bg-gray-200 rounded-lg" /><div className="h-20 bg-gray-200 rounded-lg" /></div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Saved Jobs</h1>

      {savedJobs.length === 0 ? (
        <div className="text-center py-12 bg-white border rounded-lg">
          <Bookmark className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-muted-foreground mb-2">No saved jobs yet</p>
          <Link href="/jobs" className="text-primary hover:underline text-sm">Browse jobs</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {savedJobs.map(saved => (
            <div key={saved.id} className="flex items-center justify-between p-4 bg-white border rounded-lg">
              <Link href={`/jobs/${saved.job_postings?.slug}`} className="flex items-center gap-3 flex-1">
                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                  {saved.job_postings?.organizations?.legal_name_en?.charAt(0) || '?'}
                </div>
                <div>
                  <p className="font-medium">{saved.job_postings?.title_en}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{saved.job_postings?.organizations?.legal_name_en}</span>
                    {saved.job_postings?.city && (
                      <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{saved.job_postings.city}</span>
                    )}
                    <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{saved.job_postings?.employment_type?.replace('_', ' ')}</span>
                  </div>
                </div>
              </Link>
              <Button variant="ghost" size="sm" onClick={() => handleRemove(saved.id)}>
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
