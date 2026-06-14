'use client'

import { Suspense, useEffect, useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase'
import { homePathForRole } from '@/lib/auth-routing'
import { PortalShell } from '@/components/portal-shell'
import { useRouter, useSearchParams } from 'next/navigation'
import { getClientTheme } from '@/lib/theme'
import Link from 'next/link'

function LoginForm() {
  const theme = getClientTheme()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [existing, setExisting] = useState<{ email: string; role: string | null; home: string } | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackError = searchParams.get('error')

  useEffect(() => {
    ;(async () => {
      try {
        const supabase = await getSupabaseBrowserClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user?.email) return
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle()
        setExisting({
          email: user.email,
          role: profile?.role ?? null,
          home: homePathForRole(profile?.role),
        })
      } catch {
        /* ignore */
      }
    })()
  }, [])

  const redirectAfterAuth = async () => {
    const supabase = await getSupabaseBrowserClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setError('Signed in but session not found — try again or check /qa')
      return
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      setError(`Profile error: ${profileError.message}`)
      return
    }

    router.refresh()
    router.push(homePathForRole(profile?.role))
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase = await getSupabaseBrowserClient()
      await supabase.auth.signOut()
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) {
        setError(signInError.message)
        return
      }
      await redirectAfterAuth()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleMagicLink = async () => {
    if (!email) {
      setError('Please enter your email')
      return
    }
    setLoading(true)
    setError('')
    try {
      const supabase = await getSupabaseBrowserClient()
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
      setError(otpError ? otpError.message : 'Check your email for the login link')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto portal-glass rounded-2xl p-8">
      <h2 className="text-2xl font-bold mb-2 text-center" style={{ color: theme.secondaryColor }}>
        Sign In
      </h2>
      <p className="text-center text-sm opacity-80 mb-6">{theme.platformTitle}</p>

      {existing && (
        <div className="mb-4 p-3 rounded-lg bg-amber-500/20 border border-amber-500/40 text-sm">
          <p>
            Already signed in as <strong>{existing.email}</strong> ({existing.role || 'no role'}).
          </p>
          <p className="mt-2 opacity-90">
            To test a <strong>student</strong> account, log out first.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href={existing.home} className="underline">
              Go to dashboard
            </Link>
            <Link href="/auth/logout" className="px-3 py-1 rounded-full border border-white/40 font-medium">
              Log out
            </Link>
          </div>
        </div>
      )}

      {callbackError === 'auth_callback' && (
        <p className="mb-4 text-amber-200 text-sm">
          Email link could not be verified. Try password login or see{' '}
          <a href="/qa" className="underline">/qa</a>.
        </p>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <input
          className="portal-input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="portal-input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="text-red-300 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-full font-semibold disabled:opacity-50"
          style={{
            background: `linear-gradient(to right, ${theme.primaryColor}, ${theme.secondaryColor})`,
            color: theme.backgroundStart,
          }}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <button
        type="button"
        onClick={handleMagicLink}
        disabled={loading}
        className="w-full mt-3 py-3 rounded-full border border-white/30 font-semibold disabled:opacity-50"
      >
        Send Magic Link
      </button>

      <p className="mt-6 text-center text-sm opacity-80">
        No account? <a href="/auth/signup" className="underline">Sign up</a>
        {' · '}
        <a href="/qa" className="underline">QA</a>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <PortalShell showBack={{ href: '/', label: 'Home' }}>
      <Suspense fallback={<div className="spinner mx-auto" />}>
        <LoginForm />
      </Suspense>
    </PortalShell>
  )
}
