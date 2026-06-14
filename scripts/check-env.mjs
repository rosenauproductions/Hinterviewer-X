#!/usr/bin/env node
/**
 * Fails the build if client + Supabase are not configured.
 * Reads clients/registry.json for client id + optional supabaseProjectRef.
 */

import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

/** Load KEY=value from .env.local or config/deployment.env (npm scripts don't auto-load these). */
function loadEnvFile(relPath) {
  try {
    const text = readFileSync(join(root, relPath), 'utf8')
    for (const line of text.split('\n')) {
      const t = line.trim()
      if (!t || t.startsWith('#')) continue
      const eq = t.indexOf('=')
      if (eq < 0) continue
      const key = t.slice(0, eq).trim()
      let val = t.slice(eq + 1).trim()
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1)
      }
      if (!process.env[key]) process.env[key] = val
    }
  } catch {
    /* file optional */
  }
}

loadEnvFile('.env.local')
loadEnvFile('config/deployment.env')

const registry = JSON.parse(
  readFileSync(join(root, 'clients/registry.json'), 'utf8'),
)

const PLACEHOLDER_MARKERS = [
  'your-supabase',
  'your-anon',
  'paste_full',
  'from_supabase',
  'your-project',
  'your-service-role',
  'placeholder',
  'changeme',
  'example.supabase.co',
]

function raw(name) {
  const v = process.env[name]?.trim()
  return v && v.length > 0 ? v : undefined
}

function looksPlaceholder(value) {
  const lower = value.toLowerCase()
  return PLACEHOLDER_MARKERS.some((m) => lower.includes(m))
}

function isValidUrl(url) {
  try {
    const u = new URL(url)
    return u.protocol === 'https:' && u.hostname.endsWith('.supabase.co')
  } catch {
    return false
  }
}

function isValidJwt(key) {
  return key.startsWith('eyJ') && key.split('.').length === 3
}

const clientId = raw('NEXT_PUBLIC_CLIENT_ID')
const client = registry.clients.find((c) => c.id === clientId)
const errors = []

if (!clientId) errors.push('NEXT_PUBLIC_CLIENT_ID is not set (pick from clients/registry.json)')
else if (!client) errors.push(`NEXT_PUBLIC_CLIENT_ID "${clientId}" is not in clients/registry.json`)

let url = raw('NEXT_PUBLIC_SUPABASE_URL')
if (!url && client?.supabaseProjectRef?.trim()) {
  url = `https://${client.supabaseProjectRef.trim()}.supabase.co`
}

const anonKey = raw('NEXT_PUBLIC_SUPABASE_ANON_KEY')

if (!url) {
  errors.push(
    'NEXT_PUBLIC_SUPABASE_URL or supabaseProjectRef in registry for this client',
  )
} else if (looksPlaceholder(url) || !isValidUrl(url)) {
  errors.push('Supabase URL is invalid')
}

if (!anonKey) errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set')
else if (anonKey.includes('...')) {
  errors.push(
    'NEXT_PUBLIC_SUPABASE_ANON_KEY looks truncated (still has "..." from the example file — paste the full key from Supabase → Settings → API → anon public)',
  )
} else if (anonKey.startsWith('sb_')) {
  errors.push(
    'NEXT_PUBLIC_SUPABASE_ANON_KEY must be the legacy JWT anon key (starts with eyJ), not the new sb_publishable_ key',
  )
} else if (looksPlaceholder(anonKey) || !isValidJwt(anonKey)) {
  errors.push(
    'NEXT_PUBLIC_SUPABASE_ANON_KEY is not a valid JWT anon key (copy the full eyJ... value from Supabase → Settings → API)',
  )
}

if (errors.length > 0) {
  console.error('\n❌ Hinterviewer-X: client + database configuration required.\n')
  for (const e of errors) console.error(`   • ${e}`)
  console.error('\n   Registry: clients/registry.json')
  console.error('   Netlify: set NEXT_PUBLIC_CLIENT_ID + keys per site')
  console.error('   See DEPLOYMENT.md\n')
  process.exit(1)
}

console.log(`✓ Client "${client.name}" (${clientId}) + Supabase configured`)
