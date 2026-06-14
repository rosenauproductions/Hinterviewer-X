import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { assertSupabaseEnv } from './env'

export async function createClient() {
  const env = assertSupabaseEnv()
  const cookieStore = await cookies()

  return createServerClient(env.url, env.anonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch {
          /* Server Component — middleware refreshes session */
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: '', ...options })
        } catch {
          /* Server Component */
        }
      },
    },
  })
}
