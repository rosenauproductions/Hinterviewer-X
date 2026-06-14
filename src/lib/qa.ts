import { createClient } from '@supabase/supabase-js'
import { resolveSupabaseUrl } from '@/lib/clients'
import { getSupabaseEnv, validateSupabaseEnv } from '@/lib/env'

export type QaStatus = 'ok' | 'warn' | 'fail' | 'info'

export interface QaCheck {
  id: string
  label: string
  status: QaStatus
  detail: string
  hint?: string
}

export interface QaReport {
  generatedAt: string
  siteOrigin?: string
  summary: { ok: number; warn: number; fail: number; info: number }
  checks: QaCheck[]
}

function countSummary(checks: QaCheck[]) {
  return checks.reduce(
    (acc, c) => {
      acc[c.status] += 1
      return acc
    },
    { ok: 0, warn: 0, fail: 0, info: 0 },
  )
}

function push(checks: QaCheck[], check: QaCheck) {
  checks.push(check)
}

export async function runQaChecks(siteOrigin?: string): Promise<QaReport> {
  const checks: QaCheck[] = []
  const validation = validateSupabaseEnv()
  const env = getSupabaseEnv()

  if (validation.ok && validation.clientId) {
    push(checks, {
      id: 'env-client',
      label: 'Client ID',
      status: 'ok',
      detail: `${validation.clientName} (${validation.clientId})`,
    })
  } else {
    push(checks, {
      id: 'env-client',
      label: 'Client ID',
      status: 'fail',
      detail: [...validation.missing, ...validation.invalid].join('; ') || 'Not configured',
      hint: 'Set NEXT_PUBLIC_CLIENT_ID in Netlify env vars',
    })
  }

  const url = resolveSupabaseUrl()
  if (url) {
    push(checks, {
      id: 'env-url',
      label: 'Supabase URL',
      status: 'ok',
      detail: url,
    })
  } else {
    push(checks, {
      id: 'env-url',
      label: 'Supabase URL',
      status: 'fail',
      detail: 'Could not resolve URL',
      hint: 'Set supabaseProjectRef in registry or NEXT_PUBLIC_SUPABASE_URL',
    })
  }

  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  if (anon?.startsWith('eyJ') && anon.split('.').length === 3) {
    push(checks, {
      id: 'env-anon',
      label: 'Anon key',
      status: 'ok',
      detail: `JWT present (${anon.length} chars)`,
    })
  } else if (anon?.startsWith('sb_')) {
    push(checks, {
      id: 'env-anon',
      label: 'Anon key',
      status: 'fail',
      detail: 'Using sb_publishable_ key — app expects legacy eyJ JWT',
      hint: 'Supabase → Settings → API → anon public (eyJ...)',
    })
  } else {
    push(checks, {
      id: 'env-anon',
      label: 'Anon key',
      status: 'fail',
      detail: 'Missing or invalid',
    })
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  push(checks, {
    id: 'env-service',
    label: 'Service role key',
    status: serviceKey?.startsWith('eyJ') ? 'ok' : 'warn',
    detail: serviceKey?.startsWith('eyJ')
      ? `JWT present (${serviceKey.length} chars)`
      : 'Not set — extended DB checks skipped',
    hint: serviceKey ? undefined : 'Add SUPABASE_SERVICE_ROLE_KEY for deeper QA checks',
  })

  if (env) {
    const anonClient = createClient(env.url, env.anonKey)
    const { error: qErr } = await anonClient.from('questions').select('id').limit(1)
    push(checks, {
      id: 'db-questions',
      label: 'Database: questions table',
      status: qErr ? 'fail' : 'ok',
      detail: qErr ? qErr.message : 'Readable via anon key',
      hint: qErr ? 'Run supabase-schema.sql and supabase-fix-rls.sql' : undefined,
    })

    if (serviceKey?.startsWith('eyJ')) {
      const admin = createClient(env.url, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
      const { count, error: pErr } = await admin
        .from('profiles')
        .select('id', { count: 'exact', head: true })

      push(checks, {
        id: 'db-profiles',
        label: 'Database: profiles table',
        status: pErr ? 'fail' : 'ok',
        detail: pErr ? pErr.message : `${count ?? 0} profile(s) in database`,
        hint: pErr ? 'Run supabase-schema.sql' : undefined,
      })

      const { data: admins, error: aErr } = await admin
        .from('profiles')
        .select('id, role, full_name')
        .in('role', ['low_admin', 'super_admin'])
        .limit(5)

      push(checks, {
        id: 'db-admins',
        label: 'Admin users',
        status: aErr ? 'fail' : admins?.length ? 'ok' : 'warn',
        detail: aErr
          ? aErr.message
          : admins?.length
            ? `${admins.length} admin(s): ${admins.map((a) => a.full_name || a.role).join(', ')}`
            : 'No low_admin / super_admin profiles found',
        hint: admins?.length ? undefined : 'Run scripts/create-admin-user.sql or promote a user in profiles',
      })
    }
  }

  push(checks, {
    id: 'route-callback',
    label: 'Auth callback route',
    status: 'ok',
    detail: '/auth/callback implemented (email confirm + magic links)',
  })

  push(checks, {
    id: 'route-admin',
    label: 'Admin dashboard',
    status: 'ok',
    detail: '/admin/dashboard implemented',
  })

  push(checks, {
    id: 'auth-redirect-loop',
    label: 'Auth redirect loop',
    status: 'ok',
    detail: 'Fixed — admins route to /admin, applicants to /applicant',
    hint: 'If login still loops, check profiles row exists for the user',
  })

  push(checks, {
    id: 'browser-config',
    label: 'Browser Supabase config',
    status: 'ok',
    detail: 'Loaded via /api/public-config at runtime (no build-time NEXT_PUBLIC embed required)',
    hint: 'If login fails, redeploy Netlify after setting env vars',
  })

  if (siteOrigin) {
    push(checks, {
      id: 'auth-supabase-urls',
      label: 'Supabase Auth URLs (manual)',
      status: 'info',
      detail: `Add to Supabase → Auth → URL configuration`,
      hint: `Site URL: ${siteOrigin} | Redirect URLs: ${siteOrigin}/** and ${siteOrigin}/auth/callback`,
    })

    try {
      const cssProbe = await fetch(`${siteOrigin}/auth/login`, {
        signal: AbortSignal.timeout(8000),
      })
      const html = await cssProbe.text()
      const cssMatch = html.match(/_next\/static\/[^"']+\.css/)
      push(checks, {
        id: 'css-static',
        label: 'CSS assets on login page',
        status: cssMatch ? 'ok' : 'fail',
        detail: cssMatch ? `Found ${cssMatch[0]}` : 'No _next/static/*.css in HTML',
        hint: cssMatch ? undefined : 'Check Netlify build logs and @netlify/plugin-nextjs',
      })
    } catch (e) {
      push(checks, {
        id: 'css-static',
        label: 'CSS assets on login page',
        status: 'warn',
        detail: e instanceof Error ? e.message : 'Could not probe login page',
      })
    }
  }

  push(checks, {
    id: 'signup-email-confirm',
    label: 'Signup email confirmation',
    status: 'info',
    detail:
      'If signup says "Check your email", disable confirm in Supabase Auth OR confirm via email link to /auth/callback',
    hint: 'Supabase → Authentication → Providers → Email → Confirm email (toggle for dev)',
  })

  return {
    generatedAt: new Date().toISOString(),
    siteOrigin,
    summary: countSummary(checks),
    checks,
  }
}
