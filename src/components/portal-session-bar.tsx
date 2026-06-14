'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getSupabaseBrowserClient } from '@/lib/supabase'
import { homePathForRole } from '@/lib/auth-routing'

export function PortalSessionBar() {
  const [session, setSession] = useState<{
    email?: string
    role?: string | null
    home?: string
  } | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const supabase = await getSupabaseBrowserClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          if (!cancelled) setSession(null)
          return
        }
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle()
        if (!cancelled) {
          setSession({
            email: user.email,
            role: profile?.role ?? null,
            home: homePathForRole(profile?.role),
          })
        }
      } catch {
        if (!cancelled) setSession(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (!session?.email) return null

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="opacity-70 hidden sm:inline">
        {session.email} ({session.role || 'no role'})
      </span>
      {session.home && (
        <Link href={session.home} className="underline opacity-80 hover:opacity-100">
          Dashboard
        </Link>
      )}
      <Link
        href="/auth/logout"
        className="px-3 py-1 rounded-full border border-white/30 hover:bg-white/10 font-medium"
      >
        Log out
      </Link>
    </div>
  )
}
