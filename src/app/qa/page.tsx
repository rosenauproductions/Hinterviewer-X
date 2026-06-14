import Link from 'next/link'
import { headers } from 'next/headers'
import { runSuperQaChecks } from '@/lib/qa-super'
import { SuperQaConsole } from './super-qa-console'

export const dynamic = 'force-dynamic'

const STATUS_STYLES = {
  done: 'bg-emerald-500/20 text-emerald-200',
  partial: 'bg-amber-500/20 text-amber-200',
  missing: 'bg-red-500/20 text-red-200',
} as const

export default async function QaPage({
  searchParams,
}: {
  searchParams: Promise<{ issue?: string }>
}) {
  const params = await searchParams
  const h = await headers()
  const host = h.get('x-forwarded-host') || h.get('host')
  const proto = h.get('x-forwarded-proto') || 'https'
  const origin = host ? `${proto}://${host}` : undefined
  const report = await runSuperQaChecks(origin)

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold">Super QA Diagnostics</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Copy the full dump below and paste into support/chat. API:{' '}
            <Link href="/api/qa/super" className="text-blue-400 hover:underline">
              /api/qa/super
            </Link>
          </p>
        </div>

        {params.issue === 'missing_profile' && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
            <strong>Login blocked:</strong> no <code>profiles</code> row for this auth user.
          </div>
        )}

        {report.hints.length > 0 && (
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm space-y-1">
            {report.hints.map((hint) => (
              <p key={hint}>• {hint}</p>
            ))}
          </div>
        )}

        <div className="grid sm:grid-cols-4 gap-2 text-sm text-center">
          <div className="rounded-lg bg-emerald-500/10 p-3">{report.summary.ok} ok</div>
          <div className="rounded-lg bg-amber-500/10 p-3">{report.summary.warn} warn</div>
          <div className="rounded-lg bg-red-500/10 p-3">{report.summary.fail} fail</div>
          <div className="rounded-lg bg-blue-500/10 p-3">{report.summary.info} info</div>
        </div>

        <section className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <h2 className="font-semibold mb-3">Server session (cookie)</h2>
          <pre className="text-xs overflow-x-auto text-zinc-300">
            {JSON.stringify(report.serverSession, null, 2)}
          </pre>
        </section>

        <section className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <h2 className="font-semibold mb-3">Feature matrix (vs v78 legacy)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left border-b border-zinc-700">
                  <th className="p-2">Feature</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Notes</th>
                </tr>
              </thead>
              <tbody>
                {report.featureMatrix.map((f) => (
                  <tr key={f.id} className="border-b border-zinc-800">
                    <td className="p-2 font-medium">
                      {f.route ? (
                        <Link href={f.route} className="underline hover:text-blue-300">
                          {f.name}
                        </Link>
                      ) : (
                        f.name
                      )}
                    </td>
                    <td className="p-2">
                      <span className={`px-2 py-0.5 rounded ${STATUS_STYLES[f.status]}`}>
                        {f.status}
                      </span>
                    </td>
                    <td className="p-2 text-zinc-400">{f.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <h2 className="font-semibold mb-3">Quick checks</h2>
          <ul className="space-y-2 text-sm">
            {report.checks.map((c) => (
              <li key={c.id} className="flex gap-2">
                <span className="uppercase text-xs w-10 shrink-0 opacity-60">{c.status}</span>
                <span>
                  <strong>{c.label}:</strong> {c.detail}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
          <h2 className="font-semibold mb-2 text-emerald-200">Copy-paste dump</h2>
          <p className="text-xs text-zinc-400 mb-4">
            Merges server + browser session + your notes. Click Copy everything and paste into chat.
          </p>
          <SuperQaConsole />
        </section>

        <p className="text-xs text-zinc-500 text-center">
          <Link href="/" className="underline">
            Home
          </Link>
          {' · '}
          <Link href="/auth/logout" className="underline">
            Log out
          </Link>
          {' · '}
          Generated {new Date(report.generatedAt).toLocaleString()}
        </p>
      </div>
    </div>
  )
}
