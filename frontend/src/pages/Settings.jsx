import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './Dashboard.css'

const STORAGE_KEY = 'aidbridge-user'
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

const DEFAULT_NOTIFS = {
  emailUpdates: true,
  requestStatus: true,
  newDonationMatches: true,
}

const DEFAULT_PRIVACY = {
  showProfileToDonors: true,
  showCity: false,
}

const TABS = [
  { id: 'profile', label: 'Profile' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'privacy', label: 'Privacy' },
]

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      className={`settings-toggle-btn ${checked ? 'settings-toggle-btn--on' : ''}`}
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
    >
      <span className="settings-toggle-thumb" />
    </button>
  )
}

export default function Settings() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    bio: '',
    notifs: DEFAULT_NOTIFS,
    privacy: DEFAULT_PRIVACY,
  })

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) {
      navigate('/login/donor')
      return
    }
    const parsed = JSON.parse(saved)
    setUser(parsed)

    fetch(`${API_URL}/users/${parsed.id}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to load profile')
        return res.json()
      })
      .then(data => {
        setForm({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          city: data.city || '',
          bio: data.bio || '',
          notifs: { ...DEFAULT_NOTIFS, ...(data.notifs || {}) },
          privacy: { ...DEFAULT_PRIVACY, ...(data.privacy || {}) },
        })
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [navigate])

  if (!user) return null

  const isDonor = user.role === 'donor'

  const handleField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleToggle = (group, field, value) => {
    setForm(prev => ({ ...prev, [group]: { ...prev[group], [field]: value } }))
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setToast('')
    try {
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        city: form.city,
        bio: form.bio,
        notifs: form.notifs,
        privacy: form.privacy,
      }
      const res = await fetch(`${API_URL}/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Failed to save changes')

      const updatedUser = { ...user, name: data.name, email: data.email }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser))
      setUser(updatedUser)

      setToast('Changes saved successfully.')
      setTimeout(() => setToast(''), 3000)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleLogoutEverywhere = () => {
    localStorage.removeItem(STORAGE_KEY)
    navigate('/')
  }

  if (loading) {
    return (
      <div className="dash-root">
        <Sidebar user={user} navigate={navigate} isDonor={isDonor} />
        <main className="dash-main">
          <div className="dash-loading" style={{ minHeight: '300px' }}>
            <div className="dash-loading__spinner" />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="dash-root">
      <Sidebar user={user} navigate={navigate} isDonor={isDonor} />

      <main className="dash-main">
        <header className="settings-header">
          <h1 className="settings-title">Settings</h1>
          <p className="settings-sub">Manage your profile, notifications, and privacy preferences.</p>
        </header>

        <div className="settings-tabs">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`settings-tab ${activeTab === tab.id ? 'settings-tab--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {toast && <div className="settings-toast">{toast}</div>}
        {error && <p className="nd-error">{error}</p>}

        {activeTab === 'profile' && (
          <div className="settings-panel">
            <div className="settings-avatar-row">
              <div className="settings-avatar">{(form.name || '?').charAt(0).toUpperCase()}</div>
              <div>
                <p className="settings-avatar-name">{form.name || 'Unnamed user'}</p>
                <p className="settings-avatar-role">{isDonor ? 'Donor account' : 'Recipient account'}</p>
              </div>
            </div>

            <div className="settings-form">
              <div className="settings-field-row">
                <div className="settings-field">
                  <label className="settings-label">Full name</label>
                  <input
                    className="settings-input"
                    value={form.name}
                    onChange={e => handleField('name', e.target.value)}
                  />
                </div>
                <div className="settings-field">
                  <label className="settings-label">Email</label>
                  <input
                    className="settings-input"
                    type="email"
                    value={form.email}
                    onChange={e => handleField('email', e.target.value)}
                  />
                </div>
              </div>

              <div className="settings-field-row">
                <div className="settings-field">
                  <label className="settings-label">Phone <span className="settings-label-opt">(optional)</span></label>
                  <input
                    className="settings-input"
                    placeholder="e.g. 03001234567"
                    value={form.phone}
                    onChange={e => handleField('phone', e.target.value)}
                  />
                </div>
                <div className="settings-field">
                  <label className="settings-label">City <span className="settings-label-opt">(optional)</span></label>
                  <input
                    className="settings-input"
                    placeholder="e.g. Lahore"
                    value={form.city}
                    onChange={e => handleField('city', e.target.value)}
                  />
                </div>
              </div>

              <div className="settings-field">
                <label className="settings-label">Bio <span className="settings-label-opt">(optional)</span></label>
                <textarea
                  className="settings-input settings-textarea"
                  placeholder="A short note about yourself"
                  value={form.bio}
                  onChange={e => handleField('bio', e.target.value)}
                />
              </div>
            </div>

            <div className="settings-actions">
              <button className="dash-action__btn" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>

            <div className="settings-danger-zone">
              <p className="settings-danger-title">Account</p>
              <div className="settings-danger-row">
                <div>
                  <p className="settings-toggle-label">Sign out</p>
                  <p className="settings-toggle-desc">You'll need to log in again to access your dashboard.</p>
                </div>
                <button className="settings-danger-btn" onClick={handleLogoutEverywhere}>
                  Sign out
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="settings-panel">
            <p className="settings-panel-desc">Choose what AidBridge should notify you about.</p>
            <div className="settings-toggles">
              <div className="settings-toggle-row">
                <div className="settings-toggle-info">
                  <p className="settings-toggle-label">Email updates</p>
                  <p className="settings-toggle-desc">General announcements and platform news.</p>
                </div>
                <Toggle
                  checked={form.notifs.emailUpdates}
                  onChange={v => handleToggle('notifs', 'emailUpdates', v)}
                />
              </div>
              <div className="settings-toggle-row">
                <div className="settings-toggle-info">
                  <p className="settings-toggle-label">
                    {isDonor ? 'Donation status updates' : 'Request status updates'}
                  </p>
                  <p className="settings-toggle-desc">
                    {isDonor
                      ? 'Get notified when your donations are matched or fulfilled.'
                      : 'Get notified when your requests are matched or fulfilled.'}
                  </p>
                </div>
                <Toggle
                  checked={form.notifs.requestStatus}
                  onChange={v => handleToggle('notifs', 'requestStatus', v)}
                />
              </div>
              <div className="settings-toggle-row">
                <div className="settings-toggle-info">
                  <p className="settings-toggle-label">
                    {isDonor ? 'New request alerts' : 'New donation matches'}
                  </p>
                  <p className="settings-toggle-desc">
                    {isDonor
                      ? 'Be notified when recipients request items in your categories.'
                      : 'Be notified when new donations matching your needs become available.'}
                  </p>
                </div>
                <Toggle
                  checked={form.notifs.newDonationMatches}
                  onChange={v => handleToggle('notifs', 'newDonationMatches', v)}
                />
              </div>
            </div>

            <div className="settings-actions">
              <button className="dash-action__btn" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="settings-panel">
            <p className="settings-panel-desc">Control what information is visible to others on AidBridge.</p>
            <div className="settings-toggles">
              <div className="settings-toggle-row">
                <div className="settings-toggle-info">
                  <p className="settings-toggle-label">
                    {isDonor ? 'Show profile to recipients' : 'Show profile to donors'}
                  </p>
                  <p className="settings-toggle-desc">Your name will be visible alongside matched donations/requests.</p>
                </div>
                <Toggle
                  checked={form.privacy.showProfileToDonors}
                  onChange={v => handleToggle('privacy', 'showProfileToDonors', v)}
                />
              </div>
              <div className="settings-toggle-row">
                <div className="settings-toggle-info">
                  <p className="settings-toggle-label">Show city</p>
                  <p className="settings-toggle-desc">Display your city on your profile and matches.</p>
                </div>
                <Toggle
                  checked={form.privacy.showCity}
                  onChange={v => handleToggle('privacy', 'showCity', v)}
                />
              </div>
            </div>

            <div className="settings-actions">
              <button className="dash-action__btn" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function Sidebar({ user, navigate, isDonor }) {
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
        {isDonor ? (
          <>
            <Link to="/donations/new" className="dash-nav__item"><span>➕</span> New Donation</Link>
            <Link to="/donations/my" className="dash-nav__item"><span>📦</span> My Donations</Link>
            <Link to="/impact" className="dash-nav__item"><span>📊</span> Impact</Link>
          </>
        ) : (
          <>
            <Link to="/requests/my" className="dash-nav__item"><span>📋</span> My Requests</Link>
            <Link to="/requests/new" className="dash-nav__item"><span>➕</span> New Request</Link>
            <Link to="/requests/track" className="dash-nav__item"><span>🚚</span> Track Requests</Link>
          </>
        )}
        <Link to="/settings" className="dash-nav__item dash-nav__item--active"><span>⚙️</span> Settings</Link>
      </nav>
      <button className="dash-logout" onClick={handleLogout}>Sign Out</button>
    </aside>
  )
}
