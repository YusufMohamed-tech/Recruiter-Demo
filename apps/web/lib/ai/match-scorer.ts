import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export type MatchBreakdown = {
  experience: { score: number; notes_en: string; notes_ar: string }
  education:  { score: number; notes_en: string; notes_ar: string }
  skills:     { score: number; notes_en: string; notes_ar: string }
  certifications: { score: number; notes_en: string; notes_ar: string }
}

export type MatchResult = {
  overall_score: number           // 0-100
  breakdown: MatchBreakdown
  strengths_en: string[]
  strengths_ar: string[]
  gaps_en: string[]
  gaps_ar: string[]
  recommendation_en: string
  recommendation_ar: string
}

const SYSTEM = `You are a recruitment analyst. Score how well a candidate matches a job. Return ONLY valid JSON (no markdown).`

const PROMPT = (job: Record<string, unknown>, profile: Record<string, unknown>) => `Score this candidate against the job requirements. Return a JSON object with:
- overall_score (number 0-100)
- breakdown (object with keys: experience, education, skills, certifications — each with: score (0-100), notes_en (string), notes_ar (string))
- strengths_en (string array — top 3 strengths, English)
- strengths_ar (string array — top 3 strengths, Arabic)
- gaps_en (string array — top 3 gaps or concerns, English)
- gaps_ar (string array — top 3 gaps, Arabic)
- recommendation_en (string — 1-2 sentence hiring recommendation, English)
- recommendation_ar (string — same in Arabic)

JOB REQUIREMENTS:
${JSON.stringify(job, null, 2)}

CANDIDATE PROFILE:
${JSON.stringify(profile, null, 2)}`

export async function scoreMatch(
  job: Record<string, unknown>,
  candidateProfile: Record<string, unknown>
): Promise<MatchResult> {
  const message = await client.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 2048,
    system: SYSTEM,
    messages: [{ role: 'user', content: PROMPT(job, candidateProfile) }],
  })

  const raw = message.content[0].type === 'text' ? message.content[0].text : ''
  const json = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
  return JSON.parse(json) as MatchResult
}
