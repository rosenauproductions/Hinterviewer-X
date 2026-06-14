import { NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await requireAdminSession()
  if (session.error) return session.error

  const { data: profiles, error: profileError } = await session.service
    .from('profiles')
    .select('id, role, full_name, created_at')
    .order('created_at', { ascending: false })

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  const { data: authData, error: authError } = await session.service.auth.admin.listUsers({
    perPage: 200,
  })

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 500 })
  }

  const profileMap = new Map((profiles || []).map((p) => [p.id, p]))
  const users = (authData.users || []).map((u) => {
    const profile = profileMap.get(u.id)
    return {
      id: u.id,
      email: u.email,
      full_name: profile?.full_name || u.user_metadata?.full_name || null,
      role: profile?.role || 'applicant',
      created_at: profile?.created_at || u.created_at,
      last_sign_in_at: u.last_sign_in_at,
    }
  })

  return NextResponse.json({ users })
}

export async function POST(request: Request) {
  const session = await requireAdminSession()
  if (session.error) return session.error

  const body = await request.json()
  const email = String(body.email || '').trim()
  const password = String(body.password || '')
  const fullName = String(body.full_name || '').trim()
  const role = String(body.role || 'applicant')

  if (!email || !password || password.length < 6) {
    return NextResponse.json({ error: 'Email and password (6+ chars) required' }, { status: 400 })
  }

  if (!['applicant', 'low_admin', 'super_admin'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  const { data, error } = await session.service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })

  if (error || !data.user) {
    return NextResponse.json({ error: error?.message || 'Create failed' }, { status: 400 })
  }

  await session.service.from('profiles').upsert({
    id: data.user.id,
    full_name: fullName || null,
    role,
    updated_at: new Date().toISOString(),
  })

  return NextResponse.json({
    user: {
      id: data.user.id,
      email: data.user.email,
      full_name: fullName,
      role,
    },
  })
}

export async function PATCH(request: Request) {
  const session = await requireAdminSession()
  if (session.error) return session.error

  const body = await request.json()
  const userId = String(body.id || '')
  const role = body.role ? String(body.role) : undefined
  const fullName = body.full_name !== undefined ? String(body.full_name) : undefined

  if (!userId) {
    return NextResponse.json({ error: 'User id required' }, { status: 400 })
  }

  if (role && !['applicant', 'low_admin', 'super_admin'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  const profileUpdate: Record<string, string> = { updated_at: new Date().toISOString() }
  if (role) profileUpdate.role = role
  if (fullName !== undefined) profileUpdate.full_name = fullName

  const { error: profileError } = await session.service
    .from('profiles')
    .update(profileUpdate)
    .eq('id', userId)

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  if (fullName !== undefined) {
    await session.service.auth.admin.updateUserById(userId, {
      user_metadata: { full_name: fullName },
    })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request) {
  const session = await requireAdminSession()
  if (session.error) return session.error

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('id')
  if (!userId) {
    return NextResponse.json({ error: 'User id required' }, { status: 400 })
  }

  if (userId === session.user.id) {
    return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
  }

  const { error } = await session.service.auth.admin.deleteUser(userId)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
