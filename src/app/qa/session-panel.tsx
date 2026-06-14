'use client'

import { useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { homePathForRole, isAdminRole } from '@/lib/auth-routing'

export function QaSessionPanel() {
  const [state, setState] = useState<{
    loading: boolean
    email?: string
    role?: string | null
    profileMissing?: boolean
    expectedHome?: string
    error?: string
  }>({ loading: true })

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const supabase = createSupabaseBrowserClient()
        const {
          data: { user },
          error: userErr,
        } = await supabase.auth.getUser()

        if (userErr || !user) {
          if (!cancelled) {
            setState({ loading: false, error: userErr?.message || 'Not signed in' })
          }
          return
        }

        const { data: profile, error: profileErr } = await supabase
          .from('profiles')
          .select('role, full_name')
          .eq('id', user.id)
          .maybeSingle()

        if (!cancelled) {
          setState({
            loading: false,
            email: user.email,
            role: profile?.role ?? null,
            profileMissing: !profile && !profileErr,
            expectedHome: homePathForRole(profile?.role),
            error: profileErr?.message,
          })
        }
      } catch (e) {
        if (!cancelled) {
          setState({
            loading: false,
            error: e instanceof Error ? e.message : 'Session check failed',
          })
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  if (state.loading) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-400">
        Checking your browser session…
      </div>
    )
  }

  if (state.error && !state.email) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 text-sm">
        <p className="font-medium text-zinc-300">Your session</p>
        <p className="mt-1 text-zinc-500">{state.error}</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 text-sm space-y-2">
      <p className="font-medium text-zinc-300">Your session</p>
      <p>
        <span className="text-zinc-500">Email:</span> {state.email}
      </p>
      <p>
        <span className="text-zinc-500">Role:</span>{' '}
        {state.profileMissing ? (
          <span className="text-red-400">missing profiles row</span>
        ) : (
          state.role || 'unknown'
        )}
      </p>
      <p>
        <span className="text-zinc-500">Should land at:</span>{' '}
        <a href={state.expectedHome} className="text-blue-400 hover:underline">
          {state.expectedHome}
        </a>
      </p>
      {isAdminRole(state.role) && (
        <p className="text-emerald-400 text-xs">
          Admin account — use /admin/dashboard after login
        </p>
      )}
      {state.error && <p className="text-amber-400 text-xs">{state.error}</p>}
    </div>
  )
}
