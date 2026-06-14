import type { CSSProperties } from 'react'
import { getActiveClient } from './clients'

export interface ClientTheme {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  backgroundStart: string
  backgroundEnd: string
  textColor: string
  logoUrl: string
  platformTitle: string
  platformSubtitle: string
}

const MSC_THEME: Partial<ClientTheme> = {
  primaryColor: '#ad9b4e',
  secondaryColor: '#f0c938',
  accentColor: '#bad3f7',
  backgroundStart: '#232c60',
  backgroundEnd: '#1a2048',
  textColor: '#ffffff',
}

export function getClientTheme(): ClientTheme {
  const client = getActiveClient()
  const isMsc = client?.id === 'msc1' || client?.id === 'msc-dev'
  const msc = isMsc ? MSC_THEME : {}

  return {
    primaryColor: client?.primaryColor || msc.primaryColor || '#3b82f6',
    secondaryColor: client?.secondaryColor || msc.secondaryColor || '#64748b',
    accentColor: msc.accentColor || '#93c5fd',
    backgroundStart: msc.backgroundStart || '#18181b',
    backgroundEnd: msc.backgroundEnd || '#09090b',
    textColor: msc.textColor || '#fafafa',
    logoUrl: client?.logoUrl || '/logo.svg',
    platformTitle: client?.name || 'Hinterviewer X',
    platformSubtitle:
      client?.description || 'Video resume platform — record answers, share your story.',
  }
}

export function themeGradient(theme: ClientTheme): string {
  return `linear-gradient(to bottom right, ${theme.backgroundStart}, ${theme.backgroundEnd})`
}

export function themeCssVars(theme: ClientTheme): CSSProperties {
  return {
    '--client-primary': theme.primaryColor,
    '--client-secondary': theme.secondaryColor,
    '--client-accent': theme.accentColor,
    '--client-bg-start': theme.backgroundStart,
    '--client-bg-end': theme.backgroundEnd,
    '--client-text': theme.textColor,
  } as React.CSSProperties
}
