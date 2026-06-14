'use client'

import { useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase'
import { homePathForRole } from '@/lib/auth-routing'
import { PortalShell } from '@/components/portal-shell'
import { useRouter } from 'next/navigation'
import { getClientTheme } from '@/lib/theme'

export default function SignupPage() {
  const theme = getClientTheme()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const supabase = await getSupabaseBrowserClient()
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (signUpError) {
        setError(signUpError.message)
        return
      }

      if (!data.user) {
        setError('Signup did not return a user — check /qa')
        return
      }

      if (data.user.email_confirmed_at || data.session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .maybeSingle()
        router.refresh()
        router.push(homePathForRole(profile?.role))
        return
      }

      setSuccess(
        'Account created. Check your email to confirm, then sign in. (Or disable email confirm in Supabase Auth for dev.)',
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PortalShell showBack={{ href: '/', label: 'Home' }}>
      <div className="max-w-md mx-auto portal-glass rounded-2xl p-8">
        <h2 className="text-2xl font-bold mb-2 text-center" style={{ color: theme.secondaryColor }}>
          Create Account
        </h2>
        <p className="text-center text-sm opacity-80 mb-6">Student / applicant signup</p>

        <form onSubmit={handleSignup} className="space-y-4">
          <input
            className="portal-input"
            type="text"
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
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
            placeholder="Password (6+ chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          {error && <p className="text-red-300 text-sm">{error}</p>}
          {success && <p className="text-emerald-300 text-sm">{success}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-full font-semibold disabled:opacity-50"
            style={{
              background: `linear-gradient(to right, ${theme.primaryColor}, ${theme.secondaryColor})`,
              color: theme.backgroundStart,
            }}
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm opacity-80">
          Have an account? <a href="/auth/login" className="underline">Sign in</a>
        </p>
      </div>
    </PortalShell>
  )
}
