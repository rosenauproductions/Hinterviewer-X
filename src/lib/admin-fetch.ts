import { getSupabaseBrowserClient } from '@/lib/supabase'

/** Admin API fetch with session bearer token (fixes Netlify cookie → API auth). */
export async function adminFetch(input: string, init?: RequestInit) {
  const supabase = await getSupabaseBrowserClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const headers = new Headers(init?.headers)
  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`)
  }
  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  return fetch(input, {
    ...init,
    credentials: 'include',
    headers,
  })
}
