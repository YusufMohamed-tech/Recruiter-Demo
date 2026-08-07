import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { OfferPortal } from './OfferPortal'

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function OfferPortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { data: offer } = await adminClient
    .from('offers')
    .select(`
      id, status, current_version, expires_at, accepted_at, declined_at, withdrawn_at,
      candidates ( name_en, name_ar, email ),
      job_applications ( job_postings ( title_en, city ) ),
      offer_versions ( * )
    `)
    .eq('access_token', (await params).token)
    .single()

  if (!offer) notFound()

  const versions = (offer.offer_versions as any[]) ?? []
  const currentVer = versions.find((v: any) => v.version === offer.current_version) ?? versions.at(-1)

  return (
    <OfferPortal
      token={(await params).token}
      offer={{
        status:       offer.status,
        current_version: offer.current_version,
        expires_at:   offer.expires_at ?? null,
        accepted_at:  offer.accepted_at ?? null,
        declined_at:  offer.declined_at ?? null,
        withdrawn_at: offer.withdrawn_at ?? null,
        candidate:    offer.candidates as any,
        job:          (offer.job_applications as any)?.job_postings ?? null,
        version:      currentVer ?? null,
      }}
    />
  )
}
