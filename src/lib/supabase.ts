import { createBrowserClient } from '@supabase/ssr'
import { assertSupabaseEnv } from './env'

export function createSupabaseBrowserClient() {
  const env = assertSupabaseEnv()
  return createBrowserClient(env.url, env.anonKey)
}
