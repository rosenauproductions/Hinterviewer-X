import Link from 'next/link'
import { headers } from 'next/headers'
import { runQaChecks } from '@/lib/qa'
import { QaSessionPanel } from './session-panel'

export const dynamic = 'force-dynamic'

const STATUS_STYLES = {
  ok: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200',
  warn: 'border-amber-500/40 bg-amber-500/10 text-amber-200',
  fail: 'border-red-500/40 bg-red-500/10 text-red-200',
  info: 'border-blue-500/40 bg-blue-500/10 text-blue-200',
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
  const report = await runQaChecks(origin)

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">QA Diagnostics</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Deployment health checks — also available as{' '}
            <Link href="/api/qa" className="text-blue-400 hover:underline">
              /api/qa
            </Link>
          </p>
        </div>

        {params.issue === 'missing_profile' && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
            <strong>Login blocked:</strong> your account has no <code>profiles</code> row.
            Run <code>supabase-schema.sql</code> (handle_new_user trigger) or insert a profile
            manually in Supabase Table Editor.
          </div>
        )}

        <div className="flex gap-3 text-sm">
          <span className="text-emerald-400">{report.summary.ok} ok</span>
          <span className="text-amber-400">{report.summary.warn} warn</span>
          <span className="text-red-400">{report.summary.fail} fail</span>
          <span className="text-blue-400">{report.summary.info} info</span>
        </div>

        <ul className="space-y-3">
          {report.checks.map((check) => (
            <li
              key={check.id}
              className={`rounded-lg border p-4 text-sm ${STATUS_STYLES[check.status]}`}
            >
              <div className="flex justify-between gap-2">
                <span className="font-medium">{check.label}</span>
                <span className="uppercase text-xs opacity-70">{check.status}</span>
              </div>
              <p className="mt-1 opacity-90">{check.detail}</p>
              {check.hint && (
                <p className="mt-2 text-xs opacity-75">
                  <strong>Hint:</strong> {check.hint}
                </p>
              )}
            </li>
          ))}
        </ul>

        <QaSessionPanel />

        <p className="text-xs text-zinc-500">
          Generated {new Date(report.generatedAt).toLocaleString()}
        </p>
      </div>
    </div>
  )
}
