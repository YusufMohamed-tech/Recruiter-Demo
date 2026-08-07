import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  let response = NextResponse.next({ request })

  if (process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true') {
    const lang = request.cookies.get('lang')?.value ?? 'en'
    const validLang = ['en', 'ar'].includes(lang) ? lang : 'en'
    response.headers.set('x-lang', validLang)
    response.headers.set('x-dir', validLang === 'ar' ? 'rtl' : 'ltr')
    return response
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isPublic = pathname === '/' ||
    pathname.startsWith('/jobs') ||
    pathname.startsWith('/company/') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/auth/callback')

  if (isPublic) {
    if ((pathname === '/login' || pathname.startsWith('/signup')) && user) {
      const userType = user.user_metadata?.user_type
      if (userType === 'seeker') {
        return NextResponse.redirect(new URL('/seeker/dashboard', request.url))
      }
      return NextResponse.redirect(new URL('/company/dashboard', request.url))
    }

    const lang = request.cookies.get('lang')?.value ?? 'en'
    const validLang = ['en', 'ar'].includes(lang) ? lang : 'en'
    response.headers.set('x-lang', validLang)
    response.headers.set('x-dir', validLang === 'ar' ? 'rtl' : 'ltr')
    return response
  }

  if (!user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const userType = user.user_metadata?.user_type

  if (pathname.startsWith('/seeker') && userType !== 'seeker') {
    return NextResponse.redirect(new URL('/company/dashboard', request.url))
  }
  if (pathname.startsWith('/company') && userType === 'seeker') {
    return NextResponse.redirect(new URL('/seeker/dashboard', request.url))
  }

  const lang = request.cookies.get('lang')?.value ?? 'en'
  const validLang = ['en', 'ar'].includes(lang) ? lang : 'en'
  response.headers.set('x-lang', validLang)
  response.headers.set('x-dir', validLang === 'ar' ? 'rtl' : 'ltr')

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}
