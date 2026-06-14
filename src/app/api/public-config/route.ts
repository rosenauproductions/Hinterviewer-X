import { NextResponse } from 'next/server'
import { getSupabaseEnv, validateSupabaseEnv } from '@/lib/env'

export const dynamic = 'force-dynamic'

/** Public Supabase config for browser client (anon key is designed to be public). */
export async function GET() {
  const validation = validateSupabaseEnv()
  const env = getSupabaseEnv()

  if (!env) {
    return NextResponse.json(
      {
        error: 'not_configured',
        missing: validation.missing,
        invalid: validation.invalid,
      },
      { status: 503 },
    )
  }

  return NextResponse.json({
    url: env.url,
    anonKey: env.anonKey,
    clientId: validation.clientId,
    clientName: validation.clientName,
  })
}
