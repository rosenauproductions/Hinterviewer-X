import { NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const session = await requireAdminSession(request)
  if (session.error) return session.error

  const { data, error } = await session.service
    .from('questions')
    .select('*')
    .order('order_index', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ questions: data || [] })
}

export async function POST(request: Request) {
  const session = await requireAdminSession(request)
  if (session.error) return session.error

  const body = await request.json()
  const text = String(body.text || '').trim()
  if (!text) {
    return NextResponse.json({ error: 'Question text required' }, { status: 400 })
  }

  const { data: maxRow } = await session.service
    .from('questions')
    .select('order_index')
    .order('order_index', { ascending: false })
    .limit(1)
    .maybeSingle()

  const orderIndex = (maxRow?.order_index ?? 0) + 1

  const { data, error } = await session.service
    .from('questions')
    .insert({ text, order_index: orderIndex, active: true })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ question: data })
}

export async function PATCH(request: Request) {
  const session = await requireAdminSession(request)
  if (session.error) return session.error

  const body = await request.json()
  const id = Number(body.id)
  if (!id) {
    return NextResponse.json({ error: 'Question id required' }, { status: 400 })
  }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.text !== undefined) update.text = String(body.text).trim()
  if (body.active !== undefined) update.active = Boolean(body.active)
  if (body.order_index !== undefined) update.order_index = Number(body.order_index)

  const { data, error } = await session.service
    .from('questions')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ question: data })
}

export async function DELETE(request: Request) {
  const session = await requireAdminSession(request)
  if (session.error) return session.error

  const { searchParams } = new URL(request.url)
  const id = Number(searchParams.get('id'))
  if (!id) {
    return NextResponse.json({ error: 'Question id required' }, { status: 400 })
  }

  const { error } = await session.service.from('questions').delete().eq('id', id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
