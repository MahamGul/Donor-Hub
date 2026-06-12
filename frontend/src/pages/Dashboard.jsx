import React, { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import './Dashboard.css'

const STORAGE_KEY = 'aidbridge-user'
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

/* ─── Static activity data (swap with API calls later) ─── */
const DONOR_ACTIVITY = [
  { icon: '🍲', label: 'Food Package',    status: 'Delivered', date: 'Jun 10' },
  { icon: '📚', label: 'Books Donation',  status: 'Pending',   date: 'Jun 9'  },
  { icon: '🏥', label: 'Medical Kit',     status: 'Delivered', date: 'Jun 7'  },
  { icon: '💰', label: 'Fund Transfer',   status: 'Delivered', date: 'Jun 5'  },
  { icon: '👕', label: 'Clothing Bundle', status: 'Pending',   date: 'Jun 3'  },
]

const RECIPIENT_ACTIVITY = [
  { icon: '🍲', label: 'Food Request',     status: 'Fulfilled', date: 'Jun 10' },
  { icon: '📚', label: 'Books Request',    status: 'Pending',   date: 'Jun 9'  },
  { icon: '💊', label: 'Medicine Request', status: 'Fulfilled', date: 'Jun 6'  },
]

function StatusPill({ status }) {
  const map = {
    Delivered: 'pill--green',
    Fulfilled: 'pill--green',
    Pending:   'pill--amber',
    Rejected:  'pill--red',
  }
  return (
    <span className={`pill ${map[status] || 'pill--amber'}`}>
      {status}
    </span>
  )
}

function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) {
      navigate('/login/donor')
      return
    }
    setUser(JSON.parse(saved))
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY)
    navigate('/')
  }

  if (!user) {
    return (
      <div className="dash-loading">
        <div className="dash-loading__spinner" />
      </div>
    )
  }

  const isDonor   = user.role === 'donor'
  const activity  = isDonor ? DONOR_ACTIVITY : RECIPIENT_ACTIVITY
  const delivered = activity.filter(a => a.status === 'Delivered' || a.status === 'Fulfilled').length
  const pending   = activity.filter(a => a.status === 'Pending').length

  return (
    <div className="dash-root">

      {/* ── Sidebar ── */}
      <aside className="dash-sidebar">
        <Link to="/" className="dash-logo">Aid<span>Bridge</span></Link>

        <nav className="dash-nav">
          <span className="dash-nav__label">Menu</span>
          <Link to="/dashboard" className="dash-nav__item dash-nav__item--active">
            <span>🏠</span> Overview
          </Link>
          {isDonor ? (
            <>
              <Link to="/donations/new" className="dash-nav__item"><span>➕</span> New Donation</Link>
              <a href="#" className="dash-nav__item"><span>📦</span> My Donations</a>
              <a href="#" className="dash-nav__item"><span>📊</span> Impact</a>
            </>
          ) : (
            <>
              <a href="#" className="dash-nav__item"><span>🙋</span> New Request</a>
              <a href="#" className="dash-nav__item"><span>📋</span> My Requests</a>
              <a href="#" className="dash-nav__item"><span>🔍</span> Browse Donations</a>
            </>
          )}
          <a href="#" className="dash-nav__item"><span>⚙️</span> Settings</a>
        </nav>

        <button className="dash-logout" onClick={handleLogout}>
          Sign Out
        </button>
      </aside>

      {/* ── Main content ── */}
      <main className="dash-main">

        {/* Top bar */}
        <header className="dash-header">
          <div>
            <p className="dash-header__eyebrow">
              {isDonor ? '💛 Donor Account' : '🤲 Recipient Account'}
            </p>
            <h1 className="dash-header__title">
              Welcome back, {user.name.split(' ')[0]}
            </h1>
          </div>

          <div className="dash-header__user">
            <div className="dash-avatar">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="dash-header__user-name">{user.name}</p>
              <p className="dash-header__user-email">{user.email}</p>
            </div>
          </div>
        </header>

        {/* Stats */}
        <section className="dash-stats">
          {isDonor ? (
            <>
              <div className="dash-stat-card">
                <span className="dash-stat-card__icon">📦</span>
                <div>
                  <p className="dash-stat-card__label">Total Donated</p>
                  <p className="dash-stat-card__num">{activity.length}</p>
                </div>
              </div>
              <div className="dash-stat-card">
                <span className="dash-stat-card__icon">✅</span>
                <div>
                  <p className="dash-stat-card__label">Delivered</p>
                  <p className="dash-stat-card__num">{delivered}</p>
                </div>
              </div>
              <div className="dash-stat-card">
                <span className="dash-stat-card__icon">⏳</span>
                <div>
                  <p className="dash-stat-card__label">Pending</p>
                  <p className="dash-stat-card__num">{pending}</p>
                </div>
              </div>
              <div className="dash-stat-card">
                <span className="dash-stat-card__icon">🌍</span>
                <div>
                  <p className="dash-stat-card__label">People Helped</p>
                  <p className="dash-stat-card__num">{delivered * 3}</p>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="dash-stat-card">
                <span className="dash-stat-card__icon">📋</span>
                <div>
                  <p className="dash-stat-card__label">Total Requests</p>
                  <p className="dash-stat-card__num">{activity.length}</p>
                </div>
              </div>
              <div className="dash-stat-card">
                <span className="dash-stat-card__icon">✅</span>
                <div>
                  <p className="dash-stat-card__label">Fulfilled</p>
                  <p className="dash-stat-card__num">{delivered}</p>
                </div>
              </div>
              <div className="dash-stat-card">
                <span className="dash-stat-card__icon">⏳</span>
                <div>
                  <p className="dash-stat-card__label">Pending</p>
                  <p className="dash-stat-card__num">{pending}</p>
                </div>
              </div>
            </>
          )}
        </section>

        {/* Quick action */}
        <section className="dash-action">
          <div className="dash-action__text">
            <h2>{isDonor ? 'Ready to donate again?' : 'Need something else?'}</h2>
            <p>{isDonor
              ? 'Your generosity reaches people who truly need it.'
              : "Submit a new aid request and we'll match you with a donor."
            }</p>
          </div>
          {isDonor ? (
            <Link to="/donations/new" className="dash-action__btn">
              + New Donation
            </Link>
          ) : (
            <button className="dash-action__btn">
              + New Request
            </button>
          )}
        </section>

        {/* Recent activity */}
        <section className="dash-activity">
          <h2 className="dash-activity__title">Recent Activity</h2>

          <div className="dash-table">
            <div className="dash-table__head">
              <span>Item</span>
              <span>Date</span>
              <span>Status</span>
            </div>

            {activity.map((item, i) => (
              <div key={i} className="dash-table__row">
                <span className="dash-table__item">
                  <span className="dash-table__icon">{item.icon}</span>
                  {item.label}
                </span>
                <span className="dash-table__date">{item.date}</span>
                <StatusPill status={item.status} />
              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  )
}

export default Dashboard