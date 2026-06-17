import React, { useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import './Auth.css'

const STORAGE_KEY = 'aidbridge-user'
const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

function Login() {
  const navigate = useNavigate()
  const { role = 'donor' } = useParams()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const isRecipient = role === 'recipient'
  const isAdmin     = role === 'admin'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password, role }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.detail || 'Login failed')
        return
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user))

     if (data.user.role === 'admin') {
  navigate('/admin/dashboard')
} else {
  navigate('/dashboard')
}

    } catch {
      setError('Cannot reach server. Make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  const badgeClass = isAdmin
    ? 'auth-role-badge auth-role-badge--admin'
    : isRecipient
    ? 'auth-role-badge auth-role-badge--recipient'
    : 'auth-role-badge'

  return (
    <div className="auth-page">
      <div className="auth-bg" />
      <div className="auth-glow" />

      <Link to="/" className="auth-back">← AidBridge</Link>

      <div className="auth-card">
        <div className={badgeClass}>
          {isAdmin ? '🛡️ Admin Portal' : isRecipient ? '🤲 Recipient Portal' : '💛 Donor Portal'}
        </div>

        <h1 className="auth-title">
          {isAdmin ? 'Admin Access' : isRecipient ? 'Request Aid' : 'Start Giving'}
        </h1>
        <p className="auth-subtitle">
          {isAdmin
            ? 'Sign in to manage donations, requests, and platform activity.'
            : isRecipient
            ? 'Sign in to browse available donations and submit requests.'
            : 'Sign in to manage your donations and track impact.'}
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="auth-error">
              <span>⚠</span> {error}
            </div>
          )}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? (
              <span className="auth-spinner" />
            ) : isAdmin ? (
              'Sign In as Admin'
            ) : isRecipient ? (
              'Sign In as Recipient'
            ) : (
              'Sign In as Donor'
            )}
          </button>
        </form>

        {/* Role switcher */}
        {!isAdmin && (
          <div className="auth-switch-role">
            {isRecipient ? (
              <>Looking to donate? <Link to="/login/donor">Donor portal →</Link></>
            ) : (
              <>Need help? <Link to="/login/recipient">Recipient portal →</Link></>
            )}
          </div>
        )}

        <div className="auth-divider" />

        {!isAdmin ? (
          <p className="auth-footer-link">
            No account yet?{' '}
            <Link to="/signup">Create one — it's free</Link>
          </p>
        ) : (
          <p className="auth-footer-link" style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>
            Admin accounts are created by the system administrator only.
          </p>
        )}
      </div>
    </div>
  )
}

export default Login