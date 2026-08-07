import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export type ParsedCV = {
  name_en: string
  name_ar?: string
  email?: string
  phone?: string
  current_title?: string
  current_city?: string
  nationality?: string
  total_experience_years?: number
  education_level?: string
  education: Array<{ institution: string; degree: string; field?: string; year?: number }>
  experience: Array<{ company: string; title: string; from?: string; to?: string; description?: string }>
  skills: string[]
  certifications: string[]
  languages: string[]
  linkedin_url?: string
  summary?: string
}

const SYSTEM = `You are a CV parser. Extract structured data from resume text and return ONLY a valid JSON object (no markdown, no explanation).`

const PROMPT = (text: string) => `Parse this CV/resume and return a JSON object with these fields:
- name_en (string, required)
- name_ar (string, optional)
- email (string, optional)
- phone (string, optional)
- current_title (string, optional — most recent job title)
- current_city (string, optional)
- nationality (string, optional)
- total_experience_years (number, optional — estimated total years of work experience)
- education_level (string, optional — one of: high_school, diploma, bachelor, master, phd)
- education (array of { institution, degree, field?, year? })
- experience (array of { company, title, from?, to?, description? })
- skills (array of strings — technical and soft skills)
- certifications (array of strings)
- languages (array of strings — spoken languages)
- linkedin_url (string, optional)
- summary (string, optional — 2-3 sentence professional summary if present)

CV TEXT:
${text}`

export async function parseCV(cvText: string): Promise<ParsedCV> {
  const message = await client.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 2048,
    system: SYSTEM,
    messages: [{ role: 'user', content: PROMPT(cvText) }],
  })

  const raw = message.content[0].type === 'text' ? message.content[0].text : ''
  // Strip potential markdown fences
  const json = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
  return JSON.parse(json) as ParsedCV
}
