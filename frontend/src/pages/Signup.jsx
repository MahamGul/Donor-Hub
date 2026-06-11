import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signup } from '../api'

const STORAGE_KEY = 'donorhub-user'

function Signup() {
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('donor')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()

    setError('')
    setLoading(true)

    try {
      const data = await signup({
        name,
        email,
        password,
        role
      })

      // optional: store user immediately OR send to login
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(data.user || { name, email, role })
      )

      // better UX: go to login page after signup
      navigate(`/login/${role}`)
    } catch (err) {
      if (err.response?.data?.detail) {
        setError(err.response.data.detail)
      } else {
        setError('Signup failed')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Create Account</h1>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {/* Role selection */}
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required
          >
            <option value="donor">Donor</option>
            <option value="recipient">Recipient</option>
          </select>

          <button type="submit" disabled={loading}>
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>

          {error && <p className="error">{error}</p>}
        </form>

        <p style={{ marginTop: '10px' }}>
          Already have an account?{' '}
          <span
            style={{ cursor: 'pointer', color: 'blue' }}
            onClick={() => navigate('/login/donor')}
          >
            Login
          </span>
        </p>
      </div>
    </div>
  )
}

export default Signup