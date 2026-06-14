import Link from 'next/link'
import { listClients } from '@/lib/clients'
import { setupInstructions, validateSupabaseEnv } from '@/lib/env'

export const dynamic = 'force-dynamic'

export default function SetupPage() {
  const validation = validateSupabaseEnv()
  const roster = listClients()

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-6">
      <div className="max-w-lg w-full space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Setup required</h1>
          <p className="mt-2 text-zinc-400 text-sm leading-relaxed">
            One git repo, many clients. Pick this site&apos;s client in Netlify env vars
            and connect its Supabase database.
          </p>
        </div>

        {validation.clientName && (
          <p className="text-sm text-zinc-300">
            Site client: <strong>{validation.clientName}</strong>
            {validation.clientId ? ` (${validation.clientId})` : ''}
          </p>
        )}

        {(validation.missing.length > 0 || validation.invalid.length > 0) && (
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
            {validation.missing.length > 0 && (
              <p>
                <strong className="text-amber-200">Missing:</strong>{' '}
                {validation.missing.join(', ')}
              </p>
            )}
            {validation.invalid.length > 0 && (
              <p className="mt-1">
                <strong className="text-amber-200">Invalid:</strong>{' '}
                {validation.invalid.join(', ')}
              </p>
            )}
          </div>
        )}

        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 text-sm">
          <p className="text-zinc-400 mb-2 font-medium">Clients in registry (git)</p>
          <ul className="space-y-2">
            {roster.map((c) => (
              <li key={c.id} className="text-zinc-300">
                <code className="text-blue-300">{c.id}</code> — {c.name}
                {c.netlifySiteHint && (
                  <span className="text-zinc-500 text-xs block">
                    Netlify hint: {c.netlifySiteHint}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>

        <ol className="list-decimal list-inside space-y-2 text-sm text-zinc-300">
          {setupInstructions().map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>

        <p className="text-sm text-zinc-500">
          After configuring, check{' '}
          <Link href="/api/health" className="text-blue-400 hover:underline">
            /api/health
          </Link>
        </p>
      </div>
    </div>
  )
}
