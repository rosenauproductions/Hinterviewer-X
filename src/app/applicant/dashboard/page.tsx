import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export default async function ApplicantDashboard() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'applicant') {
    redirect('/auth/login')
  }

  const { data: questions } = await supabase
    .from('questions')
    .select('*')
    .eq('active', true)
    .order('order_index')

  const { data: videoAnswers } = await supabase
    .from('video_answers')
    .select('question_id, status')
    .eq('applicant_id', user.id)

  const answersMap = new Map(videoAnswers?.map(a => [a.question_id, a.status]) || [])

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Applicant Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Profile</h2>
          <div className="space-y-2">
            <p><strong>Name:</strong> {profile.full_name || 'Not set'}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Bio:</strong> {profile.bio || 'Not set'}</p>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Questions</h2>
          <div className="space-y-2">
            {questions?.map((question) => (
              <div key={question.id} className="flex justify-between items-center p-2 border rounded">
                <span>{question.text}</span>
                <span className={`px-2 py-1 rounded text-sm ${
                  answersMap.get(question.id) === 'completed' ? 'bg-green-100 text-green-800' :
                  answersMap.get(question.id) === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {answersMap.get(question.id) || 'Not started'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
