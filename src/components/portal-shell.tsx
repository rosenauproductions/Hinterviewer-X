import Link from 'next/link'
import Image from 'next/image'
import { getClientTheme, themeGradient } from '@/lib/theme'

interface PortalShellProps {
  children: React.ReactNode
  showBack?: { href: string; label: string }
}

export function PortalShell({ children, showBack }: PortalShellProps) {
  const theme = getClientTheme()

  return (
    <div
      className="min-h-screen text-white portal-gradient"
      style={{
        background: themeGradient(theme),
        color: theme.textColor,
      }}
    >
      <header className="max-w-6xl mx-auto px-5 py-6 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src={theme.logoUrl}
            alt={`${theme.platformTitle} logo`}
            width={180}
            height={48}
            className="h-12 w-auto"
            priority
          />
        </Link>
        {showBack && (
          <Link
            href={showBack.href}
            className="text-sm opacity-80 hover:opacity-100 transition-opacity"
          >
            ← {showBack.label}
          </Link>
        )}
      </header>
      <main className="max-w-6xl mx-auto px-5 pb-12">{children}</main>
    </div>
  )
}

interface PortalCardProps {
  title: string
  description: string
  icon: React.ReactNode
  children: React.ReactNode
}

export function PortalCard({ title, description, icon, children }: PortalCardProps) {
  const theme = getClientTheme()

  return (
    <div
      className="portal-glass card-hover p-8 md:p-10 rounded-3xl text-center"
      style={{ borderColor: `${theme.primaryColor}40` }}
    >
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
        style={{ backgroundColor: theme.primaryColor }}
      >
        {icon}
      </div>
      <h3 className="text-2xl font-bold mb-3" style={{ color: theme.secondaryColor }}>
        {title}
      </h3>
      <p className="mb-6 opacity-90 text-sm leading-relaxed">{description}</p>
      {children}
    </div>
  )
}

export function PortalButton({
  href,
  children,
  variant = 'primary',
}: {
  href: string
  children: React.ReactNode
  variant?: 'primary' | 'secondary'
}) {
  const theme = getClientTheme()
  const style =
    variant === 'primary'
      ? {
          background: `linear-gradient(to right, ${theme.primaryColor}, ${theme.secondaryColor})`,
          color: theme.backgroundStart,
        }
      : {
          background: `linear-gradient(to right, ${theme.accentColor}, #ffffff)`,
          color: theme.backgroundStart,
        }

  return (
    <Link
      href={href}
      className="inline-block px-8 py-3 rounded-full font-semibold hover:scale-105 transition-transform mb-2"
      style={style}
    >
      {children}
    </Link>
  )
}
