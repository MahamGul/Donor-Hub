import React, { useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import './Auth.css'

const STORAGE_KEY = 'aidbridge-user'
const API_BASE    = 'http://localhost:8000'

function Login() {
  const navigate       = useNavigate()
  const { role = 'donor' } = useParams()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const isRecipient = role === 'recipient'

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
      navigate('/dashboard')

    } catch {
      setError('Cannot reach server. Make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      {/* Background layers */}
      <div className="auth-bg" />
      <div className="auth-glow" />

      {/* Back to home */}
      <Link to="/" className="auth-back">
        ← AidBridge
      </Link>

      <div className="auth-card">
        {/* Role badge */}
        <div className={`auth-role-badge ${isRecipient ? 'auth-role-badge--recipient' : ''}`}>
          {isRecipient ? '🤲 Recipient Portal' : '💛 Donor Portal'}
        </div>

        <h1 className="auth-title">
          {isRecipient ? 'Request Aid' : 'Start Giving'}
        </h1>
        <p className="auth-subtitle">
          {isRecipient
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

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading ? (
              <span className="auth-spinner" />
            ) : (
              isRecipient ? 'Sign In as Recipient' : 'Sign In as Donor'
            )}
          </button>
        </form>

        {/* Role switcher */}
        <div className="auth-switch-role">
          {isRecipient ? (
            <>Looking to donate? <Link to="/login/donor">Donor portal →</Link></>
          ) : (
            <>Need help? <Link to="/login/recipient">Recipient portal →</Link></>
          )}
        </div>

        <div className="auth-divider" />

        <p className="auth-footer-link">
          No account yet?{' '}
          <Link to="/signup">Create one — it's free</Link>
        </p>
      </div>
    </div>
  )
}

export default Login
