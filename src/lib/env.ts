/**
 * Supabase / deployment env — no placeholders, no fake DB.
 *
 * Half-and-half multi-client model:
 *   Git: clients/registry.json (client id, name, branding, supabase project ref)
 *   Netlify per site: NEXT_PUBLIC_CLIENT_ID + anon/service keys (secrets)
 */

import {
  getActiveClient,
  resolveSupabaseUrl,
  validateClientSelection,
} from './clients'

const PLACEHOLDER_MARKERS = [
  'your-supabase',
  'your-anon',
  'your-project',
  'your-service-role',
  'placeholder',
  'changeme',
  'example.supabase.co',
] as const

export interface SupabaseEnv {
  url: string
  anonKey: string
  serviceRoleKey?: string
}

export interface EnvValidation {
  ok: boolean
  missing: string[]
  invalid: string[]
  clientId?: string
  clientName?: string
}

function raw(name: string): string | undefined {
  const v = process.env[name]?.trim()
  return v && v.length > 0 ? v : undefined
}

function looksPlaceholder(value: string): boolean {
  const lower = value.toLowerCase()
  return PLACEHOLDER_MARKERS.some((m) => lower.includes(m))
}

function isValidSupabaseUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return u.protocol === 'https:' && u.hostname.endsWith('.supabase.co')
  } catch {
    return false
  }
}

function isValidJwt(key: string): boolean {
  return key.startsWith('eyJ') && key.split('.').length === 3
}

export function validateSupabaseEnv(): EnvValidation {
  const missing: string[] = []
  const invalid: string[] = []

  const clientCheck = validateClientSelection()
  if (clientCheck.missingClientId) {
    missing.push('NEXT_PUBLIC_CLIENT_ID')
  } else if (clientCheck.unknownClientId) {
    invalid.push(`NEXT_PUBLIC_CLIENT_ID (unknown: ${clientCheck.clientId})`)
  }

  const url = resolveSupabaseUrl()
  const anonKey = raw('NEXT_PUBLIC_SUPABASE_ANON_KEY')

  if (!url) {
    missing.push(
      'NEXT_PUBLIC_SUPABASE_URL or supabaseProjectRef in clients/registry.json for this client',
    )
  }
  if (!anonKey) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY')

  if (url) {
    if (looksPlaceholder(url) || !isValidSupabaseUrl(url)) {
      invalid.push('NEXT_PUBLIC_SUPABASE_URL')
    }
  }
  if (anonKey) {
    if (looksPlaceholder(anonKey) || !isValidJwt(anonKey)) {
      invalid.push('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    }
  }

  const serviceKey = raw('SUPABASE_SERVICE_ROLE_KEY')
  if (serviceKey && (looksPlaceholder(serviceKey) || !isValidJwt(serviceKey))) {
    invalid.push('SUPABASE_SERVICE_ROLE_KEY')
  }

  const client = getActiveClient()

  return {
    ok: missing.length === 0 && invalid.length === 0,
    missing,
    invalid,
    clientId: client?.id,
    clientName: client?.name,
  }
}

export function isSupabaseConfigured(): boolean {
  return validateSupabaseEnv().ok
}

export function getSupabaseEnv(): SupabaseEnv | null {
  const check = validateSupabaseEnv()
  if (!check.ok) return null
  const url = resolveSupabaseUrl()!
  return {
    url,
    anonKey: raw('NEXT_PUBLIC_SUPABASE_ANON_KEY')!,
    serviceRoleKey: raw('SUPABASE_SERVICE_ROLE_KEY'),
  }
}

export function assertSupabaseEnv(): SupabaseEnv {
  const env = getSupabaseEnv()
  if (!env) {
    const v = validateSupabaseEnv()
    const parts = [
      ...v.missing.map((k) => `missing ${k}`),
      ...v.invalid.map((k) => `invalid ${k}`),
    ]
    throw new Error(
      `Database not configured. ${parts.join('; ')}. See clients/registry.json and DEPLOYMENT.md`,
    )
  }
  return env
}

export function setupInstructions(): string[] {
  return [
    'Pick a client: set NEXT_PUBLIC_CLIENT_ID to an id from clients/registry.json',
    'Create a Supabase project for that client; add supabaseProjectRef to the registry entry',
    'Run supabase-schema.sql in that project\'s SQL Editor',
    'In Netlify: set CLIENT_ID + NEXT_PUBLIC_SUPABASE_ANON_KEY (+ SUPABASE_SERVICE_ROLE_KEY)',
    'Redeploy after saving environment variables',
  ]
}
