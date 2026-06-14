import { NextResponse } from 'next/server'
import { runQaChecks } from '@/lib/qa'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { origin } = new URL(request.url)
  const report = await runQaChecks(origin)
  const hasFail = report.checks.some((c) => c.status === 'fail')

  return NextResponse.json(report, { status: hasFail ? 503 : 200 })
}
