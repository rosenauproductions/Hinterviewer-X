import { PortalButton, PortalCard, PortalShell } from '@/components/portal-shell'
import { getClientTheme } from '@/lib/theme'

export const dynamic = 'force-dynamic'

export default function Home() {
  const theme = getClientTheme()

  return (
    <PortalShell>
      <div className="text-center portal-glass mb-10 rounded-3xl p-8 md:p-10">
        <h1 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: theme.primaryColor }}>
          {theme.platformTitle}
        </h1>
        <p className="text-lg md:text-xl opacity-90" style={{ color: theme.accentColor }}>
          {theme.platformSubtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <PortalCard
          title="Student Portal"
          description="Record video answers to interview questions and build your video resume."
          icon={
            <svg className="w-8 h-8" fill={theme.backgroundStart} viewBox="0 0 20 20">
              <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
            </svg>
          }
        >
          <PortalButton href="/auth/login">Student Sign In</PortalButton>
          <PortalButton href="/auth/signup" variant="secondary">
            Create Account
          </PortalButton>
        </PortalCard>

        <PortalCard
          title="Admin Portal"
          description="Manage students, questions, and review submitted video answers."
          icon={
            <svg className="w-8 h-8" fill={theme.backgroundStart} viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                clipRule="evenodd"
              />
            </svg>
          }
        >
          <PortalButton href="/auth/login">Admin Sign In</PortalButton>
          <p className="text-xs opacity-70 mt-3">Admin accounts are created in Supabase Auth</p>
        </PortalCard>
      </div>

      <p className="text-center text-xs opacity-60 mt-10">
        <a href="/qa" className="underline hover:opacity-100">
          QA diagnostics
        </a>
        {' · '}
        <a href="/api/health" className="underline hover:opacity-100">
          API health
        </a>
      </p>
    </PortalShell>
  )
}
