'use client'

import { useEffect, useState } from 'react'

interface Question {
  id: number
  text: string
  order_index: number
  active: boolean
}

export function AdminQuestionsPanel() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newText, setNewText] = useState('')

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/admin/questions')
    const data = await res.json()
    if (!res.ok) setError(data.error || 'Failed to load')
    else setQuestions(data.questions || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const addQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newText.trim()) return
    const res = await fetch('/api/admin/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: newText }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Add failed')
      return
    }
    setNewText('')
    load()
  }

  const toggleActive = async (q: Question) => {
    await fetch('/api/admin/questions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: q.id, active: !q.active }),
    })
    load()
  }

  const move = async (q: Question, dir: -1 | 1) => {
    const idx = questions.findIndex((x) => x.id === q.id)
    const swap = questions[idx + dir]
    if (!swap) return
    await Promise.all([
      fetch('/api/admin/questions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: q.id, order_index: swap.order_index }),
      }),
      fetch('/api/admin/questions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: swap.id, order_index: q.order_index }),
      }),
    ])
    load()
  }

  const deleteQuestion = async (id: number) => {
    if (!confirm('Delete this question?')) return
    const res = await fetch(`/api/admin/questions?id=${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Delete failed')
    }
    load()
  }

  return (
    <div className="space-y-6">
      {error && <p className="text-red-300 text-sm">{error}</p>}

      <form onSubmit={addQuestion} className="portal-glass rounded-2xl p-4 flex gap-2">
        <input
          className="portal-input flex-1"
          placeholder="New question text"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-lg font-semibold shrink-0"
          style={{
            background: 'linear-gradient(to right, var(--client-primary), var(--client-secondary))',
            color: 'var(--client-bg-start)',
          }}
        >
          Add
        </button>
      </form>

      <div className="portal-glass rounded-2xl p-4">
        <h3 className="font-semibold mb-3">Questions ({questions.length})</h3>
        {loading ? (
          <div className="spinner mx-auto" />
        ) : (
          <ul className="space-y-2">
            {questions.map((q, i) => (
              <li
                key={q.id}
                className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-white/5 text-sm"
              >
                <span className="opacity-60 w-6">{i + 1}.</span>
                <span className="flex-1 min-w-[200px]">{q.text}</span>
                <button type="button" onClick={() => move(q, -1)} disabled={i === 0} className="opacity-70 disabled:opacity-30">
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(q, 1)}
                  disabled={i === questions.length - 1}
                  className="opacity-70 disabled:opacity-30"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => toggleActive(q)}
                  className={`px-2 py-1 rounded text-xs ${q.active ? 'bg-green-500/30' : 'bg-red-500/30'}`}
                >
                  {q.active ? 'active' : 'inactive'}
                </button>
                <button
                  type="button"
                  onClick={() => deleteQuestion(q.id)}
                  className="text-red-300 text-xs hover:underline"
                >
                  delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
