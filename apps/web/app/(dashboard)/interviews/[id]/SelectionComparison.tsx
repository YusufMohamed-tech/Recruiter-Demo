'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Star } from 'lucide-react'

type Scorecard = {
  overall_rating?: number
  recommendation: string
  strengths?: string
  concerns?: string
  interviewer?: { name_en: string }
}

type Interview = {
  id: string
  title: string
  interview_type: string
  scheduled_at?: string
  status: string
  interview_scorecards?: Scorecard[]
}

const REC_SCORE: Record<string, number> = {
  strong_hire: 5, hire: 4, neutral: 3, no_hire: 2, strong_no_hire: 1,
}

const REC_COLOR: Record<string, string> = {
  strong_hire:    'text-green-700 bg-green-500/10',
  hire:           'text-green-600 bg-green-400/10',
  neutral:        'text-muted-foreground bg-muted',
  no_hire:        'text-status-error bg-status-error/10',
  strong_no_hire: 'text-status-error bg-status-error/15',
}

export function SelectionComparison({ applicationId }: { applicationId: string }) {
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    fetch(`/api/v1/interviews?application_id=${applicationId}`)
      .then(r => r.json())
      .then(async (list: Interview[]) => {
        // Fetch full detail for each to get scorecards
        const full = await Promise.all(
          list.map(iv => fetch(`/api/v1/interviews/${iv.id}`).then(r => r.json()))
        )
        setInterviews(full)
        setLoading(false)
      })
  }, [applicationId])

  if (loading) return <div className="py-8 text-center text-sm text-muted-foreground">Loading comparison…</div>
  if (interviews.length === 0) return <div className="py-8 text-center text-sm text-muted-foreground">No interviews found for this application.</div>

  // Aggregate
  const allScorecards = interviews.flatMap(iv => iv.interview_scorecards ?? [])
  const withRatings   = allScorecards.filter(s => s.overall_rating)
  const avgRating     = withRatings.length > 0
    ? (withRatings.reduce((s, sc) => s + (sc.overall_rating ?? 0), 0) / withRatings.length).toFixed(1)
    : null
  const avgRecScore   = allScorecards.length > 0
    ? allScorecards.reduce((s, sc) => s + (REC_SCORE[sc.recommendation] ?? 3), 0) / allScorecards.length
    : null
  const consensusRec  = avgRecScore
    ? avgRecScore >= 4.5 ? 'Strong Hire'
    : avgRecScore >= 3.5 ? 'Hire'
    : avgRecScore >= 2.5 ? 'Neutral'
    : avgRecScore >= 1.5 ? 'No Hire'
    : 'Strong No Hire'
    : null

  return (
    <div className="space-y-6">
      {/* Summary */}
      {allScorecards.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border bg-card p-4 text-center">
            <p className="text-2xl font-bold text-brand-dark">{interviews.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Interviews</p>
          </div>
          <div className="rounded-xl border bg-card p-4 text-center">
            {avgRating
              ? <><p className="text-2xl font-bold text-brand-dark">{avgRating}<span className="text-sm text-muted-foreground">/5</span></p><p className="text-xs text-muted-foreground mt-0.5">Avg Rating</p></>
              : <><p className="text-lg font-medium text-muted-foreground">—</p><p className="text-xs text-muted-foreground">Avg Rating</p></>
            }
          </div>
          <div className="rounded-xl border bg-card p-4 text-center">
            {consensusRec
              ? <><p className="text-sm font-bold text-brand-dark">{consensusRec}</p><p className="text-xs text-muted-foreground mt-0.5">Panel Consensus</p></>
              : <><p className="text-lg font-medium text-muted-foreground">—</p><p className="text-xs text-muted-foreground">Panel Consensus</p></>
            }
          </div>
        </div>
      )}

      {/* Interview-by-interview breakdown */}
      {interviews.map(iv => {
        const scorecards = iv.interview_scorecards ?? []
        const roundAvg   = scorecards.filter(s => s.overall_rating).length > 0
          ? (scorecards.reduce((s, sc) => s + (sc.overall_rating ?? 0), 0) / scorecards.filter(s => s.overall_rating).length).toFixed(1)
          : null

        return (
          <div key={iv.id} className="rounded-xl border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b bg-muted/30">
              <div className="flex items-center gap-3">
                <Link href={`/interviews/${iv.id}`} className="font-semibold text-sm text-brand-dark hover:underline">{iv.title}</Link>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{iv.interview_type}</span>
                <span className="text-xs text-muted-foreground">{iv.status}</span>
              </div>
              {roundAvg && (
                <span className="inline-flex items-center gap-1 text-sm font-bold">
                  <Star className="h-3.5 w-3.5 text-brand-green" />{roundAvg}/5
                </span>
              )}
            </div>

            {scorecards.length === 0 && (
              <p className="px-5 py-4 text-sm text-muted-foreground">No scorecards submitted yet.</p>
            )}

            {scorecards.length > 0 && (
              <div className="divide-y">
                {scorecards.map((sc, i) => {
                  const recColor = REC_COLOR[sc.recommendation] ?? 'text-muted-foreground bg-muted'
                  return (
                    <div key={i} className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-[1fr_auto]">
                      <div className="space-y-1.5">
                        <p className="text-sm font-medium">{sc.interviewer?.name_en ?? 'Unknown'}</p>
                        {sc.strengths && (
                          <p className="text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">+ </span>{sc.strengths}
                          </p>
                        )}
                        {sc.concerns && (
                          <p className="text-xs text-muted-foreground">
                            <span className="font-medium text-status-error">− </span>{sc.concerns}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                        {sc.overall_rating && (
                          <span className="text-sm font-bold">
                            {'★'.repeat(Math.round(sc.overall_rating))}{' '}{sc.overall_rating}/5
                          </span>
                        )}
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${recColor}`}>
                          {sc.recommendation.replace(/_/g,' ')}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
