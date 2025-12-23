export const config = {
  // Supabase (set via environment variables)
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  },

  // Client-specific branding
  client: {
    name: process.env.NEXT_PUBLIC_CLIENT_NAME || 'Hinterviewer X',
    logoUrl: process.env.NEXT_PUBLIC_CLIENT_LOGO_URL || '/logo.png',
    primaryColor: process.env.NEXT_PUBLIC_CLIENT_PRIMARY_COLOR || '#3b82f6',
    secondaryColor: process.env.NEXT_PUBLIC_CLIENT_SECONDARY_COLOR || '#64748b',
  },

  // Deployment info
  deployment: {
    env: process.env.NEXT_PUBLIC_DEPLOYMENT_ENV || 'development',
    clientId: process.env.NEXT_PUBLIC_CLIENT_ID || 'default',
  },

  // Features
  features: {
    analytics: process.env.NEXT_PUBLIC_VERCEL_ANALYTICS === 'true',
  },
} as const

// Type-safe config access
export type Config = typeof config
