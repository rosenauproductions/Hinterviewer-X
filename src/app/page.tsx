import Link from 'next/link'
import { redirect } from 'next/navigation'
import { isSupabaseConfigured } from '@/lib/env'
import { config } from '@/lib/config'

export const dynamic = 'force-dynamic'

export default function Home() {
  if (!isSupabaseConfigured()) {
    redirect('/setup')
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-8">
      <main className="max-w-md w-full text-center space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          {config.client.name}
        </h1>
        <p className="text-zinc-600">
          Video resume platform — record answers, share your story with employers.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/auth/login"
            className="inline-flex h-11 items-center justify-center rounded-lg px-6 text-sm font-medium text-white hover:opacity-90"
            style={{ backgroundColor: config.client.primaryColor }}
          >
            Sign in
          </Link>
          <Link
            href="/auth/signup"
            className="inline-flex h-11 items-center justify-center rounded-lg border px-6 text-sm font-medium hover:bg-zinc-100"
            style={{
              borderColor: config.client.secondaryColor,
              color: config.client.primaryColor,
            }}
          >
            Create account
          </Link>
        </div>
        <p className="text-xs text-zinc-500">
          <Link href="/qa" className="hover:underline" style={{ color: config.client.primaryColor }}>
            QA diagnostics
          </Link>
          {' · '}
          <Link href="/api/health" className="hover:underline" style={{ color: config.client.primaryColor }}>
            API health
          </Link>
        </p>
      </main>
    </div>
  )
}
