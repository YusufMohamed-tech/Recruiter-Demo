'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Search, MapPin, Clock, Bookmark, BookmarkCheck } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

const SAUDI_CITIES = [
  'All Cities', 'Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam',
  'Khobar', 'Dhahran', 'Tabuk', 'Abha', 'Taif', 'NEOM',
]

const EMPLOYMENT_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'remote', label: 'Remote' },
]

export default function SeekerJobsPage() {
  const supabase = createClient()
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [city, setCity] = useState('')
  const [type, setType] = useState('')
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set())
  const [seekerId, setSeekerId] = useState<string | null>(null)

  useEffect(() => {
    loadJobs()
    loadSavedJobs()
  }, [])

  async function loadSavedJobs() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: profile } = await supabase.from('seeker_profiles').select('id').eq('user_id', user.id).single()
    if (!profile) return
    setSeekerId(profile.id)
    const { data } = await supabase.from('seeker_saved_jobs').select('job_posting_id').eq('seeker_id', profile.id)
    if (data) setSavedJobIds(new Set(data.map(d => d.job_posting_id)))
  }

  async function loadJobs() {
    setLoading(true)
    let query = supabase
      .from('job_postings')
      .select('id, title_en, slug, city, employment_type, salary_visible, salary_min, salary_max, created_at, org_id, organizations(legal_name_en)')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(50)

    if (city && city !== 'All Cities') query = query.eq('city', city)
    if (type) query = query.eq('employment_type', type)
    if (search) query = query.or(`title_en.ilike.%${search}%,summary_en.ilike.%${search}%`)

    const { data } = await query
    setJobs(data || [])
    setLoading(false)
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    loadJobs()
  }

  async function toggleSave(jobId: string) {
    if (!seekerId) return
    if (savedJobIds.has(jobId)) {
      await supabase.from('seeker_saved_jobs').delete().eq('seeker_id', seekerId).eq('job_posting_id', jobId)
      setSavedJobIds(prev => { const n = new Set(prev); n.delete(jobId); return n })
    } else {
      await supabase.from('seeker_saved_jobs').insert({ seeker_id: seekerId, job_posting_id: jobId })
      setSavedJobIds(prev => new Set(prev).add(jobId))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Find Jobs</h1>
        <p className="text-muted-foreground">Discover opportunities across Saudi Arabia</p>
      </div>

      <form onSubmit={handleSearch} className="bg-white border rounded-lg p-4 flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Job title, company, or keyword..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="border rounded-md px-3 py-2 text-sm" value={city} onChange={e => setCity(e.target.value)}>
          {SAUDI_CITIES.map(c => <option key={c} value={c === 'All Cities' ? '' : c}>{c}</option>)}
        </select>
        <select className="border rounded-md px-3 py-2 text-sm" value={type} onChange={e => setType(e.target.value)}>
          {EMPLOYMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <Button type="submit">Search</Button>
      </form>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-200 rounded-lg animate-pulse" />)}
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-12 bg-white border rounded-lg">
          <p className="text-muted-foreground">No jobs found matching your criteria</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map(job => (
            <div key={job.id} className="bg-white border rounded-lg p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between">
                <Link href={`/jobs/${job.slug}`} className="flex-1">
                  <h2 className="font-semibold text-lg hover:text-brand-primary transition-colors">{job.title_en}</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">{(job as any).organizations?.legal_name_en}</p>
                  <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                    {job.city && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{job.city}</span>}
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{job.employment_type?.replace('_', ' ')}</span>
                    {job.salary_visible && job.salary_min && (
                      <span>{Number(job.salary_min).toLocaleString()} - {Number(job.salary_max).toLocaleString()} SAR</span>
                    )}
                  </div>
                </Link>
                <button onClick={() => toggleSave(job.id)} className="p-2 hover:bg-gray-100 rounded-md">
                  {savedJobIds.has(job.id) ? (
                    <BookmarkCheck className="h-5 w-5 text-brand-primary" />
                  ) : (
                    <Bookmark className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Posted {new Date(job.created_at).toLocaleDateString()}
                </span>
                <Link href={`/jobs/${job.slug}`}>
                  <Button size="sm">View & Apply</Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
