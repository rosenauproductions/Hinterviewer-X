'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PortalShell } from '@/components/portal-shell'
import { AdminUsersPanel } from '@/components/admin/users-panel'
import { AdminQuestionsPanel } from '@/components/admin/questions-panel'
import { getClientTheme } from '@/lib/theme'

export function AdminDashboardClient({
  profileName,
  profileRole,
  applicantCount,
  questionCount,
  answerCount,
}: {
  profileName: string
  profileRole: string
  applicantCount: number
  questionCount: number
  answerCount: number
}) {
  const [tab, setTab] = useState<'overview' | 'users' | 'questions'>('overview')
  const theme = getClientTheme()

  return (
    <PortalShell showBack={{ href: '/', label: 'Home' }}>
      <div className="portal-glass rounded-3xl p-6 mb-6 flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: theme.secondaryColor }}>
            Admin — {theme.platformTitle}
          </h1>
          <p className="text-sm opacity-80">
            {profileName} ({profileRole})
          </p>
        </div>
        <div className="flex gap-3 text-sm">
          <Link href="/qa" className="underline opacity-80">
            QA
          </Link>
          <Link href="/api/health" className="underline opacity-80">
            Health
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {(['overview', 'users', 'questions'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full text-sm font-medium capitalize ${
              tab === t ? 'ring-2 ring-white/40' : 'opacity-70'
            }`}
            style={{ background: tab === t ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)' }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="portal-glass rounded-2xl p-4">
            <p className="text-sm opacity-70">Applicants</p>
            <p className="text-3xl font-bold">{applicantCount}</p>
          </div>
          <div className="portal-glass rounded-2xl p-4">
            <p className="text-sm opacity-70">Questions</p>
            <p className="text-3xl font-bold">{questionCount}</p>
          </div>
          <div className="portal-glass rounded-2xl p-4">
            <p className="text-sm opacity-70">Video answers</p>
            <p className="text-3xl font-bold">{answerCount}</p>
          </div>
          <p className="sm:col-span-3 text-sm opacity-70 portal-glass rounded-2xl p-4">
            Users are managed via real Supabase Auth (no fake password table). Run{' '}
            <code className="text-xs bg-black/30 px-1 rounded">supabase-storage-setup.sql</code> once
            so applicants can upload recordings.
          </p>
        </div>
      )}

      {tab === 'users' && <AdminUsersPanel />}
      {tab === 'questions' && <AdminQuestionsPanel />}
    </PortalShell>
  )
}
