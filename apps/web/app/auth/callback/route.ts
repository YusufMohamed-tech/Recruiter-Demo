import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type') || 'seeker'
  const redirect = searchParams.get('redirect') || ''

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      const existingType = data.user.user_metadata?.user_type

      if (!existingType) {
        await supabase.auth.updateUser({
          data: { user_type: type },
        })
      }

      const userType = existingType || type

      if (redirect) {
        return NextResponse.redirect(new URL(redirect, request.url))
      }

      if (userType === 'seeker') {
        const { data: profile } = await supabase
          .from('seeker_profiles')
          .select('id')
          .eq('user_id', data.user.id)
          .single()

        if (!profile) {
          return NextResponse.redirect(new URL('/seeker/onboarding', request.url))
        }
        return NextResponse.redirect(new URL('/seeker/dashboard', request.url))
      }

      const { data: orgUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', data.user.id)
        .single()

      if (!orgUser) {
        return NextResponse.redirect(new URL('/company/onboarding', request.url))
      }
      return NextResponse.redirect(new URL('/company/dashboard', request.url))
    }
  }

  return NextResponse.redirect(new URL('/login?error=auth_failed', request.url))
}
