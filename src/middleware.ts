import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { resolveSupabaseUrl } from '@/lib/clients'
import { isSupabaseConfigured } from '@/lib/env'

const PUBLIC_PATHS = ['/setup', '/api/health']

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  if (PUBLIC_PATHS.some((p) => path === p || path.startsWith(`${p}/`))) {
    return NextResponse.next()
  }

  if (!isSupabaseConfigured()) {
    if (path.startsWith('/setup')) {
      return NextResponse.next()
    }
    return NextResponse.redirect(new URL('/setup', request.url))
  }

  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const url = resolveSupabaseUrl()!
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({ name, value, ...options })
        response = NextResponse.next({ request: { headers: request.headers } })
        response.cookies.set({ name, value, ...options })
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({ name, value: '', ...options })
        response = NextResponse.next({ request: { headers: request.headers } })
        response.cookies.set({ name, value: '', ...options })
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (request.nextUrl.pathname.startsWith('/applicant') && !user) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  if (request.nextUrl.pathname.startsWith('/admin') && !user) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  if (request.nextUrl.pathname.startsWith('/auth') && user) {
    return NextResponse.redirect(new URL('/applicant/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
