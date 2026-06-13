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
  Medicine: '👕',
  Clothes: '👕',
}

export default function DonorFeedback() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [feedback, setFeedback] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('All')

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) {
      navigate('/login/donor')
      return
    }
    const parsed = JSON.parse(saved)
    if (parsed.role !== 'donor') {
      navigate('/dashboard')
      return
    }
    setUser(parsed)

    fetch(`${API_URL}/feedback/donor/${parsed.id}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to load feedback')
        return res.json()
      })
      .then(data => {
        const sorted = [...data].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
        setFeedback(sorted)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [navigate])

  if (!user) return null

  const filterOptions = ['All', 'General', 'About a request']
  const filtered = feedback.filter(fb => {
    if (filter === 'General') return !fb.requestId
    if (filter === 'About a request') return !!fb.requestId
    return true
  })

  return (
    <div className="dash-root">
      <Sidebar user={user} navigate={navigate} />

      <main className="dash-main">
        <header className="donations-page-header">
          <div>
            <h1 className="donations-page-title">Feedback</h1>
            <p className="donations-page-sub">What recipients are saying about your donations.</p>
          </div>
        </header>

        <section className="dash-stats">
          <div className="dash-stat-card">
            <span className="dash-stat-card__icon">💬</span>
            <div><p className="dash-stat-card__label">Total Feedback</p><p className="dash-stat-card__num">{feedback.length}</p></div>
          </div>
          <div className="dash-stat-card">
            <span className="dash-stat-card__icon">📦</span>
            <div><p className="dash-stat-card__label">About requests</p><p className="dash-stat-card__num">{feedback.filter(f => f.requestId).length}</p></div>
          </div>
          <div className="dash-stat-card">
            <span className="dash-stat-card__icon">🌐</span>
            <div><p className="dash-stat-card__label">General</p><p className="dash-stat-card__num">{feedback.filter(f => !f.requestId).length}</p></div>
          </div>
        </section>

        <div className="filter-row">
          <div className="filter-group">
            {filterOptions.map(f => (
              <button
                key={f}
                className={`filter-btn ${filter === f ? 'filter-btn--active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f}
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
            <span>💬</span>
            <p>No feedback {filter !== 'All' ? `of this type ` : ''}yet.</p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="donations-list">
            {filtered.map(fb => (
              <div key={fb.id} className="donation-card">
                <div className="donation-card__row" style={{ cursor: 'default', gridTemplateColumns: '44px 1fr auto auto' }}>
                  <span className="donation-card__icon">
                    {fb.requestId ? (CATEGORY_ICONS['Food'] && '📦') : '🌐'}
                  </span>
                  <div>
                    <p className="donation-card__label">
                      {fb.anonymous || !fb.recipientName ? 'Anonymous recipient' : fb.recipientName}
                      {fb.requestId && (
                        <span className="cat-badge" style={{ marginLeft: '8px', color: '#e8a020', background: '#e8a02022', border: '1px solid #e8a02033' }}>
                          Request feedback
                        </span>
                      )}
                    </p>
                    <p className="donation-card__meta">{fb.comment}</p>
                  </div>
                  <span className="dash-table__date">{fb.createdAt}</span>
                </div>
              </div>
            ))}
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
        <Link to="/donations/new" className="dash-nav__item"><span>➕</span> New Donation</Link>
        <Link to="/dashboard/donations" className="dash-nav__item"><span>📦</span> My Donations</Link>
        <Link to="/dashboard/impact" className="dash-nav__item"><span>📊</span> Impact</Link>
        <Link to="/feedback" className="dash-nav__item dash-nav__item--active"><span>💬</span> Feedback</Link>
        <Link to="/settings" className="dash-nav__item"><span>⚙️</span> Settings</Link>
      </nav>
      <button className="dash-logout" onClick={handleLogout}>Sign Out</button>
    </aside>
  )
}
