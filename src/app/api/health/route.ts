import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSupabaseEnv, isSupabaseConfigured, validateSupabaseEnv } from '@/lib/env'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        status: 'setup_required',
        configured: false,
        database: 'not_configured',
        message: 'Set CLIENT_ID + Supabase keys — see /setup and clients/registry.json',
      },
      { status: 503 },
    )
  }

  const validation = validateSupabaseEnv()
  const env = getSupabaseEnv()!
  const supabase = createClient(env.url, env.anonKey)

  const { error } = await supabase.from('questions').select('id').limit(1)

  if (error) {
    return NextResponse.json(
      {
        status: 'error',
        configured: true,
        database: 'unreachable',
        clientId: validation.clientId,
        clientName: validation.clientName,
        message: error.message,
        hint: 'Run supabase-schema.sql in your Supabase SQL Editor',
      },
      { status: 503 },
    )
  }

  return NextResponse.json({
    status: 'ok',
    configured: true,
    database: 'ok',
    clientId: validation.clientId,
    clientName: validation.clientName,
  })
}
