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
            className="inline-flex h-11 items-center justify-center rounded-lg bg-zinc-900 px-6 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Sign in
          </Link>
          <Link
            href="/auth/signup"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-zinc-300 px-6 text-sm font-medium text-zinc-900 hover:bg-zinc-100"
          >
            Create account
          </Link>
        </div>
      </main>
    </div>
  )
}
