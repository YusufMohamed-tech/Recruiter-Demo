import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const body = await req.json()
  const { company_name_en, company_name_ar, cr_number, headquarters, website, industry, company_size, description_en, tagline_en } = body

  if (!company_name_en) {
    return NextResponse.json({ error: 'Company name is required' }, { status: 400 })
  }

  const slug = company_name_en
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  // Use admin client to bypass RLS for the chicken-and-egg problem
  const { data: org, error: orgError } = await supabaseAdmin
    .from('organizations')
    .insert({
      legal_name_en: company_name_en,
      legal_name_ar: company_name_ar || company_name_en,
      cr_number: cr_number || null,
      headquarters_city: headquarters || null,
      website: website || null,
    })
    .select()
    .single()

  if (orgError) {
    return NextResponse.json({ error: orgError.message }, { status: 500 })
  }

  const { error: userError } = await supabaseAdmin
    .from('users')
    .insert({
      id: user.id,
      org_id: org.id,
      email: user.email!,
      name_en: user.user_metadata?.full_name || user.email!.split('@')[0],
      is_active: true,
    })

  if (userError) {
    // Rollback org creation
    await supabaseAdmin.from('organizations').delete().eq('id', org.id)
    return NextResponse.json({ error: userError.message }, { status: 500 })
  }

  const { error: profileError } = await supabaseAdmin
    .from('company_profiles')
    .insert({
      org_id: org.id,
      display_name_en: company_name_en,
      display_name_ar: company_name_ar || null,
      slug,
      industry: industry || null,
      company_size: company_size || null,
      headquarters: headquarters || null,
      website: website || null,
      description_en: description_en || null,
      tagline_en: tagline_en || null,
    })

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, org_id: org.id })
}
