import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getDonorDonations, getUser } from '../api'
import DonorDashboardLayout from '../components/DonorDashboardLayout'
import './Dashboard.css'

const STORAGE_KEY = 'aidbridge-user'

const CATEGORY_ICONS = {
  Food: '🍲',
  Education: '📚',
  Health: '🏥',
  Funds: '💰',
  Medicine: '💊',
  Clothing: '👕',
  Financial: '💰',
}

function normalizeDonation(donation) {
  const icon = CATEGORY_ICONS[donation.category] || '📦'
  const label = donation.title || donation.category || 'Donation'
  const rawDetails = donation.details || {}
  const recipient = rawDetails.recipient || rawDetails.recipientName || 'Unmatched'
  const location = rawDetails.city || rawDetails.location || rawDetails.country || '—'
  const amount = rawDetails.amount ? `${rawDetails.amount} ${rawDetails.currency || ''}`.trim() : null
  const quantity = donation.quantity ? `${donation.quantity}` : null
  const impact = amount || quantity || rawDetails.peopleHelped || '—'
  const note = donation.description || rawDetails.notes || rawDetails.note || 'No notes provided.'
  let status = donation.status ? donation.status.charAt(0).toUpperCase() + donation.status.slice(1) : 'Pending'
  if (status === 'Available') status = 'Pending'
  const date = donation.createdAt || donation.date || 'Unknown'

  return {
    ...donation,
    icon,
    label,
    category: donation.category || 'Other',
    recipient,
    location,
    impact,
    note,
    status,
    date,
  }
}

function StatusPill({ status }) {
  const map = { Delivered: 'pill--green', Fulfilled: 'pill--green', Pending: 'pill--amber', Rejected: 'pill--red' }
  return <span className={`pill ${map[status] || 'pill--amber'}`}>{status}</span>
}

function CategoryBadge({ category }) {
  const colours = { Food: '#e8a020', Education: '#5b8dee', Health: '#3bc47f', Financial: '#a78bfa', Clothing: '#f87171' }
  return (
    <span className="cat-badge" style={{ color: colours[category] || '#888', background: (colours[category] || '#888') + '22', border: `1px solid ${(colours[category] || '#888')}33` }}>
      {category}
    </span>
  )
}

function Overview({ donations, onNav }) {
  const delivered = donations.filter(d => d.status === 'Delivered').length
  const pending = donations.filter(d => d.status === 'Pending').length
  const peopleHelped = donations.filter(d => d.impact !== '—').reduce((sum, d) => sum + (parseInt(d.impact) || 0), 0)
  const sparkData = [2, 5, 3, 7, 4, donations.length]
  const sparkMax = Math.max(...sparkData)

  return (
    <>
      <section className="dash-stats">
        <div className="dash-stat-card">
          <span className="dash-stat-card__icon">📦</span>
          <div><p className="dash-stat-card__label">Total Donated</p><p className="dash-stat-card__num">{donations.length}</p></div>
        </div>
        <div className="dash-stat-card">
          <span className="dash-stat-card__icon">✅</span>
          <div><p className="dash-stat-card__label">Delivered</p><p className="dash-stat-card__num">{delivered}</p></div>
        </div>
        <div className="dash-stat-card">
          <span className="dash-stat-card__icon">⏳</span>
          <div><p className="dash-stat-card__label">Pending</p><p className="dash-stat-card__num">{pending}</p></div>
        </div>
        <div className="dash-stat-card">
          <span className="dash-stat-card__icon">🌍</span>
          <div><p className="dash-stat-card__label">People Helped</p><p className="dash-stat-card__num">{peopleHelped}</p></div>
        </div>
      </section>

      <section className="dash-mid-row">
        <div className="dash-chart-card">
          <p className="dash-chart-card__title">Donation Activity</p>
          <p className="dash-chart-card__sub">Last 6 months</p>
          <div className="spark-bars">
            {sparkData.map((value, index) => (
              <div key={index} className="spark-bar-wrap">
                <div className="spark-bar" style={{ height: `${(value / sparkMax) * 100}%` }} />
                <span className="spark-bar__label">{['Jan','Feb','Mar','Apr','May','Jun'][index]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="dash-action">
          <div className="dash-action__text">
            <h2>Ready to donate again?</h2>
            <p>Your generosity reaches people who truly need it. Every donation is matched with a verified recipient.</p>
          </div>
          <Link to="/donations/new" className="dash-action__btn">+ New Donation</Link>
        </div>
      </section>

      <section>
        <div className="dash-activity__header">
          <h2 className="dash-activity__title">Recent Activity</h2>
          <button className="dash-view-all" onClick={() => onNav('donations')}>View all ?</button>
        </div>
        <div className="dash-table">
          <div className="dash-table__head">
            <span>Item</span>
            <span>Category</span>
            <span>Date</span>
            <span>Status</span>
          </div>
          {donations.slice(0, 4).map(item => (
            <div key={item.id} className="dash-table__row">
              <span className="dash-table__item">
                <span className="dash-table__icon">{item.icon}</span>{item.label}
              </span>
              <span><CategoryBadge category={item.category} /></span>
              <span className="dash-table__date">{item.date}</span>
              <StatusPill status={item.status} />
            </div>
          ))}
        </div>
      </section>
    </>
  )
}

function RecipientDashboard({ user }) {
  const navigate = useNavigate()

  const menu = [
    { id: 'overview', icon: '🏠', label: 'Overview', active: true },
    { id: 'requests', icon: '📋', label: 'My Requests', link: '/requests/my' },
    { id: 'new', icon: '➕', label: 'New Request', link: '/requests/new' },
    { id: 'track', icon: '🚚', label: 'Track Requests', link: '/requests/track' },
    { id: 'feedback', icon: '💬', label: 'Feedback', link: '/feedback' },
    { id: 'settings', icon: '⚙️', label: 'Settings', link: '/settings' },
  ]

  return (
    <div className="dash-root">
      <aside className="dash-sidebar">
        <Link to="/" className="dash-logo">Aid<span>Bridge</span></Link>
        <nav className="dash-nav">
          <span className="dash-nav__label">Menu</span>
          {menu.map(item => (
            item.link ? (
              <Link key={item.id} to={item.link} className="dash-nav__item">
                <span>{item.icon}</span>{item.label}
              </Link>
            ) : (
              <span key={item.id} className="dash-nav__item dash-nav__item--active">
                <span>{item.icon}</span>{item.label}
              </span>
            )
          ))}
        </nav>
        <button className="dash-logout" onClick={() => { localStorage.removeItem(STORAGE_KEY); navigate('/') }}>
          Sign Out
        </button>
      </aside>

      <main className="dash-main">
        <header className="dash-header">
          <div>
            <p className="dash-header__eyebrow">🤲 Recipient Account</p>
            <h1 className="dash-header__title">Welcome back, {user.name.split(' ')[0]}</h1>
          </div>
          <div className="dash-header__user">
            <div className="dash-avatar">{user.name.charAt(0).toUpperCase()}</div>
            <div>
              <p className="dash-header__user-name">{user.name}</p>
              <p className="dash-header__user-email">{user.email}</p>
            </div>
          </div>
        </header>

        <section className="dash-stats">
          <div className="dash-stat-card">
            <span className="dash-stat-card__icon">📬</span>
            <div><p className="dash-stat-card__label">Requests Made</p><p className="dash-stat-card__num">—</p></div>
          </div>
          <div className="dash-stat-card">
            <span className="dash-stat-card__icon">⏳</span>
            <div><p className="dash-stat-card__label">Pending</p><p className="dash-stat-card__num">—</p></div>
          </div>
          <div className="dash-stat-card">
            <span className="dash-stat-card__icon">✅</span>
            <div><p className="dash-stat-card__label">Fulfilled</p><p className="dash-stat-card__num">—</p></div>
          </div>
        </section>

        <section className="dash-action">
          <div className="dash-action__text">
            <h2>Need aid?</h2>
            <p>Submit a new request and we'll match you with available donations as soon as possible.</p>
          </div>
          <Link to="/requests/new" className="dash-action__btn">+ New Request</Link>
        </section>
      </main>
    </div>
  )
}

function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) {
      navigate('/login/donor')
      return
    }

    const parsed = JSON.parse(saved)
    setUser(parsed)
    setLoading(false)
  }, [navigate])

  if (loading) {
    return <div className="dash-loading"><div className="dash-loading__spinner" /></div>
  }

  if (!user) {
    return null
  }

  if (user.role !== 'donor') {
    return <RecipientDashboard user={user} />
  }

  return (
    <DonorDashboardLayout activePage="overview">
      {({ donations }) => (
        <Overview
          donations={donations}
          onNav={(view) => navigate(`/dashboard/${view}`)}
        />
      )}
    </DonorDashboardLayout>
  )
}

export default Dashboard