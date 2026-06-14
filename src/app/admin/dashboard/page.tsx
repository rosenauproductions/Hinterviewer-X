import Link from 'next/link'
import { redirect } from 'next/navigation'
import { isAdminRole } from '@/lib/auth-routing'
import { createClient } from '@/lib/supabase-server'
import { config } from '@/lib/config'

export default async function AdminDashboard() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) {
    redirect('/qa?issue=missing_profile')
  }

  if (!isAdminRole(profile.role)) {
    redirect('/applicant/dashboard')
  }

  const { count: applicantCount } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'applicant')

  const { count: questionCount } = await supabase
    .from('questions')
    .select('id', { count: 'exact', head: true })

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900">
              {config.client.name} — Admin
            </h1>
            <p className="text-sm text-zinc-500">
              Signed in as {profile.full_name || user.email} ({profile.role})
            </p>
          </div>
          <div className="flex gap-3 text-sm">
            <Link href="/qa" className="text-blue-600 hover:underline">
              QA
            </Link>
            <Link href="/api/health" className="text-blue-600 hover:underline">
              Health
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-lg border bg-white p-4">
            <p className="text-sm text-zinc-500">Applicants</p>
            <p className="text-2xl font-semibold">{applicantCount ?? 0}</p>
          </div>
          <div className="rounded-lg border bg-white p-4">
            <p className="text-sm text-zinc-500">Questions</p>
            <p className="text-2xl font-semibold">{questionCount ?? 0}</p>
          </div>
          <div className="rounded-lg border bg-white p-4">
            <p className="text-sm text-zinc-500">Your role</p>
            <p className="text-2xl font-semibold">{profile.role}</p>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-4 text-sm text-zinc-600">
          Admin tools (question editor, user management, campaigns) are coming next.
          For now use Supabase Table Editor + SQL for data changes.
        </div>
      </main>
    </div>
  )
}
