import React, { useState, useEffect } from 'react'
import DonorDashboardLayout from '../components/DonorDashboardLayout'
import { updateUser } from '../api'
import './Dashboard.css'

function Settings({ user, onUserUpdate }) {
  const [tab, setTab] = useState('profile')
  const [saved, setSaved] = useState(false)
  const [name, setName] = useState(user.name || '')
  const [email, setEmail] = useState(user.email || '')
  const [phone, setPhone] = useState(user.phone || '')
  const [city, setCity] = useState(user.city || '')
  const [bio, setBio] = useState(user.bio || '')
  const [notifs, setNotifs] = useState({
    donationDelivered: user.notifs?.donationDelivered ?? true,
    recipientMatched: user.notifs?.recipientMatched ?? true,
    weeklyDigest: user.notifs?.weeklyDigest ?? false,
    impactReport: user.notifs?.impactReport ?? true,
    newCampaigns: user.notifs?.newCampaigns ?? false,
  })
  const [privacy, setPrivacy] = useState({
    showProfile: user.privacy?.showProfile ?? true,
    showDonations: user.privacy?.showDonations ?? false,
    showImpact: user.privacy?.showImpact ?? true,
    anonymousDonation: user.privacy?.anonymousDonation ?? false,
  })

  useEffect(() => {
    setName(user.name || '')
    setEmail(user.email || '')
    setPhone(user.phone || '')
    setCity(user.city || '')
    setBio(user.bio || '')
    setNotifs({
      donationDelivered: user.notifs?.donationDelivered ?? true,
      recipientMatched: user.notifs?.recipientMatched ?? true,
      weeklyDigest: user.notifs?.weeklyDigest ?? false,
      impactReport: user.notifs?.impactReport ?? true,
      newCampaigns: user.notifs?.newCampaigns ?? false,
    })
    setPrivacy({
      showProfile: user.privacy?.showProfile ?? true,
      showDonations: user.privacy?.showDonations ?? false,
      showImpact: user.privacy?.showImpact ?? true,
      anonymousDonation: user.privacy?.anonymousDonation ?? false,
    })
  }, [user])

  const showSaved = () => { setSaved(true); setTimeout(() => setSaved(false), 2500) }

  const handleProfileSave = async () => {
    const updatedData = { name, email, phone, city, bio }
    try {
      const updated = await updateUser(user.id, updatedData)
      onUserUpdate(updated)
      showSaved()
    } catch (error) {
      console.error('Failed to update profile', error)
    }
  }

  const handleNotifSave = async () => {
    const updatedData = { notifs }
    try {
      const updated = await updateUser(user.id, updatedData)
      onUserUpdate(updated)
      showSaved()
    } catch (error) {
      console.error('Failed to update notification settings', error)
    }
  }

  const handlePrivacySave = async () => {
    const updatedData = { privacy }
    try {
      const updated = await updateUser(user.id, updatedData)
      onUserUpdate(updated)
      showSaved()
    } catch (error) {
      console.error('Failed to update privacy settings', error)
    }
  }

  const TABS = [
    { id: 'profile', label: '👤 Profile' },
    { id: 'notifications', label: '🔔 Notifications' },
    { id: 'privacy', label: '🔒 Privacy' },
  ]

  return (
    <>
      <div className="settings-header">
        <h2 className="settings-title">Settings</h2>
        <p className="settings-sub">Manage your account, preferences, and privacy.</p>
      </div>

      <div className="settings-tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`settings-tab ${tab === t.id ? 'settings-tab--active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {saved && (
        <div className="settings-toast">✅ Changes saved successfully.</div>
      )}

      {tab === 'profile' && (
        <div className="settings-panel">
          <div className="settings-avatar-row">
            <div className="settings-avatar">{user.name.charAt(0).toUpperCase()}</div>
            <div>
              <p className="settings-avatar-name">{user.name}</p>
              <p className="settings-avatar-role">{user.role === 'donor' ? 'Donor Account' : 'Recipient Account'}</p>
            </div>
          </div>

          <div className="settings-form">
            <div className="settings-field-row">
              <div className="settings-field">
                <label className="settings-label">Full Name</label>
                <input className="settings-input" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
              </div>
              <div className="settings-field">
                <label className="settings-label">Email Address</label>
                <input className="settings-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>
            </div>
            <div className="settings-field-row">
              <div className="settings-field">
                <label className="settings-label">Phone Number</label>
                <input className="settings-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+92 300 0000000" />
              </div>
              <div className="settings-field">
                <label className="settings-label">City</label>
                <input className="settings-input" value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Lahore" />
              </div>
            </div>
            <div className="settings-field">
              <label className="settings-label">Bio <span className="settings-label-opt">(optional)</span></label>
              <textarea
                className="settings-input settings-textarea"
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="A short note about why you donate…"
                rows={3}
              />
            </div>
          </div>

          <div className="settings-actions">
            <button className="dash-action__btn" onClick={handleProfileSave}>Save Profile</button>
          </div>
        </div>
      )}

      {tab === 'notifications' && (
        <div className="settings-panel">
          <p className="settings-panel-desc">Choose which email notifications you'd like to receive.</p>
          <div className="settings-toggles">
            {[
              { key: 'donationDelivered', label: 'Donation Delivered', desc: 'When your donation reaches a recipient' },
              { key: 'recipientMatched', label: 'Recipient Matched', desc: 'When a pending donation gets paired' },
              { key: 'weeklyDigest', label: 'Weekly Digest', desc: 'A summary of your activity every Monday' },
              { key: 'impactReport', label: 'Monthly Impact Report', desc: 'Your monthly giving stats & stories' },
              { key: 'newCampaigns', label: 'New Campaigns', desc: 'Alerts about urgent or featured donation drives' },
            ].map(({ key, label, desc }) => (
              <div key={key} className="settings-toggle-row">
                <div className="settings-toggle-info">
                  <p className="settings-toggle-label">{label}</p>
                  <p className="settings-toggle-desc">{desc}</p>
                </div>
                <button
                  className={`settings-toggle-btn ${notifs[key] ? 'settings-toggle-btn--on' : ''}`}
                  onClick={() => setNotifs(n => ({ ...n, [key]: !n[key] }))}
                  aria-pressed={notifs[key]}
                  aria-label={label}
                >
                  <span className="settings-toggle-thumb" />
                </button>
              </div>
            ))}
          </div>
          <div className="settings-actions">
            <button className="dash-action__btn" onClick={handleNotifSave}>Save Preferences</button>
          </div>
        </div>
      )}

      {tab === 'privacy' && (
        <div className="settings-panel">
          <p className="settings-panel-desc">Control what others can see about you on AidBridge.</p>
          <div className="settings-toggles">
            {[
              { key: 'showProfile', label: 'Public Profile', desc: 'Allow recipients to see your name & bio' },
              { key: 'showDonations', label: 'Visible Donation History', desc: 'Display your past donations publicly' },
              { key: 'showImpact', label: 'Share Impact Stats', desc: 'Show your people-helped count on your profile' },
              { key: 'anonymousDonation', label: 'Anonymous by Default', desc: 'New donations will hide your identity from recipients' },
            ].map(({ key, label, desc }) => (
              <div key={key} className="settings-toggle-row">
                <div className="settings-toggle-info">
                  <p className="settings-toggle-label">{label}</p>
                  <p className="settings-toggle-desc">{desc}</p>
                </div>
                <button
                  className={`settings-toggle-btn ${privacy[key] ? 'settings-toggle-btn--on' : ''}`}
                  onClick={() => setPrivacy(p => ({ ...p, [key]: !p[key] }))}
                  aria-pressed={privacy[key]}
                  aria-label={label}
                >
                  <span className="settings-toggle-thumb" />
                </button>
              </div>
            ))}
          </div>

          <div className="settings-danger-zone">
            <p className="settings-danger-title">Danger Zone</p>
            <div className="settings-danger-row">
              <div>
                <p className="settings-toggle-label">Delete Account</p>
                <p className="settings-toggle-desc">Permanently remove your account and all data. This cannot be undone.</p>
              </div>
              <button className="settings-danger-btn">Delete Account</button>
            </div>
          </div>

          <div className="settings-actions">
            <button className="dash-action__btn" onClick={handlePrivacySave}>Save Privacy Settings</button>
          </div>
        </div>
      )}
    </>
  )
}

export default function DonorSettings() {
  return (
    <DonorDashboardLayout activePage="settings">
      {({ user, onUserUpdate }) => <Settings user={user} onUserUpdate={onUserUpdate} />}
    </DonorDashboardLayout>
  )
}
