import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import React from 'react'

const STORAGE_KEY = 'donorhub-user'

function Dashboard() {
  const navigate = useNavigate()

  const [user, setUser] = useState(null)

  useEffect(() => {
    const savedUser =
      localStorage.getItem(STORAGE_KEY)

    if (!savedUser) {
      navigate('/login')
      return
    }

    setUser(JSON.parse(savedUser))
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY)
    navigate('/login')
  }

  if (!user) {
    return <h2>Loading...</h2>
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Welcome, {user.name}</h1>

          <p>{user.email}</p>

          <p>
            Role:{' '}
            <strong>
              {user.role || 'donor'}
            </strong>
          </p>
        </div>

        <button
          className="logout-btn"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>Total Donations</h3>
          <h1>12</h1>
        </div>

        <div className="dashboard-card">
          <h3>Pending</h3>
          <h1>3</h1>
        </div>

        <div className="dashboard-card">
          <h3>Delivered</h3>
          <h1>9</h1>
        </div>
      </div>

      <div
        className="dashboard-card"
        style={{ marginTop: '25px' }}
      >
        <h2>Recent Activity</h2>

        <ul
          style={{
            marginTop: '15px',
            paddingLeft: '20px'
          }}
        >
          <li>Food Package Donation</li>
          <li>Books Donation</li>
          <li>Medical Kit Donation</li>
        </ul>
      </div>
    </div>
  )
}

export default Dashboard