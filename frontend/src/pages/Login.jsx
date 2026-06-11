import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { login } from '../api'

const STORAGE_KEY = 'donorhub-user'

function Login() {
  const navigate = useNavigate()
  const { role } = useParams()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()

    setError('')
    setLoading(true)

    try {
      const data = await login(
        email,
        password,
        role
      )

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(data.user)
      )

      navigate('/dashboard')
    } catch (err) {
      if (
        err.response &&
        err.response.data
      ) {
        setError(
          err.response.data.detail
        )
      } else {
        setError('Login failed')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>
          {role === 'recipient'
            ? 'Login as Recipient'
            : 'Login as Donor'}
        </h1>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            required
          />

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? 'Signing In...'
              : 'Login'}
          </button>

          {error && (
            <p className="error">
              {error}
            </p>
          )}
        </form>
      </div>
    </div>
  )
}

export default Login