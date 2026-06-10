import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../api'
import React from 'react'
const STORAGE_KEY = 'donorhub-user'

function Login() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()

    setError('')
    setLoading(true)

    try {
      const data = await login(email, password)

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(data.user)
      )

      navigate('/dashboard')
    } catch (err) {
      setError('Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>DonorHub Login</h1>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Enter Email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            required
          />

          <input
            type="password"
            placeholder="Enter Password"
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
            {loading ? 'Signing In...' : 'Login'}
          </button>

          {error && (
            <p className="error">{error}</p>
          )}
        </form>
      </div>
    </div>
  )
}

export default Login