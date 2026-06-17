import React, { useEffect, useState } from 'react'
import './AdminLayout.css'

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
const STORAGE_KEY = 'aidbridge-user'

function statusBadge(status) {
  const map = {
    available: 'badge badge-green',
    fulfilled: 'badge badge-blue',
    expired: 'badge badge-red',
    invalid: 'badge badge-gray',
    pending: 'badge badge-amber',
    granted: 'badge badge-green',
    rejected: 'badge badge-red',
  }
  return map[status] || 'badge badge-gray'
}

function formatDate(date) {
  if (!date) return '—'
  try {
    return new Date(date).toLocaleDateString()
  } catch {
    return '—'
  }
}

function AdminExpiry() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')

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

  const loadItems = () => {
    setLoading(true)
    setError('')

    fetch(`${API_BASE}/admin/expiry`, { headers })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load expiry data')
        return res.json()
      })
      .then((data) => setItems(data.items || data))
      .catch(() => setError('Failed to load expiring donations.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadItems()
  }, [])

  const categories = ['All', ...Array.from(new Set(items.map((item) => item.category).filter(Boolean)))]

  const filtered = items.filter((item) => {
    const q = search.toLowerCase()
    const matchesSearch =
      !q ||
      item.title?.toLowerCase().includes(q) ||
      item.category?.toLowerCase().includes(q) ||
      item.donorId?.toLowerCase().includes(q)
    const matchesCat = filter === 'All' || item.category === filter
    return matchesSearch && matchesCat
  })

  return (
    <div>
      <div className="ap-header">
        <h1 className="ap-title">Expiry Check</h1>
        <p className="ap-sub">Monitor donations with expiration dates and soon-to-expire items</p>
      </div>

      <div className="ap-card">
        <div className="ap-card-header">
          <h2 className="ap-card-title">
            Expiring donations
            <span style={{ marginLeft: 8, fontWeight: 400, color: '#9ca3af', fontSize: 13 }}>
              ({filtered.length})
            </span>
          </h2>

          <div className="ap-filters">
            <input
              className="ap-search"
              placeholder="Search title, category, or donor…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              className="ap-select"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>

        {loading && <p className="ap-loading">Loading expiry report…</p>}
        {error && <p className="ap-loading" style={{ color: '#dc2626' }}>{error}</p>}

        {!loading && !error && (
          <div className="ap-table-wrap">
            <table className="ap-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Donor</th>
                  <th>Status</th>
                  <th>Expiry</th>
                  <th>Days until expiry</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="ap-empty">
                      No expiring donations found.
                    </td>
                  </tr>
                ) : filtered.map((item) => (
                  <tr key={item.id || item._id || item._id?.$oid}>
                    <td style={{ fontWeight: 500 }}>{item.title || '—'}</td>
                    <td>{item.category || '—'}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12, color: '#6b7280' }}>
                      {item.donorId || '—'}
                    </td>
                    <td><span className={statusBadge(item.status)}>{item.status || 'unknown'}</span></td>
                    <td>{formatDate(item.expiryDate)}</td>
                    <td>{item.daysUntilExpiry ?? '—'}</td>
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

export default AdminExpiry
