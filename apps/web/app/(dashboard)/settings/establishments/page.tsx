import type { Metadata } from 'next'
import { createServerSupabase } from '@/lib/supabase/server'
import { EstablishmentsClient } from './EstablishmentsClient'

export const metadata: Metadata = { title: 'Establishments' }

export default async function EstablishmentsPage() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('users').select('org_id').eq('id', user!.id).single()
  const { data: establishments } = await supabase
    .from('establishments')
    .select('*')
    .eq('org_id', profile?.org_id)
    .order('name_ar')

  return (
    <div className="rounded-card border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-heading text-lg font-semibold">Establishments</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your registered Mol establishments</p>
        </div>
      </div>
      <EstablishmentsClient initialData={establishments ?? []} />
    </div>
  )
}
