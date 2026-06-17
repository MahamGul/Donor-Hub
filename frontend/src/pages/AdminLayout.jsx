import React, { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import './AdminLayout.css'

const STORAGE_KEY = 'aidbridge-user'

const NAV = [
  { to: '/admin',             label: 'Dashboard',    icon: '📊', end: true },
  { to: '/admin/donations',   label: 'Donations',    icon: '🎁' },
  { to: '/admin/requests',    label: 'Requests',     icon: '📋' },
  { to: '/admin/users',       label: 'Users',        icon: '👥' },
  { to: '/admin/expiry',      label: 'Expiry Check', icon: '⏰' },
]

function AdminLayout() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const raw  = localStorage.getItem(STORAGE_KEY)
  const user = raw ? JSON.parse(raw) : {}

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY)
    navigate('/login/admin')
  }

  return (
    <div className="al-root">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="al-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`al-sidebar${sidebarOpen ? ' al-sidebar--open' : ''}`}>
        <div className="al-brand">
          <span className="al-brand-icon">🛡️</span>
          <div>
            <p className="al-brand-title">AidBridge</p>
            <p className="al-brand-sub">Admin Panel</p>
          </div>
        </div>

        <nav className="al-nav">
          {NAV.map(({ to, label, icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `al-nav-item${isActive ? ' al-nav-item--active' : ''}`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <span className="al-nav-icon">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="al-sidebar-footer">
          <div className="al-user-chip">
            <span className="al-user-avatar">
              {user?.name?.charAt(0)?.toUpperCase() || 'A'}
            </span>
            <div className="al-user-info">
              <p className="al-user-name">{user?.name || 'Admin'}</p>
              <p className="al-user-role">Administrator</p>
            </div>
          </div>
          <button className="al-logout-btn" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="al-main">
        {/* Top bar (mobile) */}
        <header className="al-topbar">
          <button
            className="al-menu-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            ☰
          </button>
          <span className="al-topbar-title">AidBridge Admin</span>
        </header>

        <main className="al-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout