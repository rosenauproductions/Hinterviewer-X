'use client'

import { useEffect, useState } from 'react'
import { adminFetch } from '@/lib/admin-fetch'

interface UserRow {
  id: string
  email: string
  full_name: string | null
  role: string
  created_at: string
  last_sign_in_at: string | null
}

export function AdminUsersPanel() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'applicant',
  })

  const load = async () => {
    setLoading(true)
    const res = await adminFetch('/api/admin/users')
    const data = await res.json()
    if (!res.ok) setError(data.error || 'Failed to load users')
    else setUsers(data.users || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const res = await adminFetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Create failed')
      return
    }
    setForm({ full_name: '', email: '', password: '', role: 'applicant' })
    load()
  }

  const updateRole = async (id: string, role: string) => {
    const res = await adminFetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, role }),
    })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Update failed')
      return
    }
    load()
  }

  const deleteUser = async (id: string, email: string) => {
    if (!confirm(`Delete ${email}? This removes their Supabase Auth account.`)) return
    const res = await adminFetch(`/api/admin/users?id=${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Delete failed')
      return
    }
    load()
  }

  return (
    <div className="space-y-6">
      {error && <p className="text-red-300 text-sm">{error}</p>}

      <form onSubmit={createUser} className="portal-glass rounded-2xl p-4 grid md:grid-cols-2 gap-3">
        <h3 className="md:col-span-2 font-semibold">Add user (Supabase Auth)</h3>
        <input
          className="portal-input"
          placeholder="Full name"
          value={form.full_name}
          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
        />
        <input
          className="portal-input"
          type="email"
          placeholder="Email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          className="portal-input"
          type="password"
          placeholder="Password (6+ chars)"
          required
          minLength={6}
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <select
          className="portal-input"
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
        >
          <option value="applicant">Applicant</option>
          <option value="low_admin">Low admin</option>
          <option value="super_admin">Super admin</option>
        </select>
        <button
          type="submit"
          className="md:col-span-2 px-4 py-2 rounded-lg font-semibold"
          style={{
            background: 'linear-gradient(to right, var(--client-primary), var(--client-secondary))',
            color: 'var(--client-bg-start)',
          }}
        >
          Create user
        </button>
      </form>

      <div className="portal-glass rounded-2xl p-4 overflow-x-auto">
        <h3 className="font-semibold mb-3">Users ({users.length})</h3>
        {loading ? (
          <div className="spinner mx-auto" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/20 text-left">
                <th className="p-2">Name</th>
                <th className="p-2">Email</th>
                <th className="p-2">Role</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-white/10">
                  <td className="p-2">{u.full_name || '—'}</td>
                  <td className="p-2 opacity-80">{u.email}</td>
                  <td className="p-2">
                    <select
                      className="portal-input py-1 text-xs"
                      value={u.role}
                      onChange={(e) => updateRole(u.id, e.target.value)}
                    >
                      <option value="applicant">applicant</option>
                      <option value="low_admin">low_admin</option>
                      <option value="super_admin">super_admin</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <button
                      type="button"
                      onClick={() => deleteUser(u.id, u.email || u.id)}
                      className="text-red-300 hover:underline text-xs"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
