import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { createHash } from 'crypto'

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const respondSchema = z.object({
  action:          z.enum(['accept','decline','negotiate']),
  candidate_notes: z.string().optional(),
  counter_details: z.record(z.unknown()).optional(),
})

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { data: offer } = await adminClient
    .from('offers')
    .select(`
      id, status, current_version, expires_at,
      candidates ( name_en, name_ar, email ),
      job_applications ( job_postings ( title_en, city ) ),
      offer_versions ( * )
    `)
    .eq('access_token', (await params).token)
    .single()

  if (!offer) return NextResponse.json({ error: 'Invalid link' }, { status: 404 })

  // Don't expose internal IDs or access_token to the public
  const { offer_versions, ...rest } = offer as typeof offer & { offer_versions: unknown[] }
  const latestVersion = Array.isArray(offer_versions)
    ? offer_versions.find((v: any) => v.version === rest.current_version) ?? offer_versions.at(-1)
    : null

  return NextResponse.json({ ...rest, version: latestVersion })
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { data: offer } = await adminClient
    .from('offers')
    .select('id, status, expires_at, candidate_id, application_id, org_id')
    .eq('access_token', (await params).token)
    .single()

  if (!offer) return NextResponse.json({ error: 'Invalid link' }, { status: 404 })

  if (offer.status !== 'sent') {
    return NextResponse.json({
      error: offer.status === 'accepted' ? 'Already accepted' :
             offer.status === 'withdrawn' ? 'This offer has been withdrawn' :
             'Offer is not available for a response',
    }, { status: 409 })
  }

  if (offer.expires_at && new Date(offer.expires_at) < new Date()) {
    return NextResponse.json({ error: 'This offer has expired' }, { status: 410 })
  }

  const body = await request.json()
  const { action, candidate_notes, counter_details } = respondSchema.parse(body)

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const ua = request.headers.get('user-agent') ?? ''

  await adminClient.from('offer_responses').insert({
    offer_id:        offer.id,
    action,
    candidate_notes: candidate_notes ?? null,
    counter_details: counter_details ?? null,
    ip_address:      ip,
    user_agent:      ua,
  })

  const now = new Date().toISOString()

  if (action === 'accept') {
    // Generate acceptance hash: sha256(offer_id + candidate_id + timestamp + secret)
    const secret   = process.env.OFFER_ACCEPT_SECRET ?? 'demo-secret'
    const hashData = `${offer.id}:${offer.candidate_id}:${now}:${secret}`
    const hash     = createHash('sha256').update(hashData).digest('hex')

    await adminClient
      .from('offers')
      .update({ status: 'accepted', accepted_at: now, acceptance_hash: hash, updated_at: now })
      .eq('id', offer.id)

    // Advance application to hired
    await adminClient
      .from('job_applications')
      .update({ current_stage: 'hired', updated_at: now })
      .eq('id', offer.application_id)

    await adminClient.from('application_stage_events').insert({
      application_id: offer.application_id,
      from_stage:     'offer',
      to_stage:       'hired',
      notes:          'Offer accepted by candidate',
    })

    // Auto-create preboarding/readiness case if one doesn't exist yet
    const { data: existingCase } = await adminClient
      .from('employment_readiness_cases')
      .select('id')
      .eq('application_id', offer.application_id)
      .single()

    if (!existingCase) {
      // Determine branch_type from candidate nationality
      const { data: candidate } = await adminClient
        .from('candidates')
        .select('nationality')
        .eq('id', offer.candidate_id)
        .single()

      const nationality = (candidate?.nationality ?? '').toUpperCase()
      const branchType = nationality === 'SA' || nationality === 'SAUDI' ? 'saudi'
        : nationality === '' ? 'resident_expat'
        : 'new_expat'

      const { data: newCase } = await adminClient
        .from('employment_readiness_cases')
        .insert({
          org_id:         offer.org_id,
          application_id: offer.application_id,
          candidate_id:   offer.candidate_id,
          offer_id:       offer.id,
          branch_type:    branchType,
          status:         'open',
        })
        .select('id')
        .single()

      if (newCase) {
        const baseItems = [
          { item_type: 'compliance_readiness', label_en: 'Profession localization review', label_ar: 'مراجعة توطين المهنة', mandatory: true },
          { item_type: 'candidate_docs',       label_en: 'National ID / Iqama copy',       label_ar: 'نسخة الهوية الوطنية / الإقامة', mandatory: true },
          { item_type: 'candidate_docs',       label_en: 'Educational certificates',        label_ar: 'الشهادات الدراسية', mandatory: false },
          { item_type: 'internal_onboarding',  label_en: 'IT equipment request',            label_ar: 'طلب معدات تقنية المعلومات', mandatory: false },
          { item_type: 'internal_onboarding',  label_en: 'Email account setup',             label_ar: 'إعداد حساب البريد الإلكتروني', mandatory: false },
          { item_type: 'payroll_gosi',         label_en: 'GOSI registration',               label_ar: 'تسجيل التأمينات الاجتماعية', mandatory: true },
          { item_type: 'payroll_gosi',         label_en: 'Bank account details',            label_ar: 'بيانات الحساب البنكي', mandatory: true },
        ]

        const contractItems = branchType !== 'saudi' ? [
          { item_type: 'contract_readiness', label_en: 'Qiwa contract submitted',           label_ar: 'تقديم عقد قوى', mandatory: true },
          { item_type: 'contract_readiness', label_en: 'Qiwa contract signed by candidate', label_ar: 'توقيع العقد من المرشح', mandatory: true },
        ] : [
          { item_type: 'contract_readiness', label_en: 'Employment contract signed',        label_ar: 'توقيع عقد العمل', mandatory: true },
        ]

        const govItems = branchType === 'new_expat' ? [
          { item_type: 'government_process', label_en: 'Visa application submitted',        label_ar: 'تقديم طلب التأشيرة', mandatory: true },
          { item_type: 'government_process', label_en: 'Work permit issued',                label_ar: 'إصدار تصريح العمل', mandatory: true },
        ] : branchType === 'resident_expat' ? [
          { item_type: 'government_process', label_en: 'Iqama transfer initiated',          label_ar: 'بدء نقل الإقامة', mandatory: true },
        ] : []

        const allItems = [...baseItems, ...contractItems, ...govItems].map(item => ({
          ...item,
          readiness_case_id: newCase.id,
        }))

        await adminClient.from('readiness_checklist_items').insert(allItems)
        await adminClient.rpc('recalculate_sere_score', { p_case_id: newCase.id }).catch(() => null)
      }
    }

    return NextResponse.json({ ok: true, action: 'accepted', acceptance_hash: hash })
  }

  if (action === 'decline') {
    await adminClient
      .from('offers')
      .update({ status: 'declined', declined_at: now, updated_at: now })
      .eq('id', offer.id)
    return NextResponse.json({ ok: true, action: 'declined' })
  }

  // negotiate — status stays 'sent', recruiter sees the counter details
  return NextResponse.json({ ok: true, action: 'negotiation_requested' })
}
