import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'
import { listClients, resolveSupabaseUrl } from '@/lib/clients'
import { getSupabaseEnv, validateSupabaseEnv } from '@/lib/env'
import { runQaChecks, type QaCheck } from '@/lib/qa'
import { createClient as createServerSupabase } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase-admin'
import { homePathForRole } from '@/lib/auth-routing'

export interface FeatureStatus {
  id: string
  name: string
  status: 'done' | 'partial' | 'missing'
  route?: string
  notes: string
}

export interface SuperQaReport {
  generatedAt: string
  siteOrigin?: string
  app: { name: string; version: string; nextVersion: string }
  serverSession: {
    authenticated: boolean
    userId?: string
    email?: string
    role?: string | null
    expectedHome?: string
    profileError?: string
  }
  env: {
    validation: ReturnType<typeof validateSupabaseEnv>
    resolvedSupabaseUrl?: string
    envVarPresence: Record<string, boolean>
  }
  database: Record<string, unknown>
  storage: Record<string, unknown>
  routes: { path: string; description: string; implemented: boolean }[]
  featureMatrix: FeatureStatus[]
  middleware: { note: string; publicPaths: string[] }
  checks: QaCheck[]
  summary: { ok: number; warn: number; fail: number; info: number }
  hints: string[]
  clients: { id: string; name: string; ref?: string }[]
}

const ENV_VARS = [
  'NEXT_PUBLIC_CLIENT_ID',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_DEPLOYMENT_ENV',
  'URL',
  'DEPLOY_URL',
  'NODE_ENV',
]

const FEATURE_MATRIX: FeatureStatus[] = [
  { id: 'landing', name: 'MSC portal landing', status: 'done', route: '/', notes: 'Student + Admin portals' },
  { id: 'auth', name: 'Supabase Auth login/signup', status: 'done', route: '/auth/login', notes: 'Real auth — no fake DB' },
  { id: 'logout', name: 'Logout', status: 'done', route: '/auth/logout', notes: 'Sign out + switch accounts' },
  { id: 'applicant-dash', name: 'Applicant dashboard', status: 'done', route: '/applicant/dashboard', notes: 'Profile + question status' },
  { id: 'video-record', name: 'Video recording + upload', status: 'partial', route: '/applicant/record', notes: 'Needs supabase-storage-setup.sql' },
  { id: 'admin-users', name: 'Admin user management', status: 'done', route: '/admin/dashboard', notes: 'Supabase Auth Admin API' },
  { id: 'admin-questions', name: 'Admin question editor', status: 'done', route: '/admin/dashboard', notes: 'Add/reorder/toggle/delete' },
  { id: 'recruiter', name: 'Recruiter portal', status: 'missing', notes: 'v78 had /recruiter — not ported yet' },
  { id: 'public-slug', name: 'Public student showcase /[slug]', status: 'missing', notes: 'v78 short URL pages' },
  { id: 'portfolio', name: 'Portfolio / resume / social links', status: 'missing', notes: 'Schema exists, no UI' },
  { id: 'admin-settings', name: 'Admin branding settings UI', status: 'missing', notes: 'v78 had 8-tab settings — use registry.json now' },
  { id: 'interview-tips', name: 'Interview tips editor', status: 'missing', notes: 'v78 admin content tab' },
  { id: 'analytics', name: 'Admin analytics', status: 'partial', route: '/admin/dashboard', notes: 'Basic counts only' },
  { id: 'playlists', name: 'Playlists / campaigns', status: 'missing', notes: 'DB schema only' },
  { id: 'magic-link', name: 'Magic link login', status: 'partial', route: '/auth/login', notes: 'Needs Supabase redirect URLs' },
]

const ROUTES = [
  { path: '/', description: 'Portal landing', implemented: true },
  { path: '/auth/login', description: 'Login', implemented: true },
  { path: '/auth/signup', description: 'Signup', implemented: true },
  { path: '/auth/logout', description: 'Logout', implemented: true },
  { path: '/auth/callback', description: 'Auth callback', implemented: true },
  { path: '/applicant/dashboard', description: 'Applicant dashboard', implemented: true },
  { path: '/applicant/record', description: 'Video recording', implemented: true },
  { path: '/admin/dashboard', description: 'Admin panel', implemented: true },
  { path: '/recruiter', description: 'Recruiter portal', implemented: false },
  { path: '/[slug]', description: 'Public showcase', implemented: false },
  { path: '/qa', description: 'Super QA', implemented: true },
  { path: '/api/qa/super', description: 'QA JSON API', implemented: true },
  { path: '/api/health', description: 'Health check', implemented: true },
  { path: '/api/public-config', description: 'Browser Supabase config', implemented: true },
  { path: '/api/admin/users', description: 'Admin users API', implemented: true },
  { path: '/api/admin/questions', description: 'Admin questions API', implemented: true },
]

function readPkgVersion() {
  try {
    const pkg = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8'))
    return { name: pkg.name, version: pkg.version, nextVersion: pkg.dependencies?.next || 'unknown' }
  } catch {
    return { name: 'hinterviewer-x', version: 'unknown', nextVersion: 'unknown' }
  }
}

export async function runSuperQaChecks(siteOrigin?: string): Promise<SuperQaReport> {
  const base = await runQaChecks(siteOrigin)
  const validation = validateSupabaseEnv()
  const env = getSupabaseEnv()
  const hints: string[] = []

  const serverSession: SuperQaReport['serverSession'] = { authenticated: false }
  try {
    const supabase = await createServerSupabase()
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser()
    if (authErr) serverSession.profileError = authErr.message
    if (user) {
      serverSession.authenticated = true
      serverSession.userId = user.id
      serverSession.email = user.email
      const { data: profile, error: pErr } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', user.id)
        .maybeSingle()
      if (pErr) serverSession.profileError = pErr.message
      serverSession.role = profile?.role ?? null
      serverSession.expectedHome = homePathForRole(profile?.role)
      if (serverSession.role && serverSession.role !== 'applicant') {
        hints.push(
          `Logged in as ${serverSession.role} (${serverSession.email}). Log out at /auth/logout before testing student login.`,
        )
      }
    } else {
      hints.push('No server session cookie — visit /auth/login to authenticate.')
    }
  } catch (e) {
    serverSession.profileError = e instanceof Error ? e.message : 'Session check failed'
  }

  const envVarPresence = Object.fromEntries(
    ENV_VARS.map((k) => [k, Boolean(process.env[k]?.trim())]),
  )

  const database: Record<string, unknown> = {}
  const storage: Record<string, unknown> = {}

  if (env) {
    const anon = createClient(env.url, env.anonKey)
    const tables = ['profiles', 'questions', 'video_answers', 'social_links', 'campaigns'] as const
    for (const table of tables) {
      const { count, error } = await anon.from(table).select('id', { count: 'exact', head: true })
      database[table] = error ? { error: error.message } : { count }
    }

    if (env.serviceRoleKey) {
      try {
        const admin = createServiceClient()
        const { data: buckets, error: bErr } = await admin.storage.listBuckets()
        storage.buckets = bErr ? { error: bErr.message } : buckets?.map((b) => b.name)
        const hasVideoBucket = buckets?.some((b) => b.name === 'video-answers')
        storage.videoAnswersBucket = hasVideoBucket ? 'ok' : 'missing — run supabase-storage-setup.sql'
        if (!hasVideoBucket) {
          hints.push('Run supabase-storage-setup.sql in Supabase SQL Editor for video uploads.')
        }

        const { error: uErr } = await admin.auth.admin.listUsers({ perPage: 1 })
        storage.authUserList = uErr ? { error: uErr.message } : { ok: true }

        const { data: roleCounts } = await admin.from('profiles').select('role')
        const byRole: Record<string, number> = {}
        for (const r of roleCounts || []) {
          byRole[r.role] = (byRole[r.role] || 0) + 1
        }
        database.profilesByRole = byRole

        const { count: completedVideos } = await admin
          .from('video_answers')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'completed')
        database.completedVideoAnswers = completedVideos
      } catch (e) {
        storage.serviceError = e instanceof Error ? e.message : 'Service client error'
      }
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    siteOrigin,
    app: readPkgVersion(),
    serverSession,
    env: {
      validation,
      resolvedSupabaseUrl: resolveSupabaseUrl(),
      envVarPresence,
    },
    database,
    storage,
    routes: ROUTES,
    featureMatrix: FEATURE_MATRIX,
    middleware: {
      note: 'Auth pages no longer auto-redirect when logged in — use Log out to switch accounts.',
      publicPaths: [
        '/auth/login',
        '/auth/signup',
        '/auth/logout',
        '/qa',
        '/api/qa/super',
      ],
    },
    checks: base.checks,
    summary: base.summary,
    hints: [
      ...hints,
      'Copy the full JSON below and paste into chat for debugging.',
      'Student test: log out first, then sign up or use admin-created applicant account.',
    ],
    clients: listClients().map((c) => ({ id: c.id, name: c.name, ref: c.supabaseProjectRef })),
  }
}
