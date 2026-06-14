import Link from 'next/link'
import { redirect } from 'next/navigation'
import { PortalButton, PortalShell } from '@/components/portal-shell'
import { isAdminRole } from '@/lib/auth-routing'
import { createClient } from '@/lib/supabase-server'
import { getClientTheme } from '@/lib/theme'

export default async function ApplicantDashboard() {
  const supabase = await createClient()
  const theme = getClientTheme()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) redirect('/qa?issue=missing_profile')
  if (isAdminRole(profile.role)) redirect('/admin/dashboard')

  const { data: questions } = await supabase
    .from('questions')
    .select('id, text, order_index')
    .eq('active', true)
    .order('order_index')

  const { data: videoAnswers } = await supabase
    .from('video_answers')
    .select('question_id, status')
    .eq('applicant_id', user.id)

  const answersMap = new Map(videoAnswers?.map((a) => [a.question_id, a.status]) || [])
  const completed = videoAnswers?.filter((a) => a.status === 'completed').length || 0
  const total = questions?.length || 0

  return (
    <PortalShell showBack={{ href: '/', label: 'Home' }}>
      <div className="portal-glass rounded-3xl p-6 md:p-8 mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: theme.secondaryColor }}>
          Welcome, {profile.full_name || user.email}
        </h1>
        <p className="opacity-80 text-sm">
          {completed} of {total} video answers completed
        </p>
        <div className="mt-4">
          <PortalButton href="/applicant/record">Record video answers</PortalButton>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="portal-glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4" style={{ color: theme.secondaryColor }}>
            Your profile
          </h2>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="opacity-60">Name</dt>
              <dd>{profile.full_name || 'Not set'}</dd>
            </div>
            <div>
              <dt className="opacity-60">Email</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt className="opacity-60">Bio</dt>
              <dd>{profile.bio || 'Not set'}</dd>
            </div>
          </dl>
        </div>

        <div className="portal-glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4" style={{ color: theme.secondaryColor }}>
            Questions
          </h2>
          <ul className="space-y-2 text-sm">
            {questions?.map((q, i) => (
              <li
                key={q.id}
                className="flex justify-between gap-2 p-2 rounded-lg bg-white/5"
              >
                <span>
                  {i + 1}. {q.text}
                </span>
                <span
                  className={`shrink-0 px-2 py-0.5 rounded text-xs ${
                    answersMap.get(q.id) === 'completed'
                      ? 'bg-green-500/30 text-green-200'
                      : 'bg-white/10'
                  }`}
                >
                  {answersMap.get(q.id) || 'not started'}
                </span>
              </li>
            ))}
          </ul>
          <Link href="/applicant/record" className="inline-block mt-4 text-sm underline opacity-80">
            Go to recording studio →
          </Link>
        </div>
      </div>
    </PortalShell>
  )
}
