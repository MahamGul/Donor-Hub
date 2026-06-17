import React, { useEffect, useState } from 'react'
import './AdminLayout.css'

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
const STORAGE_KEY = 'aidbridge-user'

function formatDate(date) {
  if (!date) return '—'
  try {
    return new Date(date).toLocaleDateString()
  } catch {
    return '—'
  }
}

function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const visibleUsers = users.filter((user) => String(user.role || '').toLowerCase() !== 'admin')

  const token = (() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY))?._id
    } catch {
      return null
    }
  })()

  const headers = {
    'Content-Type': 'application/json',
    'x-user-id': token,
  }

  const loadUsers = () => {
    setLoading(true)
    setError('')

    fetch(`${API_BASE}/admin/users`, { headers })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load users')
        return res.json()
      })
      .then(setUsers)
      .catch(() => setError('Failed to load users.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const filtered = visibleUsers.filter((user) => {
    const q = search.toLowerCase()
    return (
      !q ||
      user.name?.toLowerCase().includes(q) ||
      user.email?.toLowerCase().includes(q) ||
      user.role?.toLowerCase().includes(q) ||
      user.city?.toLowerCase().includes(q)
    )
  })

  const roleCounts = visibleUsers.reduce(
    (acc, user) => {
      const role = user.role || 'unknown'
      acc[role] = (acc[role] || 0) + 1
      return acc
    },
    {}
  )

  return (
    <div>
      <div className="ap-header">
        <h1 className="ap-title">Users</h1>
        <p className="ap-sub">Browse registered donors and recipients</p>
      </div>

      <div className="ap-stats" style={{ marginBottom: '1.5rem' }}>
        <div className="ap-stat">
          <p className="ap-stat-label">Total Users</p>
          <p className="ap-stat-value blue">{visibleUsers.length}</p>
        </div>
        {Object.entries(roleCounts).map(([role, count]) => (
          <div key={role} className="ap-stat">
            <p className="ap-stat-label">{role}</p>
            <p className="ap-stat-value">{count}</p>
          </div>
        ))}
      </div>

      <div className="ap-card">
        <div className="ap-card-header">
          <h2 className="ap-card-title">
            User directory
            <span style={{ marginLeft: 8, fontWeight: 400, color: '#9ca3af', fontSize: 13 }}>
              ({filtered.length})
            </span>
          </h2>

          <div className="ap-filters">
            <input
              className="ap-search"
              placeholder="Search name, email, role, city…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading && <p className="ap-loading">Loading users…</p>}
        {error && <p className="ap-loading" style={{ color: '#dc2626' }}>{error}</p>}

        {!loading && !error && (
          <div className="ap-table-wrap">
            <table className="ap-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>City</th>
                  <th>User ID</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="ap-empty">
                      No users match your search.
                    </td>
                  </tr>
                ) : filtered.map((user) => (
                  <tr key={user.id || user.email}>
                    <td style={{ fontWeight: 500 }}>{user.name || '—'}</td>
                    <td>{user.email || '—'}</td>
                    <td>{user.role || '—'}</td>
                    <td>{user.city || '—'}</td>
                    <td style={{ fontFamily: 'monospace', color: '#6b7280' }}>{user.id || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminUsers
