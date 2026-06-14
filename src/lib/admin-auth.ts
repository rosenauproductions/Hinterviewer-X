import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { isAdminRole } from '@/lib/auth-routing'
import { assertSupabaseEnv } from '@/lib/env'
import { createClient as createCookieClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase-admin'

async function resolveUser(request: Request) {
  const env = assertSupabaseEnv()
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim()

  if (token) {
    const bearer = createClient(env.url, env.anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const {
      data: { user },
      error,
    } = await bearer.auth.getUser(token)
    if (!error && user) return user
  }

  const supabase = await createCookieClient()
  const {
    data: { user },
    error: cookieError,
  } = await supabase.auth.getUser()
  if (!cookieError && user) return user

  return null
}

export async function requireAdminSession(request: Request) {
  const user = await resolveUser(request)

  if (!user) {
    return {
      error: NextResponse.json(
        {
          error: 'Unauthorized',
          hint: 'Sign in as super_admin or low_admin. Session may not reach API on Netlify — page will retry with bearer token.',
        },
        { status: 401 },
      ),
    }
  }

  let service
  try {
    service = createServiceClient()
  } catch (e) {
    return {
      error: NextResponse.json(
        {
          error:
            e instanceof Error
              ? e.message
              : 'SUPABASE_SERVICE_ROLE_KEY required for admin user/question APIs',
        },
        { status: 503 },
      ),
    }
  }

  const { data: profile, error: profileError } = await service
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    return {
      error: NextResponse.json({ error: profileError.message }, { status: 500 }),
    }
  }

  if (!isAdminRole(profile?.role)) {
    return {
      error: NextResponse.json(
        { error: 'Forbidden', role: profile?.role ?? null, email: user.email },
        { status: 403 },
      ),
    }
  }

  return { user, profile, service }
}
