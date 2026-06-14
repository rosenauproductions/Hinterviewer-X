'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { PortalShell } from '@/components/portal-shell'
import { VideoRecorder } from '@/components/applicant/video-recorder'
import { getSupabaseBrowserClient } from '@/lib/supabase'

interface Question {
  id: number
  text: string
  order_index: number
}

export default function ApplicantRecordPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const supabase = await getSupabaseBrowserClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    setUserId(user.id)

    const [{ data: qs }, { data: vas }] = await Promise.all([
      supabase.from('questions').select('id, text, order_index').eq('active', true).order('order_index'),
      supabase.from('video_answers').select('question_id, video_url, status').eq('applicant_id', user.id),
    ])

    setQuestions(qs || [])

    const answerMap: Record<number, string> = {}
    for (const va of vas || []) {
      if (va.video_url && va.status === 'completed') {
        const { data: signed } = await supabase.storage
          .from('video-answers')
          .createSignedUrl(va.video_url, 3600)
        if (signed?.signedUrl) answerMap[va.question_id] = signed.signedUrl
      }
    }
    setAnswers(answerMap)

    const firstIncomplete = (qs || []).findIndex((q) => !answerMap[q.id])
    setCurrentIndex(firstIncomplete >= 0 ? firstIncomplete : 0)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (loading || !userId) {
    return (
      <PortalShell showBack={{ href: '/applicant/dashboard', label: 'Dashboard' }}>
        <div className="flex justify-center py-20">
          <div className="spinner" />
        </div>
      </PortalShell>
    )
  }

  if (questions.length === 0) {
    return (
      <PortalShell showBack={{ href: '/applicant/dashboard', label: 'Dashboard' }}>
        <p className="portal-glass rounded-2xl p-6 text-center">No active questions yet. Ask your admin to add questions.</p>
      </PortalShell>
    )
  }

  const current = questions[currentIndex]

  return (
    <PortalShell showBack={{ href: '/applicant/dashboard', label: 'Dashboard' }}>
      <div className="mb-6 flex flex-wrap gap-2">
        {questions.map((q, i) => (
          <button
            key={q.id}
            type="button"
            onClick={() => setCurrentIndex(i)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              i === currentIndex ? 'ring-2 ring-white/50' : 'opacity-70'
            }`}
            style={{
              background: answers[q.id]
                ? 'rgba(34,197,94,0.3)'
                : 'rgba(255,255,255,0.15)',
            }}
          >
            Q{i + 1} {answers[q.id] ? '✓' : ''}
          </button>
        ))}
      </div>

      <VideoRecorder
        key={current.id}
        questionId={current.id}
        questionText={current.text}
        userId={userId}
        existingVideoUrl={answers[current.id]}
        onComplete={load}
      />

      <div className="mt-6 flex justify-between">
        <button
          type="button"
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          className="opacity-80 disabled:opacity-30"
        >
          ← Previous
        </button>
        <Link href="/applicant/dashboard" className="underline opacity-80">
          Back to dashboard
        </Link>
        <button
          type="button"
          disabled={currentIndex >= questions.length - 1}
          onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
          className="opacity-80 disabled:opacity-30"
        >
          Next →
        </button>
      </div>
    </PortalShell>
  )
}
