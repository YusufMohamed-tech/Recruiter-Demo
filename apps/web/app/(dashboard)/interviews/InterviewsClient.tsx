'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Calendar, Video, MapPin, Phone, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScheduleInterviewDialog } from './ScheduleInterviewDialog'

type Interviewer = { user_id: string; users: { id: string; name_en: string; email: string } }

type Interview = {
  id: string
  title: string
  interview_type: string
  scheduled_at?: string
  duration_mins: number
  location?: string
  format: string
  status: string
  notes?: string
  organizer?: { id: string; name_en: string }
  interview_interviewers?: Interviewer[]
  job_applications?: {
    id: string
    candidates?: { id: string; name_en: string; email: string }
    job_postings?: { id: string; title_en: string }
  }
}

const TYPE_LABELS: Record<string, string> = {
  hr: 'HR', technical: 'Technical', panel: 'Panel', final: 'Final', assessment: 'Assessment',
}

const STATUS_COLORS: Record<string, string> = {
  scheduled:  'bg-blue-500/15 text-blue-700 border-blue-200',
  completed:  'bg-green-500/15 text-green-700 border-green-200',
  cancelled:  'bg-muted text-muted-foreground border-border',
  no_show:    'bg-status-error/10 text-status-error border-status-error/20',
}

const FORMAT_ICON: Record<string, React.ReactNode> = {
  video:      <Video className="h-3.5 w-3.5" />,
  in_person:  <MapPin className="h-3.5 w-3.5" />,
  phone:      <Phone className="h-3.5 w-3.5" />,
}

const STATUS_TABS = ['all','scheduled','completed','cancelled'] as const
type StatusTab = typeof STATUS_TABS[number]

export function InterviewsClient() {
  const router = useRouter()
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [loading, setLoading]       = useState(true)
  const [activeTab, setActiveTab]   = useState<StatusTab>('all')
  const [mine, setMine]             = useState(false)
  const [showCreate, setShowCreate] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (mine)                    params.set('mine', '1')
    if (activeTab !== 'all')     params.set('status', activeTab)
    const res  = await fetch(`/api/v1/interviews?${params}`)
    const data = await res.json()
    setInterviews(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [mine, activeTab])

  useEffect(() => { void load() }, [load])

  const filtered = interviews

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <input type="checkbox" checked={mine} onChange={e => setMine(e.target.checked)} className="rounded" />
            My interviews
          </label>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="me-1.5 h-4 w-4" />Schedule Interview
        </Button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 border-b">
        {STATUS_TABS.map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              activeTab === t ? 'border-brand-green text-brand-dark' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading && <div className="py-12 text-center text-sm text-muted-foreground">Loading…</div>}

      {!loading && filtered.length === 0 && (
        <div className="py-12 text-center text-sm text-muted-foreground">No interviews found.</div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map(iv => (
            <div
              key={iv.id}
              onClick={() => router.push(`/interviews/${iv.id}`)}
              className="rounded-xl border bg-card p-4 cursor-pointer hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start gap-4">
                {/* Date column */}
                <div className="flex flex-col items-center justify-center rounded-lg bg-muted/60 px-3 py-2 text-center shrink-0 min-w-[56px]">
                  {iv.scheduled_at ? (
                    <>
                      <span className="text-xs text-muted-foreground font-medium">
                        {new Date(iv.scheduled_at).toLocaleString('en', { month: 'short' }).toUpperCase()}
                      </span>
                      <span className="text-xl font-bold leading-none">
                        {new Date(iv.scheduled_at).getDate()}
                      </span>
                    </>
                  ) : (
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center flex-wrap gap-2 mb-1">
                    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[iv.status] ?? 'bg-muted text-muted-foreground'}`}>
                      {iv.status.replace('_',' ')}
                    </span>
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                      {TYPE_LABELS[iv.interview_type] ?? iv.interview_type}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      {FORMAT_ICON[iv.format]} {iv.format.replace('_',' ')}
                    </span>
                  </div>

                  <p className="font-medium">{iv.title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {iv.job_applications?.candidates?.name_en}
                    {iv.job_applications?.job_postings?.title_en && ` · ${iv.job_applications.job_postings.title_en}`}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    {iv.scheduled_at && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(iv.scheduled_at).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
                        {' · '}{iv.duration_mins} min
                      </span>
                    )}
                    {iv.location && (
                      <span className="flex items-center gap-1">
                        {FORMAT_ICON[iv.format]} {iv.location}
                      </span>
                    )}
                    {iv.interview_interviewers && iv.interview_interviewers.length > 0 && (
                      <span>
                        Interviewers: {iv.interview_interviewers.map(i => i.users?.name_en).filter(Boolean).join(', ')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <ScheduleInterviewDialog
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); void load() }}
        />
      )}
    </div>
  )
}
