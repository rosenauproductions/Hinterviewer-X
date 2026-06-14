import { redirect } from 'next/navigation'
import { AdminDashboardClient } from '@/components/admin/admin-dashboard-client'
import { isAdminRole } from '@/lib/auth-routing'
import { createClient } from '@/lib/supabase-server'

export default async function AdminDashboard() {
  const supabase = await createClient()
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
  if (!isAdminRole(profile.role)) redirect('/applicant/dashboard')

  const { count: applicantCount } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'applicant')

  const { count: questionCount } = await supabase
    .from('questions')
    .select('id', { count: 'exact', head: true })

  const { count: answerCount } = await supabase
    .from('video_answers')
    .select('id', { count: 'exact', head: true })

  return (
    <AdminDashboardClient
      profileName={profile.full_name || user.email || 'Admin'}
      profileRole={profile.role}
      applicantCount={applicantCount ?? 0}
      questionCount={questionCount ?? 0}
      answerCount={answerCount ?? 0}
    />
  )
}
