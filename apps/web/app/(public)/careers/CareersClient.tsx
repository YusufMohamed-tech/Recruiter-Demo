'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, MapPin, Briefcase, Clock, ChevronRight } from 'lucide-react'

type Job = {
  id: string
  slug: string
  title_en: string; title_ar?: string
  summary_en?: string; summary_ar?: string
  city?: string; employment_type: string
  deadline?: string; published_at: string
  salary_visible: boolean; salary_min?: number; salary_max?: number
  department?: { id: string; name_en: string; name_ar: string }
}

type Dept = { id: string; name_en: string; name_ar: string }

const EMP_LABEL: Record<string, string> = {
  full_time: 'Full-time', part_time: 'Part-time', contract: 'Contract', internship: 'Internship',
}

const CITIES = ['Riyadh', 'Jeddah', 'Dammam', 'Khobar', 'Mecca', 'Medina']

function timeSince(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (d === 0) return 'Today'
  if (d === 1) return '1 day ago'
  if (d < 7)  return `${d} days ago`
  if (d < 30) return `${Math.floor(d / 7)} weeks ago`
  return `${Math.floor(d / 30)} months ago`
}

export function CareersClient({ initialJobs, departments }: { initialJobs: Job[]; departments: Dept[] }) {
  const [q, setQ]         = useState('')
  const [city, setCity]   = useState('')
  const [dept, setDept]   = useState('')
  const [type, setType]   = useState('')

  const filtered = useMemo(() => {
    return initialJobs.filter(j => {
      if (q    && !j.title_en.toLowerCase().includes(q.toLowerCase()) &&
                  !j.title_ar?.includes(q) &&
                  !j.summary_en?.toLowerCase().includes(q.toLowerCase())) return false
      if (city && j.city !== city) return false
      if (dept && j.department?.id !== dept) return false
      if (type && j.employment_type !== type) return false
      return true
    })
  }, [initialJobs, q, city, dept, type])

  const hasFilters = q || city || dept || type

  return (
    <div>
      {/* Hero */}
      <div className="bg-brand-dark text-white py-16 px-4">
        <div className="mx-auto max-w-content text-center">
          <h1 className="font-heading text-4xl font-bold sm:text-5xl">Find Your Next Opportunity</h1>
          <p className="mt-4 text-lg text-white/70">Join Chessboard Group and build your career in Saudi Arabia</p>
          {/* Search bar */}
          <div className="mx-auto mt-8 flex max-w-xl rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm overflow-hidden">
            <Search className="ms-4 self-center h-5 w-5 text-white/60 shrink-0" />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search job titles…"
              className="flex-1 bg-transparent px-3 py-3.5 text-sm text-white placeholder:text-white/50 outline-none"
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-content px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Sidebar filters */}
          <aside className="w-full lg:w-56 shrink-0 space-y-5">
            <FilterGroup label="Department">
              <select value={dept} onChange={e => setDept(e.target.value)}
                className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
                <option value="">All departments</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name_en}</option>)}
              </select>
            </FilterGroup>
            <FilterGroup label="City">
              <select value={city} onChange={e => setCity(e.target.value)}
                className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
                <option value="">All cities</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </FilterGroup>
            <FilterGroup label="Employment Type">
              <select value={type} onChange={e => setType(e.target.value)}
                className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
                <option value="">All types</option>
                {Object.entries(EMP_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </FilterGroup>
            {hasFilters && (
              <button
                onClick={() => { setQ(''); setCity(''); setDept(''); setType('') }}
                className="text-xs text-brand-green hover:underline"
              >
                Clear all filters
              </button>
            )}
          </aside>

          {/* Job list */}
          <div className="flex-1 min-w-0">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {filtered.length} {filtered.length === 1 ? 'position' : 'positions'} found
              </p>
            </div>

            {filtered.length === 0 ? (
              <div className="py-20 text-center rounded-xl border border-dashed">
                <p className="text-muted-foreground">No positions match your search.</p>
                {hasFilters && (
                  <button onClick={() => { setQ(''); setCity(''); setDept(''); setType('') }}
                    className="mt-3 text-sm text-brand-green hover:underline">
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map(job => <JobCard key={job.id} job={job} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function JobCard({ job }: { job: Job }) {
  const isDeadlineSoon = job.deadline
    ? (new Date(job.deadline).getTime() - Date.now()) < 7 * 86400000
    : false

  return (
    <Link
      href={`/careers/${job.slug}`}
      className="group block rounded-xl border bg-card p-5 transition-all hover:border-brand-green hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="font-heading font-semibold text-lg leading-snug group-hover:text-brand-dark">
            {job.title_en}
          </h2>
          {job.title_ar && (
            <p className="mt-0.5 text-sm text-muted-foreground font-arabic" dir="rtl">{job.title_ar}</p>
          )}
          {job.summary_en && (
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{job.summary_en}</p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
            {job.department && (
              <span className="flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5" />{job.department.name_en}
              </span>
            )}
            {job.city && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />{job.city}
              </span>
            )}
            <span className="rounded-full bg-muted px-2 py-0.5 font-medium">
              {EMP_LABEL[job.employment_type] ?? job.employment_type}
            </span>
            {job.salary_visible && job.salary_min && (
              <span className="font-medium text-brand-dark">
                {job.salary_min.toLocaleString()} – {job.salary_max?.toLocaleString() ?? '?'} SAR
              </span>
            )}
          </div>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-2">
          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-brand-green transition-colors" />
          <div className="text-right space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
              <Clock className="h-3 w-3" />{timeSince(job.published_at)}
            </p>
            {job.deadline && (
              <p className={`text-xs font-medium ${isDeadlineSoon ? 'text-status-warning' : 'text-muted-foreground'}`}>
                Closes {new Date(job.deadline).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}
