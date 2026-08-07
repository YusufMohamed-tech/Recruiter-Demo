import type { Metadata } from 'next'
import { createServerSupabase } from '@/lib/supabase/server'
import { OrgSettingsForm } from './OrgSettingsForm'

export const metadata: Metadata = { title: 'Organization Settings' }

export default async function OrganizationSettingsPage() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('users').select('org_id').eq('id', user!.id).single()

  const { data: org } = await supabase
    .from('organizations').select('*').eq('id', profile?.org_id).single()

  return (
    <div className="rounded-card border bg-white p-6 shadow-sm">
      <h2 className="font-heading text-lg font-semibold mb-1">Organization Profile</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Legal information and contact details for your organization
      </p>
      <OrgSettingsForm org={org} />
    </div>
  )
}
