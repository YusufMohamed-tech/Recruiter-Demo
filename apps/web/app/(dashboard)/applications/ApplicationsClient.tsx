'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  DragEndEvent, DragOverlay, DragStartEvent, useDroppable,
} from '@dnd-kit/core'
import {
  SortableContext, useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { LayoutGrid, List, Star, User, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Application = {
  id: string
  current_stage: string
  status: string
  ai_match_score?: number
  created_at: string
  assigned_to?: string
  candidates?: { id: string; name_en: string; email: string; current_title?: string; total_experience_years?: number; nationality?: string }
  job_postings?: { id: string; title_en: string; slug: string }
}

const STAGES = [
  { key: 'applied',     label: 'Applied',     color: 'bg-blue-500/15 text-blue-700 border-blue-200' },
  { key: 'screening',   label: 'Screening',   color: 'bg-yellow-500/15 text-yellow-700 border-yellow-200' },
  { key: 'shortlisted', label: 'Shortlisted', color: 'bg-purple-500/15 text-purple-700 border-purple-200' },
  { key: 'interview',   label: 'Interview',   color: 'bg-orange-500/15 text-orange-700 border-orange-200' },
  { key: 'assessment',  label: 'Assessment',  color: 'bg-pink-500/15 text-pink-700 border-pink-200' },
  { key: 'offer',       label: 'Offer',       color: 'bg-brand-green/15 text-brand-dark border-brand-green/30' },
  { key: 'hired',       label: 'Hired',       color: 'bg-green-500/15 text-green-700 border-green-200' },
]

const STAGE_MAP = Object.fromEntries(STAGES.map(s => [s.key, s]))

function ScoreBadge({ score }: { score?: number }) {
  if (score == null) return null
  const color = score >= 75 ? 'text-green-700' : score >= 50 ? 'text-yellow-700' : 'text-red-600'
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${color}`}>
      <Star className="h-3 w-3" />{score.toFixed(0)}%
    </span>
  )
}

function AppCard({ app, dragging }: { app: Application; dragging?: boolean }) {
  const router = useRouter()
  return (
    <div
      onClick={() => router.push(`/applications/${app.id}`)}
      className={`rounded-lg border bg-card p-3 cursor-pointer hover:shadow-sm transition-shadow space-y-2 ${dragging ? 'opacity-50' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-sm leading-tight line-clamp-1">{app.candidates?.name_en ?? '—'}</p>
        <ScoreBadge score={app.ai_match_score} />
      </div>
      {app.candidates?.current_title && (
        <p className="text-xs text-muted-foreground line-clamp-1">{app.candidates.current_title}</p>
      )}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{app.job_postings?.title_en ?? ''}</p>
        <p className="text-xs text-muted-foreground">{new Date(app.created_at).toLocaleDateString()}</p>
      </div>
    </div>
  )
}

function SortableCard({ app }: { app: Application }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: app.id,
    data: { stage: app.current_stage },
  })
  const style = { transform: CSS.Transform.toString(transform), transition }
  return (
    <div ref={setNodeRef} style={style} className="flex items-start gap-1">
      <button
        {...attributes} {...listeners}
        className="mt-3 p-0.5 rounded hover:bg-muted cursor-grab active:cursor-grabbing"
        onClick={e => e.stopPropagation()}
      >
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
      <div className="flex-1">
        <AppCard app={app} dragging={isDragging} />
      </div>
    </div>
  )
}

function DroppableColumn({ stageKey, children }: { stageKey: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: `col:${stageKey}`, data: { stage: stageKey } })
  return (
    <div
      ref={setNodeRef}
      className={`min-h-[80px] rounded-xl border-2 p-2 space-y-2 transition-colors ${
        isOver ? 'border-brand-green bg-brand-green/5' : 'border-dashed border-muted'
      }`}
    >
      {children}
    </div>
  )
}

export function ApplicationsClient({ defaultJobId }: { defaultJobId?: string }) {
  const [apps, setApps]           = useState<Application[]>([])
  const [loading, setLoading]     = useState(true)
  const [view, setView]           = useState<'kanban' | 'list'>('kanban')
  const [jobId]                   = useState(defaultJobId ?? '')
  const [selected, setSelected]   = useState<Set<string>>(new Set())
  const [dragging, setDragging]   = useState<Application | null>(null)
  const [bulkAction, setBulkAction] = useState('')
  const [toStage, setToStage]       = useState('')
  const router = useRouter()
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ limit: '200', status: 'active' })
    if (jobId) params.set('job_id', jobId)
    const res  = await fetch(`/api/v1/applications?${params}`)
    const data = await res.json()
    setApps(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [jobId])

  useEffect(() => { void load() }, [load])

  const byStage = (stage: string) => apps.filter(a => a.current_stage === stage)

  function toggleSelect(id: string) {
    setSelected(s => {
      const next = new Set(s)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setDragging(null)
    if (!over) return
    const appId = String(active.id)
    // Resolve target stage: droppable column has `col:stage` id, item has item id
    const overId = String(over.id)
    const toStageK = overId.startsWith('col:')
      ? overId.slice(4)
      : (over.data?.current as { stage?: string } | undefined)?.stage ?? overId
    if (!STAGE_MAP[toStageK]) return
    const app = apps.find(a => a.id === appId)
    if (!app || app.current_stage === toStageK) return

    setApps(prev => prev.map(a => a.id === appId ? { ...a, current_stage: toStageK } : a))
    await fetch(`/api/v1/applications/${appId}/advance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to_stage: toStageK }),
    })
  }

  function handleDragStart(event: DragStartEvent) {
    setDragging(apps.find(a => a.id === String(event.active.id)) ?? null)
  }

  async function executeBulk() {
    if (!bulkAction || selected.size === 0) return
    const body: Record<string, unknown> = { ids: [...selected], action: bulkAction }
    if (bulkAction === 'advance') body.to_stage = toStage
    await fetch('/api/v1/applications/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setSelected(new Set())
    setBulkAction('')
    await load()
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <div className="flex items-center gap-2 rounded-lg border bg-card p-2">
              <span className="text-sm font-medium">{selected.size} selected</span>
              <select
                value={bulkAction}
                onChange={e => setBulkAction(e.target.value)}
                className="h-8 rounded border border-input bg-transparent px-2 text-sm"
              >
                <option value="">Bulk action…</option>
                <option value="advance">Advance stage</option>
                <option value="reject">Reject</option>
              </select>
              {bulkAction === 'advance' && (
                <select
                  value={toStage}
                  onChange={e => setToStage(e.target.value)}
                  className="h-8 rounded border border-input bg-transparent px-2 text-sm"
                >
                  <option value="">Stage…</option>
                  {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
              )}
              <Button size="sm" onClick={executeBulk} disabled={!bulkAction || (bulkAction === 'advance' && !toStage)}>
                Apply
              </Button>
              <Button size="sm" variant="outline" onClick={() => setSelected(new Set())}>Clear</Button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 rounded-lg border p-0.5">
          <button
            onClick={() => setView('kanban')}
            className={`rounded p-1.5 transition-colors ${view === 'kanban' ? 'bg-muted' : 'hover:bg-muted/50'}`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setView('list')}
            className={`rounded p-1.5 transition-colors ${view === 'list' ? 'bg-muted' : 'hover:bg-muted/50'}`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading && <div className="py-12 text-center text-sm text-muted-foreground">Loading…</div>}

      {/* Kanban */}
      {!loading && view === 'kanban' && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-3 overflow-x-auto pb-4">
            {STAGES.map(stage => {
              const stageApps = byStage(stage.key)
              return (
                <div key={stage.key} className="flex-none w-64">
                  <div className="mb-2 flex items-center justify-between">
                    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${stage.color}`}>
                      {stage.label}
                    </span>
                    <span className="text-xs text-muted-foreground">{stageApps.length}</span>
                  </div>
                  <SortableContext items={stageApps.map(a => a.id)} strategy={verticalListSortingStrategy}>
                    <DroppableColumn stageKey={stage.key}>
                      {stageApps.map(app => (
                        <SortableCard key={app.id} app={app} />
                      ))}
                    </DroppableColumn>
                  </SortableContext>
                </div>
              )
            })}
          </div>
          <DragOverlay>
            {dragging && <AppCard app={dragging} />}
          </DragOverlay>
        </DndContext>
      )}

      {/* List */}
      {!loading && view === 'list' && (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="py-2.5 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={selected.size === apps.length && apps.length > 0}
                    onChange={e => setSelected(e.target.checked ? new Set(apps.map(a => a.id)) : new Set())}
                    className="rounded"
                  />
                </th>
                <th className="py-2.5 px-4 text-start font-medium text-muted-foreground">Candidate</th>
                <th className="py-2.5 px-4 text-start font-medium text-muted-foreground hidden md:table-cell">Job</th>
                <th className="py-2.5 px-4 text-start font-medium text-muted-foreground">Stage</th>
                <th className="py-2.5 px-4 text-start font-medium text-muted-foreground hidden lg:table-cell">Score</th>
                <th className="py-2.5 px-4 text-start font-medium text-muted-foreground hidden xl:table-cell">Applied</th>
              </tr>
            </thead>
            <tbody>
              {apps.length === 0 && (
                <tr><td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">No applications.</td></tr>
              )}
              {apps.map(app => {
                const stage = STAGE_MAP[app.current_stage]
                return (
                  <tr
                    key={app.id}
                    className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                    onClick={() => router.push(`/applications/${app.id}`)}
                  >
                    <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected.has(app.id)}
                        onChange={() => toggleSelect(app.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{app.candidates?.name_en}</p>
                          <p className="text-xs text-muted-foreground">{app.candidates?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">{app.job_postings?.title_en}</td>
                    <td className="py-3 px-4">
                      {stage && (
                        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${stage.color}`}>
                          {stage.label}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell"><ScoreBadge score={app.ai_match_score} /></td>
                    <td className="py-3 px-4 text-xs text-muted-foreground hidden xl:table-cell">{new Date(app.created_at).toLocaleDateString()}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
