import React, { useEffect, useState } from 'react'
import './AdminLayout.css'

const API_BASE    = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
const STORAGE_KEY = 'aidbridge-user'
const STATUS_OPTIONS = ['pending', 'granted', 'rejected']

function statusBadge(status) {
  const map = {
    pending:  'badge badge-amber',
    granted:  'badge badge-green',
    rejected: 'badge badge-red',
  }
  return map[status] || 'badge badge-gray'
}

function formatDate(date) {
  if (!date) return '—'
  try { return new Date(date).toLocaleDateString() } catch { return '—' }
}

function extractId(obj) {
  return obj.id || obj._id?.$oid || obj._id || ''
}

function getToken() {
  try {
    const user = JSON.parse(localStorage.getItem(STORAGE_KEY))
    return user?.id || user?._id?.$oid || user?._id || ''
  } catch {
    return ''
  }
}

function AdminRequests() {
  const [requests,   setRequests]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')
  const [search,     setSearch]     = useState('')
  const [catFilter,  setCatFilter]  = useState('All')
  const [statFilter, setStatFilter] = useState('All')
  const [rowErrors,  setRowErrors]  = useState({})

  // Build headers fresh on every call
  const makeHeaders = () => ({
    'Content-Type': 'application/json',
    'x-user-id': getToken(),
  })

  const loadRequests = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/admin/requests`, { headers: makeHeaders() })
      if (!res.ok) throw new Error(`Server returned ${res.status}`)
      const data = await res.json()
      setRequests(Array.isArray(data) ? data : data.requests || [])
    } catch (e) {
      setError(`Failed to load requests: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadRequests() }, [])

  const clearRowError = (id) =>
    setRowErrors(prev => { const next = { ...prev }; delete next[id]; return next })

  const setRowError = (id, message) =>
    setRowErrors(prev => ({ ...prev, [id]: message }))

  const updateStatus = async (id, status) => {
    clearRowError(id)
    try {
      const res = await fetch(`${API_BASE}/admin/requests/${id}/status`, {
        method:  'PATCH',
        headers: makeHeaders(),
        body:    JSON.stringify({ status }),
      })

      let data = {}
      try { data = await res.json() } catch { /* non-JSON */ }

      if (!res.ok) {
        setRowError(id, data?.detail || `Failed to update status (${res.status})`)
        return
      }

      setRequests(prev =>
        prev.map(r => extractId(r) === id ? { ...r, ...data, status } : r)
      )
    } catch {
      setRowError(id, 'Network error. Please check your connection and try again.')
    }
  }

  const deleteRequest = async (id) => {
    if (!window.confirm('Delete this request? This cannot be undone.')) return
    clearRowError(id)
    try {
      const res = await fetch(`${API_BASE}/admin/requests/${id}`, {
        method:  'DELETE',
        headers: makeHeaders(),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.detail || `Server returned ${res.status}`)
      }
      setRequests(prev => prev.filter(r => extractId(r) !== id))
    } catch (e) {
      alert(`Failed to delete request: ${e.message}`)
    }
  }

  const categories = [
    'All',
    ...Array.from(new Set(requests.map(r => r.category).filter(Boolean))),
  ]

  const filtered = requests.filter(r => {
    const q = search.toLowerCase()
    const matchesSearch =
      !q ||
      r.category?.toLowerCase().includes(q) ||
      r.message?.toLowerCase().includes(q) ||
      (r.recipientId || '').toLowerCase().includes(q)
    const matchesCat  = catFilter  === 'All' || r.category === catFilter
    const matchesStat = statFilter === 'All' || r.status   === statFilter
    return matchesSearch && matchesCat && matchesStat
  })

  return (
    <div>
      <div className="ap-header">
        <h1 className="ap-title">Requests</h1>
        <p className="ap-sub">Review incoming requests and update their status</p>
      </div>

      <div className="ap-card">
        <div className="ap-card-header">
          <h2 className="ap-card-title">
            All Requests
            <span style={{ marginLeft: 8, fontWeight: 400, color: '#9ca3af', fontSize: 13 }}>
              ({filtered.length})
            </span>
          </h2>

          <div className="ap-filters">
            <input
              className="ap-search"
              placeholder="Search category, message, or recipient…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select
              className="ap-select"
              value={catFilter}
              onChange={e => setCatFilter(e.target.value)}
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              className="ap-select"
              value={statFilter}
              onChange={e => setStatFilter(e.target.value)}
            >
              <option value="All">All statuses</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {loading && <p className="ap-loading">Loading requests…</p>}
        {error   && <p className="ap-loading" style={{ color: '#dc2626' }}>{error}</p>}

        {!loading && !error && (
          <div className="ap-table-wrap">
            <table className="ap-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Recipient ID</th>
                  <th>Status</th>
                  <th>Message</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="ap-empty">No requests match your filters.</td>
                  </tr>
                ) : filtered.map(request => {
                  const id       = extractId(request)
                  const rowError = rowErrors[id]
                  return (
                    <React.Fragment key={id}>
                      <tr>
                        <td>{request.category || '—'}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: 12, color: '#6b7280' }}>
                          {(request.recipientId || '—').slice(0, 10)}…
                        </td>
                        <td>
                          <span className={statusBadge(request.status)}>
                            {request.status || 'unknown'}
                          </span>
                        </td>
                        <td>{request.message || '—'}</td>
                        <td>{formatDate(request.createdAt)}</td>
                        <td>
                          <select
                            className="ap-select"
                            value={request.status || 'pending'}
                            onChange={e => updateStatus(id, e.target.value)}
                          >
                            {STATUS_OPTIONS.map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                          <button
                            className="ap-action-btn danger"
                            style={{ marginTop: 6 }}
                            onClick={() => deleteRequest(id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>

                      {rowError && (
                        <tr>
                          <td
                            colSpan={6}
                            style={{
                              padding: '8px 14px 10px',
                              background: 'rgba(220,38,38,0.08)',
                              borderTop: '1px solid rgba(220,38,38,0.18)',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ef4444', fontSize: 13 }}>
                              <span style={{ fontSize: 15 }}>⚠️</span>
                              <span>{rowError}</span>
                              <button
                                onClick={() => clearRowError(id)}
                                style={{
                                  marginLeft: 'auto', background: 'none', border: 'none',
                                  color: '#9ca3af', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '0 2px',
                                }}
                                aria-label="Dismiss"
                              >×</button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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

export default AdminRequests