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

function StatusPill({ status }) {
  const map = { Fulfilled: 'pill--green', Pending: 'pill--amber', Rejected: 'pill--red' }
  return <span className={`pill ${map[status] || 'pill--amber'}`}>{status}</span>
}

/* ── Renders a friendly one-line summary of what was granted ── */
function summarize(req) {
  const d = req.details || {}
  switch (req.category) {
    case 'Food':
      return `${(d.items || []).join(', ') || 'Items'} • ${d.packagesGranted || 1} package(s)`
    case 'Funds':
      return `PKR ${d.amountGranted ?? 0} to ${d.bankDetails?.bankProvider || 'account'}`
    case 'Education':
      return `${d.bookCount || 0} book(s) • ${d.grade || ''} ${d.subjects?.length ? `• ${d.subjects.join(', ')}` : ''}`
    case 'Blood':
      return `${d.donorBloodGroup || '—'} donor in ${d.city || '—'}`
    case 'Clothes':
      return `${d.quantity || 0} item(s) • ${d.type || ''} • Size ${d.size || '—'}`
    case 'Medicine':
      return `${d.medicineName || '—'} • Qty ${d.quantity || '—'} • Exp ${d.expiryDate || '—'}`
    default:
      return req.message || '—'
  }
}

export default function MyRequests() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('All')
  const [openId, setOpenId] = useState(null)

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

  const categories = ['All', ...Array.from(new Set(requests.map(r => r.category)))]

  const filtered = filter === 'All' ? requests : requests.filter(r => r.category === filter)

  return (
    <div className="dash-root">
      <Sidebar user={user} navigate={navigate} />

      <main className="dash-main">
        <header className="donations-page-header">
          <div>
            <h1 className="donations-page-title">My Requests</h1>
            <p className="donations-page-sub">A history of every request you've made and what was granted.</p>
          </div>
        </header>

        <div className="filter-row">
          <div className="filter-group">
            {categories.map(c => (
              <button
                key={c}
                className={`filter-btn ${filter === c ? 'filter-btn--active' : ''}`}
                onClick={() => setFilter(c)}
              >
                {c}
              </button>
            ))}
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

        {!loading && !error && filtered.length === 0 && (
          <div className="donations-empty">
            <span>📭</span>
            <p>No requests found{filter !== 'All' ? ` for ${filter}` : ' yet'}.</p>
            <Link to="/requests/new" className="dash-action__btn" style={{ marginTop: '8px' }}>
              + New Request
            </Link>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="donations-list">
            {filtered.map(req => {
              const status = STATUS_MAP[req.status] || 'Pending'
              const isOpen = openId === req.id
              return (
                <div key={req.id} className={`donation-card ${isOpen ? 'donation-card--open' : ''}`}>
                  <div className="donation-card__row" onClick={() => setOpenId(isOpen ? null : req.id)}>
                    <span className="donation-card__icon">{CATEGORY_ICONS[req.category] || '📦'}</span>
                    <div>
                      <p className="donation-card__label">{req.category}</p>
                      <p className="donation-card__meta">{summarize(req)}</p>
                    </div>
                    <span className="dash-table__date">{req.createdAt}</span>
                    <StatusPill status={status} />
                    <span className="donation-card__chevron">{isOpen ? '▲' : '▼'}</span>
                  </div>

                  {isOpen && (
                    <div className="donation-card__detail">
                      <div className="detail-grid">
                        {Object.entries(req.details || {})
                          .filter(([, v]) => v !== null && v !== undefined && v !== '' &&
                            !(Array.isArray(v) && v.length === 0))
                          .map(([k, v]) => (
                            <div key={k} className="detail-item">
                              <span className="detail-item__label">
                                {k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                              </span>
                              <span className="detail-item__val">
                                {typeof v === 'object'
                                  ? Array.isArray(v) ? v.join(', ') : JSON.stringify(v)
                                  : String(v)}
                              </span>
                            </div>
                          ))}
                      </div>

                      {req.message && (
                        <div className="donation-card__pending-note">
                          {req.message}
                        </div>
                      )}
                    </div>
                  )}
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
<Link to="/requests/my" className="dash-nav__item dash-nav__item--active"><span>📋</span> My Requests</Link>
<Link to="/requests/new" className="dash-nav__item"><span>➕</span> New Request</Link>
<Link to="/requests/track" className="dash-nav__item"><span>🚚</span> Track Requests</Link>
<Link to="/feedback" className="dash-nav__item"><span>💬</span> Feedback</Link>
<Link to="/settings" className="dash-nav__item"><span>⚙️</span> Settings</Link>
      </nav>
      <button className="dash-logout" onClick={handleLogout}>Sign Out</button>
    </aside>
  )
}
