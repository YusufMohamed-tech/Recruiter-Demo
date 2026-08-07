import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('seeker_applications')
    .select(`
      *,
      seeker_profiles(*, seeker_experiences(*), seeker_education(*), seeker_certifications(*)),
      job_postings(title_en, slug)
    `)
    .eq('id', id)
    .single()

  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const updates: any = { updated_at: new Date().toISOString() }

  if (body.status) {
    updates.status = body.status
    if (body.status === 'under_review') updates.reviewed_at = new Date().toISOString()
    if (body.status === 'shortlisted') updates.shortlisted_at = new Date().toISOString()
    if (body.status === 'rejected') updates.rejected_at = new Date().toISOString()
  }
  if (body.internal_notes !== undefined) updates.internal_notes = body.internal_notes
  if (body.rejection_reason !== undefined) updates.rejection_reason = body.rejection_reason

  const { data, error } = await supabase
    .from('seeker_applications')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
