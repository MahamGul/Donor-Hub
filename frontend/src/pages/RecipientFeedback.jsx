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

export default function RecipientFeedback() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)

  const [requests, setRequests] = useState([])
  const [loadingRequests, setLoadingRequests] = useState(true)

  const [mode, setMode] = useState('general') // 'general' | 'request'
  const [selectedRequestId, setSelectedRequestId] = useState('')
  const [comment, setComment] = useState('')
  const [anonymous, setAnonymous] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [myFeedback, setMyFeedback] = useState([])
  const [loadingFeedback, setLoadingFeedback] = useState(true)

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
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        const fulfilled = data.filter(r => (STATUS_MAP[r.status] || '') === 'Fulfilled')
        setRequests(fulfilled)
      })
      .catch(() => setRequests([]))
      .finally(() => setLoadingRequests(false))

    fetch(`${API_URL}/feedback/recipient/${parsed.id}`)
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        const sorted = [...data].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
        setMyFeedback(sorted)
      })
      .catch(() => setMyFeedback([]))
      .finally(() => setLoadingFeedback(false))
  }, [navigate])

  if (!user) return null

  const selectedRequest = requests.find(r => r.id === selectedRequestId)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!comment.trim()) {
      setError('Please write a comment before submitting.')
      return
    }
    if (mode === 'request' && !selectedRequestId) {
      setError('Please select which request this feedback is about.')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        recipientId: user.id,
        comment: comment.trim(),
        anonymous,
        requestId: mode === 'request' ? selectedRequestId : null,
      }
      const res = await fetch(`${API_URL}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Failed to submit feedback')

      setMyFeedback(prev => [data, ...prev])
      setComment('')
      setAnonymous(false)
      setSelectedRequestId('')
      setMode('general')
      setSuccess('Thanks — your feedback has been sent to the donor.')
      setTimeout(() => setSuccess(''), 4000)
    } catch (e) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="dash-root">
      <Sidebar user={user} navigate={navigate} />

      <main className="dash-main">
        <header className="donations-page-header">
          <div>
            <h1 className="donations-page-title">Feedback</h1>
            <p className="donations-page-sub">Let donors know how their contribution helped — or share general thoughts about AidBridge.</p>
          </div>
        </header>

        <div className="settings-form">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            <div className="filter-row">
              <div className="filter-group">
                <button
                  type="button"
                  className={`filter-btn ${mode === 'general' ? 'filter-btn--active' : ''}`}
                  onClick={() => { setMode('general'); setSelectedRequestId('') }}
                >
                  General feedback
                </button>
                <button
                  type="button"
                  className={`filter-btn ${mode === 'request' ? 'filter-btn--active' : ''}`}
                  onClick={() => setMode('request')}
                  disabled={!loadingRequests && requests.length === 0}
                >
                  About a specific request
                </button>
              </div>
            </div>

            {mode === 'request' && (
              <div className="settings-field">
                <label className="settings-label">Which request?</label>
                {loadingRequests ? (
                  <p className="settings-panel-desc">Loading your fulfilled requests…</p>
                ) : requests.length === 0 ? (
                  <p className="settings-panel-desc">You don't have any fulfilled requests yet.</p>
                ) : (
                  <select
                    className="settings-input"
                    value={selectedRequestId}
                    onChange={e => setSelectedRequestId(e.target.value)}
                  >
                    <option value="" disabled>Select a fulfilled request</option>
                    {requests.map(r => (
                      <option key={r.id} value={r.id}>
                        {CATEGORY_ICONS[r.category] || '📦'} {r.category} — {r.createdAt} — {r.message}
                      </option>
                    ))}
                  </select>
                )}
                {selectedRequest && (
                  <p className="nd-hint">
                    Feedback will be linked to this {selectedRequest.category.toLowerCase()} request from {selectedRequest.createdAt}.
                  </p>
                )}
              </div>
            )}

            <div className="settings-field">
              <label className="settings-label">Your feedback</label>
              <textarea
                className="settings-input settings-textarea"
                placeholder="Share how this helped you, or any thoughts about AidBridge…"
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={5}
              />
            </div>

            <div className="settings-toggle-row" style={{ border: '1px solid rgba(232,160,32,0.1)', borderRadius: '4px' }}>
              <div className="settings-toggle-info">
                <p className="settings-toggle-label">Submit anonymously</p>
                <p className="settings-toggle-desc">Your name won't be shown to the donor if enabled.</p>
              </div>
              <button
                type="button"
                className={`settings-toggle-btn ${anonymous ? 'settings-toggle-btn--on' : ''}`}
                onClick={() => setAnonymous(!anonymous)}
                aria-pressed={anonymous}
              >
                <span className="settings-toggle-thumb" />
              </button>
            </div>

            {error && <p className="nd-error">{error}</p>}
            {success && <div className="settings-toast">{success}</div>}

            <div className="settings-actions">
              <button className="dash-action__btn" type="submit" disabled={submitting}>
                {submitting ? 'Submitting…' : 'Submit feedback'}
              </button>
            </div>
          </form>
        </div>

        <section>
          <h2 className="dash-activity__title" style={{ marginBottom: '16px' }}>Your past feedback</h2>

          {loadingFeedback && (
            <div className="dash-loading" style={{ minHeight: '120px' }}>
              <div className="dash-loading__spinner" />
            </div>
          )}

          {!loadingFeedback && myFeedback.length === 0 && (
            <div className="donations-empty">
              <span>💬</span>
              <p>You haven't submitted any feedback yet.</p>
            </div>
          )}

          {!loadingFeedback && myFeedback.length > 0 && (
            <div className="donations-list">
              {myFeedback.map(fb => (
                <div key={fb.id} className="donation-card">
                  <div className="donation-card__row" style={{ cursor: 'default', gridTemplateColumns: '44px 1fr auto' }}>
                    <span className="donation-card__icon">💬</span>
                    <div>
                      <p className="donation-card__label">
                        {fb.requestId ? 'Request feedback' : 'General feedback'}
                        {fb.anonymous && <span className="cat-badge" style={{ marginLeft: '8px', color: '#888', background: '#88888822', border: '1px solid #88888833' }}>Anonymous</span>}
                      </p>
                      <p className="donation-card__meta">{fb.comment}</p>
                    </div>
                    <span className="dash-table__date">{fb.createdAt}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
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
        <Link to="/requests/track" className="dash-nav__item"><span>🚚</span> Track Requests</Link>
        <Link to="/feedback" className="dash-nav__item dash-nav__item--active"><span>💬</span> Feedback</Link>
        <Link to="/settings" className="dash-nav__item"><span>⚙️</span> Settings</Link>
      </nav>
      <button className="dash-logout" onClick={handleLogout}>Sign Out</button>
    </aside>
  )
}