import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../api'

const STORAGE_KEY = 'donorhub-user'

function Login() {
  const navigate = useNavigate()

  const [role, setRole] =
    useState('donor')

  const [email, setEmail] =
    useState('')

  const [password, setPassword] =
    useState('')

  const [loading, setLoading] =
    useState(false)

  const [error, setError] =
    useState('')

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
        <h1>DonorHub Login</h1>

        <form onSubmit={handleSubmit}>

          <select
            value={role}
            onChange={(e) =>
              setRole(e.target.value)
            }
            style={{
              width: '100%',
              padding: '12px',
              marginBottom: '15px'
            }}
          >
            <option value="donor">
              Login as Donor
            </option>

            <option value="recipient">
              Login as Recipient
            </option>
          </select>

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