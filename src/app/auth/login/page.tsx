'use client'

import { Suspense, useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase'
import { homePathForRole } from '@/lib/auth-routing'
import { PortalShell } from '@/components/portal-shell'
import { useRouter, useSearchParams } from 'next/navigation'
import { getClientTheme } from '@/lib/theme'

function LoginForm() {
  const theme = getClientTheme()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackError = searchParams.get('error')

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
