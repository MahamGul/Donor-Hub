import React, { useEffect, useState, useCallback } from 'react'
import './AdminLayout.css'

const API_BASE    = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
const STORAGE_KEY = 'aidbridge-user'

const ALL_STATUSES   = ['available', 'fulfilled', 'expired', 'invalid']
const CATEGORIES     = ['All', 'Food', 'Education', 'Clothes', 'Medicine', 'Funds', 'Blood']
const CATEGORY_ICONS = {
  Food: '🍱', Education: '📚', Clothes: '👕',
  Medicine: '💊', Funds: '💰', Blood: '🩸',
}

function statusBadge(status) {
  const map = {
    available: 'badge badge-green',
    fulfilled: 'badge badge-blue',
    expired:   'badge badge-red',
    invalid:   'badge badge-gray',
    pending:   'badge badge-amber',
  }
  return map[status] || 'badge badge-gray'
}

function extractDonationId(donation) {
  return donation.id || donation._id?.$oid || donation._id || ''
}

function getToken() {
  try {
    const user = JSON.parse(localStorage.getItem(STORAGE_KEY))
    // user.id is the string id set by the backend; fall back to _id variants
    return user?.id || user?._id?.$oid || user?._id || ''
  } catch {
    return ''
  }
}

function AdminDonations() {
  const [donations,  setDonations]  = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')
  const [search,     setSearch]     = useState('')
  const [catFilter,  setCatFilter]  = useState('All')
  const [statFilter, setStatFilter] = useState('All')

  // Build headers fresh on every request so they always carry the latest token
  const makeHeaders = () => ({
    'Content-Type': 'application/json',
    'x-user-id': getToken(),
  })

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/admin/donations`, { headers: makeHeaders() })
      if (!res.ok) throw new Error(`Server returned ${res.status}`)
      const data = await res.json()
      setDonations(Array.isArray(data) ? data : data.donations || [])
    } catch (e) {
      setError(`Failed to load donations: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const updateStatus = async (id, status) => {
    try {
      const res = await fetch(`${API_BASE}/admin/donations/${id}/status`, {
        method:  'PATCH',
        headers: makeHeaders(),
        body:    JSON.stringify({ status }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.detail || `Server returned ${res.status}`)
      }
      setDonations(prev =>
        prev.map(d => extractDonationId(d) === id ? { ...d, status } : d)
      )
    } catch (e) {
      alert(`Failed to update status: ${e.message}`)
    }
  }

  const deleteDonation = async (id) => {
    if (!window.confirm('Delete this donation? This cannot be undone.')) return
    try {
      const res = await fetch(`${API_BASE}/admin/donations/${id}`, {
        method:  'DELETE',
        headers: makeHeaders(),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.detail || `Server returned ${res.status}`)
      }
      setDonations(prev => prev.filter(d => extractDonationId(d) !== id))
    } catch (e) {
      alert(`Failed to delete donation: ${e.message}`)
    }
  }

  const filtered = donations.filter(d => {
    const q = search.toLowerCase()
    const matchesSearch =
      !q ||
      d.title?.toLowerCase().includes(q) ||
      d.category?.toLowerCase().includes(q)
    const matchesCat  = catFilter  === 'All' || d.category === catFilter
    const matchesStat = statFilter === 'All' || d.status   === statFilter
    return matchesSearch && matchesCat && matchesStat
  })

  return (
    <div>
      <div className="ap-header">
        <h1 className="ap-title">Donations</h1>
        <p className="ap-sub">View, update status, and remove donations</p>
      </div>

      <div className="ap-card">
        <div className="ap-card-header">
          <h2 className="ap-card-title">
            All Donations
            <span style={{ marginLeft: 8, fontWeight: 400, color: '#9ca3af', fontSize: 13 }}>
              ({filtered.length})
            </span>
          </h2>

          <div className="ap-filters">
            <input
              className="ap-search"
              placeholder="Search title or category…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select
              className="ap-select"
              value={catFilter}
              onChange={e => setCatFilter(e.target.value)}
            >
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <select
              className="ap-select"
              value={statFilter}
              onChange={e => setStatFilter(e.target.value)}
            >
              <option value="All">All statuses</option>
              {ALL_STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {loading && <p className="ap-loading">Loading donations…</p>}
        {error   && <p className="ap-loading" style={{ color: '#dc2626' }}>{error}</p>}

        {!loading && !error && (
          <div className="ap-table-wrap">
            <table className="ap-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Donor ID</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Change Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="ap-empty">No donations match your filters.</td>
                  </tr>
                ) : filtered.map(d => {
                  const id = extractDonationId(d)
                  return (
                    <tr key={id}>
                      <td style={{ fontWeight: 500 }}>
                        {CATEGORY_ICONS[d.category] || '📦'} {d.title || '—'}
                      </td>
                      <td>{d.category}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: 11, color: '#9ca3af' }}>
                        {(d.donorId?.$oid || d.donorId || '—').slice(0, 10)}…
                      </td>
                      <td><span className={statusBadge(d.status)}>{d.status}</span></td>
                      <td style={{ color: '#9ca3af' }}>{d.createdAt}</td>
                      <td>
                        <select
                          className="ap-select"
                          value={d.status || 'available'}
                          onChange={e => updateStatus(id, e.target.value)}
                        >
                          {ALL_STATUSES.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <button
                          className="ap-action-btn danger"
                          onClick={() => deleteDonation(id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminDonations