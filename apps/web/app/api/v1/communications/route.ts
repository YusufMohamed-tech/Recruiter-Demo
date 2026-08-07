import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { z } from 'zod'

const sendSchema = z.object({
  candidate_id:    z.string().uuid().optional(),
  application_id:  z.string().uuid().optional(),
  template_code:   z.string().optional(),
  channel:         z.enum(['email', 'sms', 'in_app']).default('email'),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
  subject:         z.string().optional(),
  body:            z.string().min(1),
})

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabase()
  const { searchParams } = new URL(request.url)

  const candidateId   = searchParams.get('candidate_id')
  const applicationId = searchParams.get('application_id')
  const channel       = searchParams.get('channel')
  const page          = parseInt(searchParams.get('page') ?? '1')
  const limit         = parseInt(searchParams.get('limit') ?? '25')
  const offset        = (page - 1) * limit

  let query = supabase
    .from('communications')
    .select(`
      id, channel, recipient_email, subject, status,
      sent_at, failed_at, failure_reason, created_at,
      candidates ( id, name_en ),
      job_applications ( id, job_postings ( title_en ) )
    `, { count: 'exact' })
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false })

  if (candidateId)   query = query.eq('candidate_id', candidateId)
  if (applicationId) query = query.eq('application_id', applicationId)
  if (channel)       query = query.eq('channel', channel)

  const { data, count, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data, { headers: { 'X-Total-Count': String(count ?? 0) } })
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase()
  const body = await request.json()
  const input = sendSchema.parse(body)

  // Get org_id from session user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userRow } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', user.id)
    .single()
  if (!userRow) return NextResponse.json({ error: 'User profile not found' }, { status: 403 })

  // Insert as queued first
  const { data: comm, error: insertErr } = await supabase
    .from('communications')
    .insert({
      org_id:          userRow.org_id,
      candidate_id:    input.candidate_id ?? null,
      application_id:  input.application_id ?? null,
      channel:         input.channel,
      recipient_email: input.recipient_email ?? null,
      recipient_phone: input.recipient_phone ?? null,
      subject:         input.subject ?? null,
      body:            input.body,
      status:          'queued',
    })
    .select()
    .single()

  if (insertErr || !comm) return NextResponse.json({ error: insertErr?.message }, { status: 400 })

  // Send via Resend if email channel
  if (input.channel === 'email' && input.recipient_email) {
    const resendKey = process.env.RESEND_API_KEY
    let sendStatus = 'sent'
    let providerMsgId: string | null = null
    let failureReason: string | null = null

    if (resendKey) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from:    process.env.RESEND_FROM_EMAIL ?? 'noreply@chessboard-systems.com',
            to:      [input.recipient_email],
            subject: input.subject ?? '(No subject)',
            html:    input.body,
          }),
        })
        const json = await res.json() as { id?: string; message?: string }
        if (!res.ok) {
          sendStatus = 'failed'
          failureReason = json.message ?? 'Send failed'
        } else {
          providerMsgId = json.id ?? null
        }
      } catch (err) {
        sendStatus = 'failed'
        failureReason = String(err)
      }
    } else {
      // No API key — mark as sent (demo mode)
      sendStatus = 'sent'
    }

    const now = new Date().toISOString()
    await supabase
      .from('communications')
      .update({
        status:              sendStatus,
        sent_at:             sendStatus === 'sent' ? now : null,
        failed_at:           sendStatus === 'failed' ? now : null,
        failure_reason:      failureReason,
        provider_message_id: providerMsgId,
      })
      .eq('id', comm.id)

    return NextResponse.json({ ...comm, status: sendStatus }, { status: 201 })
  }

  return NextResponse.json(comm, { status: 201 })
}
