import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({ action: z.enum(['publish', 'close', 'unpublish']) })

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('org_id').eq('id', user.id).single()
  const { action } = schema.parse(await request.json())

  const updates: Record<string, unknown> =
    action === 'publish'   ? { status: 'published', published_at: new Date().toISOString() } :
    action === 'close'     ? { status: 'closed',    closed_at:    new Date().toISOString() } :
                             { status: 'draft',      published_at: null }

  const { data, error } = await supabase
    .from('job_postings')
    .update(updates)
    .eq('id', (await params).id)
    .eq('org_id', profile?.org_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error }, { status: 400 })

  await supabase.from('audit_events').insert({
    org_id: profile?.org_id, actor_type: 'user', actor_id: user.id,
    action, resource_type: 'job_posting', resource_id: (await params).id,
  })

  return NextResponse.json(data)
}
