import { NextResponse } from 'next/server'
import { runSuperQaChecks } from '@/lib/qa-super'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { origin } = new URL(request.url)
  const report = await runSuperQaChecks(origin)
  return NextResponse.json(report, {
    headers: { 'Cache-Control': 'no-store' },
  })
}

export async function POST(request: Request) {
  const { origin } = new URL(request.url)
  const server = await runSuperQaChecks(origin)
  let clientExtras: Record<string, unknown> = {}
  try {
    clientExtras = await request.json()
  } catch {
    clientExtras = {}
  }
  return NextResponse.json(
    {
      ...server,
      clientExtras,
      mergedAt: new Date().toISOString(),
    },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
