import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getDonorDonations, getUser } from '../api'
import '../pages/Dashboard.css'

const STORAGE_KEY = 'aidbridge-user'

const NAV_ITEMS = [
  { id: 'overview',  icon: '🏠', label: 'Overview',     link: '/dashboard' },
  { id: 'donations', icon: '📦', label: 'My Donations', link: '/dashboard/donations' },
  { id: 'new',       icon: '➕', label: 'New Donation', link: '/donations/new' },
  { id: 'impact',    icon: '📊', label: 'Impact',       link: '/dashboard/impact' },
  { id: 'settings',  icon: '⚙️', label: 'Settings',     link: '/dashboard/settings' },
]

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
  const quantity = rawDetails.quantity ? `${rawDetails.quantity}` : null
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

function DonorDashboardLayout({ activePage, children }) {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [donations, setDonations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadDashboardData = async () => {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (!saved) {
        navigate('/login/donor')
        return
      }

      const parsed = JSON.parse(saved)
      setUser(parsed)

      try {
        const freshUser = await getUser(parsed.id)
        setUser(freshUser)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(freshUser))
      } catch (error) {
        console.warn('Unable to refresh user profile', error)
      }

      try {
        const donorDonations = await getDonorDonations(parsed.id)
        setDonations(donorDonations.map(normalizeDonation))
      } catch (error) {
        console.warn('Unable to load donations', error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [navigate])

  const handleUserUpdate = (updated) => {
    setUser(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  if (loading) {
    return <div className="dash-loading"><div className="dash-loading__spinner" /></div>
  }

  if (!user) {
    return null
  }

  return (
    <div className="dash-root">
      <aside className="dash-sidebar">
        <Link to="/" className="dash-logo">Aid<span>Bridge</span></Link>
        <nav className="dash-nav">
          <span className="dash-nav__label">Menu</span>
          {NAV_ITEMS.map(item => (
            <Link
              key={item.id}
              to={item.link}
              className={`dash-nav__item ${activePage === item.id ? 'dash-nav__item--active' : ''}`}
            >
              <span>{item.icon}</span>{item.label}
            </Link>
          ))}
        </nav>
        <button className="dash-logout" onClick={() => { localStorage.removeItem(STORAGE_KEY); navigate('/') }}>
          Sign Out
        </button>
      </aside>

      <main className="dash-main">
        <header className="dash-header">
          <div>
            <p className="dash-header__eyebrow">💛 Donor Account</p>
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

        {typeof children === 'function'
          ? children({ user, donations, onUserUpdate: handleUserUpdate, setDonations })
          : children}
      </main>
    </div>
  )
}

export default DonorDashboardLayout
