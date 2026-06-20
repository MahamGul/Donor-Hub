import React, { useEffect, useState } from 'react'
import DonorDashboardLayout from '../components/DonorDashboardLayout'
import './Dashboard.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

export default function DonorFeedback() {
  const [feedback, setFeedback] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [filter, setFilter]     = useState('All')

  const filterOptions = ['All', 'General', 'About a request']

  return (
    <DonorDashboardLayout activePage="feedback">
      {({ user }) => {
        // Kick off the fetch once we have the user object
        // We use a local component so hooks are valid here
        return <FeedbackContent user={user} />
      }}
    </DonorDashboardLayout>
  )
}

function FeedbackContent({ user }) {
  const [feedback, setFeedback] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [filter, setFilter]     = useState('All')

  const filterOptions = ['All', 'General', 'About a request']

  useEffect(() => {
    if (!user) return
    fetch(`${API_URL}/feedback/donor/${user.id}`)
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
  }, [user])

  const filtered = feedback.filter(fb => {
    if (filter === 'General')          return !fb.requestId
    if (filter === 'About a request')  return !!fb.requestId
    return true
  })

  return (
    <>
      <header className="donations-page-header">
        <div>
          <h1 className="donations-page-title">Feedback</h1>
          <p className="donations-page-sub">What recipients are saying about your donations.</p>
        </div>
      </header>

      <section className="dash-stats">
        <div className="dash-stat-card">
          <span className="dash-stat-card__icon">💬</span>
          <div>
            <p className="dash-stat-card__label">Total Feedback</p>
            <p className="dash-stat-card__num">{feedback.length}</p>
          </div>
        </div>
        <div className="dash-stat-card">
          <span className="dash-stat-card__icon">📦</span>
          <div>
            <p className="dash-stat-card__label">About requests</p>
            <p className="dash-stat-card__num">{feedback.filter(f => f.requestId).length}</p>
          </div>
        </div>
        <div className="dash-stat-card">
          <span className="dash-stat-card__icon">🌐</span>
          <div>
            <p className="dash-stat-card__label">General</p>
            <p className="dash-stat-card__num">{feedback.filter(f => !f.requestId).length}</p>
          </div>
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
          <p>No feedback {filter !== 'All' ? 'of this type ' : ''}yet.</p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="donations-list">
          {filtered.map(fb => (
            <div key={fb.id} className="donation-card">
              <div
                className="donation-card__row"
                style={{ cursor: 'default', gridTemplateColumns: '44px 1fr auto auto' }}
              >
                <span className="donation-card__icon">
                  {fb.requestId ? '📦' : '🌐'}
                </span>
                <div>
                  <p className="donation-card__label">
                    {fb.anonymous || !fb.recipientName ? 'Anonymous recipient' : fb.recipientName}
                    {fb.requestId && (
                      <span
                        className="cat-badge"
                        style={{
                          marginLeft: '8px',
                          color: '#e8a020',
                          background: '#e8a02022',
                          border: '1px solid #e8a02033',
                        }}
                      >
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
    </>
  )
}