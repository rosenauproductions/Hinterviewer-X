import { getActiveClient, resolveActiveClientId } from '@/lib/clients'
import { getSupabaseEnv, isSupabaseConfigured } from '@/lib/env'

const client = getActiveClient()

export const config = {
  client: {
    id: resolveActiveClientId() || 'unset',
    name: client?.name || process.env.NEXT_PUBLIC_CLIENT_NAME || 'Hinterviewer X',
    logoUrl: client?.logoUrl || process.env.NEXT_PUBLIC_CLIENT_LOGO_URL || '/logo.png',
    primaryColor:
      client?.primaryColor || process.env.NEXT_PUBLIC_CLIENT_PRIMARY_COLOR || '#3b82f6',
    secondaryColor:
      client?.secondaryColor || process.env.NEXT_PUBLIC_CLIENT_SECONDARY_COLOR || '#64748b',
    description: client?.description,
  },
  deployment: {
    env: process.env.NEXT_PUBLIC_DEPLOYMENT_ENV || 'development',
    clientId: resolveActiveClientId() || 'unset',
  },
  features: {
    analytics: process.env.NEXT_PUBLIC_VERCEL_ANALYTICS === 'true',
  },
  supabase: getSupabaseEnv(),
} as const

export type Config = typeof config
