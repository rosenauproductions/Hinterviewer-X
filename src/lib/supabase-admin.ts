import { createClient } from '@supabase/supabase-js'
import { assertSupabaseEnv } from './env'

/** Server-only Supabase client with service role — never expose to browser. */
export function createServiceClient() {
  const env = assertSupabaseEnv()
  if (!env.serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin operations')
  }
  return createClient(env.url, env.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
