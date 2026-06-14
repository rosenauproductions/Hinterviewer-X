'use client'

import { useCallback, useEffect, useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase'
import { homePathForRole } from '@/lib/auth-routing'

export function SuperQaConsole() {
  const [dump, setDump] = useState('')
  const [userNotes, setUserNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  const buildDump = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const clientDiagnostics: Record<string, unknown> = {
        collectedAt: new Date().toISOString(),
        location: typeof window !== 'undefined' ? window.location.href : '',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        viewport:
          typeof window !== 'undefined'
            ? { width: window.innerWidth, height: window.innerHeight }
            : null,
        cookiesEnabled: typeof navigator !== 'undefined' ? navigator.cookieEnabled : null,
        online: typeof navigator !== 'undefined' ? navigator.onLine : null,
      }

      try {
        const supabase = await getSupabaseBrowserClient()
        const {
          data: { user },
          error: userErr,
        } = await supabase.auth.getUser()
        clientDiagnostics.auth = userErr
          ? { error: userErr.message }
          : user
            ? {
                id: user.id,
                email: user.email,
                emailConfirmed: Boolean(user.email_confirmed_at),
                lastSignIn: user.last_sign_in_at,
              }
            : { signedIn: false }

        if (user) {
          const { data: profile, error: pErr } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle()
          clientDiagnostics.profile = pErr ? { error: pErr.message } : profile
          clientDiagnostics.expectedHome = homePathForRole(profile?.role)
        }

        const cfgRes = await fetch('/api/public-config', { cache: 'no-store' })
        clientDiagnostics.publicConfig = {
          status: cfgRes.status,
          body: await cfgRes.json(),
        }

        const healthRes = await fetch('/api/health', { cache: 'no-store' })
        clientDiagnostics.health = {
          status: healthRes.status,
          body: await healthRes.json(),
        }

        const { data: questions, error: qErr } = await supabase
          .from('questions')
          .select('id, text, active, order_index')
          .order('order_index')
        clientDiagnostics.questionsProbe = qErr ? { error: qErr.message } : questions

        if (user) {
          const { data: answers, error: aErr } = await supabase
            .from('video_answers')
            .select('id, question_id, status, video_url')
            .eq('applicant_id', user.id)
          clientDiagnostics.videoAnswersProbe = aErr ? { error: aErr.message } : answers

          const bucketProbe = await supabase.storage.from('video-answers').list(user.id, { limit: 5 })
          clientDiagnostics.storageProbe = bucketProbe.error
            ? { error: bucketProbe.error.message }
            : { files: bucketProbe.data?.length ?? 0, sample: bucketProbe.data }
        }
      } catch (e) {
        clientDiagnostics.clientError = e instanceof Error ? e.message : String(e)
      }

      const res = await fetch('/api/qa/super', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientDiagnostics,
          userNotes: userNotes.trim() || undefined,
        }),
      })
      const json = await res.json()
      setDump(JSON.stringify(json, null, 2))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to build QA dump')
    } finally {
      setLoading(false)
    }
  }, [userNotes])

  useEffect(() => {
    buildDump()
  }, [buildDump])

  const copyAll = async () => {
    await navigator.clipboard.writeText(dump)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={buildDump}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-sm font-semibold disabled:opacity-50"
        >
          {loading ? 'Refreshing…' : 'Refresh dump'}
        </button>
        <button
          type="button"
          onClick={copyAll}
          disabled={!dump}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-semibold disabled:opacity-50"
        >
          {copied ? 'Copied!' : 'Copy everything'}
        </button>
        <a
          href="/auth/logout"
          className="px-4 py-2 rounded-lg border border-white/30 text-sm font-semibold hover:bg-white/10"
        >
          Log out (switch account)
        </a>
      </div>

      <div>
        <label className="text-xs text-zinc-400 block mb-1">
          Your notes (included in dump on refresh)
        </label>
        <textarea
          className="w-full h-20 bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-sm text-zinc-200"
          placeholder="Paste errors, steps to reproduce, what you expected…"
          value={userNotes}
          onChange={(e) => setUserNotes(e.target.value)}
        />
      </div>

      {error && <p className="text-red-300 text-sm">{error}</p>}

      <div>
        <label className="text-xs text-zinc-400 block mb-1">
          Full diagnostic dump — copy and paste into chat
        </label>
        <textarea
          readOnly
          className="w-full h-[480px] bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-xs font-mono text-zinc-300"
          value={dump}
          onClick={(e) => (e.target as HTMLTextAreaElement).select()}
        />
      </div>
    </div>
  )
}
