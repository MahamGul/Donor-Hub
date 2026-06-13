import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './Dashboard.css'

const STORAGE_KEY = 'aidbridge-user'
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

const CATEGORY_ICONS = {
  Food: '🍲',
  Education: '📚',
  Blood: '🩸',
  Funds: '💰',
  Medicine: '💊',
  Clothes: '👕',
}

const STATUS_MAP = {
  granted: 'Fulfilled',
  fulfilled: 'Fulfilled',
  pending: 'Pending',
  rejected: 'Rejected',
}

/* Pull out a "where" string per category, falling back to '—' */
function locationOf(req) {
  const d = req.details || {}
  switch (req.category) {
    case 'Blood':
      return [d.city, d.hospitalPreference].filter(Boolean).join(' • ') || '—'
    case 'Funds':
      return d.bankDetails?.bankProvider || '—'
    default:
      return d.city || '—'
  }
}

export default function Track() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [statusFilter, setStatusFilter] = useState('All')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) {
      navigate('/login/recipient')
      return
    }
    const parsed = JSON.parse(saved)
    if (parsed.role !== 'recipient') {
      navigate('/dashboard')
      return
    }
    setUser(parsed)

    fetch(`${API_URL}/requests/recipient/${parsed.id}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to load requests')
        return res.json()
      })
      .then(data => {
        const sorted = [...data].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
        setRequests(sorted)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [navigate])

  if (!user) return null

  const statuses = ['All', 'Fulfilled', 'Pending', 'Rejected']
  const categories = ['All', ...Array.from(new Set(requests.map(r => r.category)))]

  const filtered = requests.filter(r => {
    const status = STATUS_MAP[r.status] || 'Pending'
    if (statusFilter !== 'All' && status !== statusFilter) return false
    if (categoryFilter !== 'All' && r.category !== categoryFilter) return false
    if (dateFrom && r.createdAt < dateFrom) return false
    if (dateTo && r.createdAt > dateTo) return false
    return true
  })

  const resetFilters = () => {
    setStatusFilter('All')
    setCategoryFilter('All')
    setDateFrom('')
    setDateTo('')
  }

  return (
    <div className="dash-root">
      <Sidebar user={user} navigate={navigate} />

      <main className="dash-main">
        <header className="donations-page-header">
          <div>
            <h1 className="donations-page-title">Track Requests</h1>
            <p className="donations-page-sub">Filter by status, category, or date to see when and where aid was delivered.</p>
          </div>
        </header>

        <div className="donations-toolbar">
          <div className="filter-row">
            <div className="filter-group">
              <span className="detail-item__label" style={{ marginRight: '4px' }}>Status</span>
              {statuses.map(s => (
                <button
                  key={s}
                  className={`filter-btn filter-btn--sm ${statusFilter === s ? 'filter-btn--active' : ''}`}
                  onClick={() => setStatusFilter(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-row">
            <div className="filter-group">
              <span className="detail-item__label" style={{ marginRight: '4px' }}>Category</span>
              {categories.map(c => (
                <button
                  key={c}
                  className={`filter-btn filter-btn--sm ${categoryFilter === c ? 'filter-btn--active' : ''}`}
                  onClick={() => setCategoryFilter(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-row">
            <div className="filter-group">
              <span className="detail-item__label" style={{ marginRight: '4px' }}>From</span>
              <input
                type="date"
                className="nd-input"
                style={{ width: 'auto', padding: '6px 10px', fontSize: '12px' }}
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
              />
              <span className="detail-item__label" style={{ margin: '0 4px' }}>To</span>
              <input
                type="date"
                className="nd-input"
                style={{ width: 'auto', padding: '6px 10px', fontSize: '12px' }}
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
              />
              <button className="filter-btn filter-btn--sm" onClick={resetFilters}>
                Clear filters
              </button>
            </div>
          </div>
        </div>

        {loading && (
          <div className="dash-loading" style={{ minHeight: '200px' }}>
            <div className="dash-loading__spinner" />
          </div>
        )}

        {!loading && error && (
          <div className="donations-empty">
            <span>⚠️</span>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="dash-table">
            <div className="dash-table__head" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr' }}>
              <span>Item</span>
              <span>Date</span>
              <span>Location / Provider</span>
              <span>Status</span>
              <span>Note</span>
            </div>

            {filtered.length === 0 && (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'rgba(240,237,230,0.4)', fontSize: '13px' }}>
                No requests match these filters.
              </div>
            )}

            {filtered.map(req => {
              const status = STATUS_MAP[req.status] || 'Pending'
              const pillMap = { Fulfilled: 'pill--green', Pending: 'pill--amber', Rejected: 'pill--red' }
              return (
                <div key={req.id} className="dash-table__row" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr' }}>
                  <span className="dash-table__item">
                    <span className="dash-table__icon">{CATEGORY_ICONS[req.category] || '📦'}</span>
                    {req.category}
                  </span>
                  <span className="dash-table__date">{req.createdAt}</span>
                  <span className="dash-table__date">{locationOf(req)}</span>
                  <span><span className={`pill ${pillMap[status] || 'pill--amber'}`}>{status}</span></span>
                  <span className="dash-table__date" style={{ fontSize: '11px' }}>{req.message || '—'}</span>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

function Sidebar({ user, navigate }) {
  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY)
    navigate('/')
  }
  return (
    <aside className="dash-sidebar">
      <Link to="/" className="dash-logo">Aid<span>Bridge</span></Link>
      <nav className="dash-nav">
        <span className="dash-nav__label">Menu</span>
        <Link to="/dashboard" className="dash-nav__item"><span>🏠</span> Overview</Link>
        <Link to="/requests/my" className="dash-nav__item"><span>📋</span> My Requests</Link>
        <Link to="/requests/new" className="dash-nav__item"><span>➕</span> New Request</Link>
        <Link to="/requests/track" className="dash-nav__item dash-nav__item--active"><span>🚚</span> Track Requests</Link>
        <Link to="/settings" className="dash-nav__item"><span>⚙️</span> Settings</Link>
      </nav>
      <button className="dash-logout" onClick={handleLogout}>Sign Out</button>
    </aside>
  )
}

