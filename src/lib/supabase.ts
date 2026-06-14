import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface PublicSupabaseConfig {
  url: string
  anonKey: string
  clientId?: string
  clientName?: string
}

let cachedConfig: PublicSupabaseConfig | null = null
let configPromise: Promise<PublicSupabaseConfig> | null = null
let cachedClient: SupabaseClient | null = null

async function fetchPublicConfig(): Promise<PublicSupabaseConfig> {
  const res = await fetch('/api/public-config', { cache: 'no-store' })
  const body = await res.json()
  if (!res.ok) {
    const detail = body.missing?.length
      ? `missing ${body.missing.join(', ')}`
      : body.error || res.statusText
    throw new Error(`Database not configured. ${detail}. See /qa and DEPLOYMENT.md`)
  }
  return body as PublicSupabaseConfig
}

export async function loadPublicSupabaseConfig(): Promise<PublicSupabaseConfig> {
  if (cachedConfig) return cachedConfig
  if (!configPromise) {
    configPromise = fetchPublicConfig().then((cfg) => {
      cachedConfig = cfg
      return cfg
    })
  }
  return configPromise
}

/** Browser Supabase client — loads config from /api/public-config at runtime (Netlify-safe). */
export async function getSupabaseBrowserClient() {
  if (cachedClient) return cachedClient
  const cfg = await loadPublicSupabaseConfig()
  cachedClient = createBrowserClient(cfg.url, cfg.anonKey)
  return cachedClient
}
