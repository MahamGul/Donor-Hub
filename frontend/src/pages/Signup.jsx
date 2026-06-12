import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import './Auth.css'

const API_BASE = 'http://localhost:8000'

function Signup() {
  const navigate = useNavigate()

  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [role,     setRole]     = useState('donor')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/signup`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name, email, password, role }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.detail || 'Signup failed')
        return
      }

      // Redirect to login with their chosen role
      navigate(`/login/${role}`)

    } catch {
      setError('Cannot reach server. Make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-bg" />
      <div className="auth-glow" />

      <Link to="/" className="auth-back">
        ← AidBridge
      </Link>

      <div className="auth-card auth-card--wide">
        <div className="auth-role-badge">
          🌉 Join AidBridge
        </div>

        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">
          Choose your role and start making a difference today.
        </p>

        {/* Role toggle */}
        <div className="auth-role-toggle">
          <button
            type="button"
            className={`auth-role-btn ${role === 'donor' ? 'auth-role-btn--active' : ''}`}
            onClick={() => setRole('donor')}
          >
            💛 I want to Donate
          </button>
          <button
            type="button"
            className={`auth-role-btn ${role === 'recipient' ? 'auth-role-btn--active' : ''}`}
            onClick={() => setRole('recipient')}
          >
            🤲 I need Help
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="name">Full name</label>
            <input
              id="name"
              type="text"
              placeholder="Ali Hassan"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>

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
              placeholder="Min. 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="confirm">Confirm password</label>
            <input
              id="confirm"
              type="password"
              placeholder="Repeat your password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
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
              `Create Account as ${role === 'donor' ? 'Donor' : 'Recipient'}`
            )}
          </button>
        </form>

        <div className="auth-divider" />

        <p className="auth-footer-link">
          Already have an account?{' '}
          <Link to="/login/donor">Sign in →</Link>
        </p>
      </div>
    </div>
  )
}

export default Signup