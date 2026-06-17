import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import './AdminLayout.css'

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
const STORAGE_KEY = 'aidbridge-user'

const CATEGORY_ICONS = {
  Food: '🍱',
  Education: '📚',
  Clothes: '👕',
  Medicine: '💊',
  Funds: '💰',
  Blood: '🩸',
}

function statusBadge(status) {
  const map = {
    available: 'badge badge-green',
    pending: 'badge badge-amber',
    fulfilled: 'badge badge-blue',
    expired: 'badge badge-red',
    granted: 'badge badge-green',
    rejected: 'badge badge-red',
    invalid: 'badge badge-gray',
  }
  return map[status] || 'badge badge-gray'
}

function formatDate(date) {
  if (!date) return '—'
  try {
    return new Date(date).toLocaleDateString()
  } catch {
    return '—'
  }
}

// Strip boilerplate submission messages — show only admin-set messages
const BOILERPLATE_PHRASES = [
  'submitted and pending admin review',
  'if the requested item is not currently available',
  'we will get back to you',
]

function cleanMessage(msg) {
  if (!msg) return '—'
  const lower = msg.toLowerCase()
  const isBoilerplate = BOILERPLATE_PHRASES.some((p) => lower.includes(p))
  return isBoilerplate ? 'Pending admin review' : msg
}

function AdminDashboard() {
  const [stats, setStats] = useState({})
  const [recent, setRecent] = useState({
    donations: [],
    requests: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY))
    } catch {
      return null
    }
  })()

  const token = user?.id || user?._id || ''

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true)
        setError('')

        const headers = {
          'Content-Type': 'application/json',
          'x-user-id': token,
        }

        const [statsResponse, donationsResponse, requestsResponse] =
          await Promise.all([
            fetch(`${API_BASE}/admin/stats`, { headers }),
            fetch(`${API_BASE}/admin/donations?limit=5`, { headers }),
            fetch(`${API_BASE}/admin/requests?limit=5`, { headers }),
          ])

        if (!statsResponse.ok || !donationsResponse.ok || !requestsResponse.ok) {
          throw new Error('Failed to load dashboard data')
        }

        const statsData = await statsResponse.json()
        const donationsData = await donationsResponse.json()
        const requestsData = await requestsResponse.json()

        setStats(statsData || {})
        setRecent({
          donations: Array.isArray(donationsData)
            ? donationsData
            : donationsData?.donations || [],
          requests: Array.isArray(requestsData)
            ? requestsData
            : requestsData?.requests || [],
        })
      } catch (err) {
        console.error('Admin Dashboard Error:', err)
        setError('Failed to load dashboard data.')
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [token])

  if (loading) {
    return <div className="ap-loading">Loading dashboard...</div>
  }

  if (error) {
    return (
      <div className="ap-loading" style={{ color: '#dc2626' }}>
        {error}
      </div>
    )
  }

  return (
    <div>
      <div className="ap-header">
        <h1 className="ap-title">Dashboard</h1>
        <p className="ap-sub">Platform overview at a glance</p>
      </div>

      <div className="ap-stats">
        <div className="ap-stat">
          <p className="ap-stat-label">Total Donations</p>
          <p className="ap-stat-value blue">{stats.totalDonations ?? 0}</p>
        </div>

        <div className="ap-stat">
          <p className="ap-stat-label">Available</p>
          <p className="ap-stat-value green">{stats.availableDonations ?? 0}</p>
        </div>

        <div className="ap-stat">
          <p className="ap-stat-label">Fulfilled</p>
          <p className="ap-stat-value">{stats.fulfilledDonations ?? 0}</p>
        </div>

        <div className="ap-stat">
          <p className="ap-stat-label">Expired</p>
          <p className="ap-stat-value red">{stats.expiredDonations ?? 0}</p>
        </div>

        <div className="ap-stat">
          <p className="ap-stat-label">Total Requests</p>
          <p className="ap-stat-value blue">{stats.totalRequests ?? 0}</p>
        </div>

        <div className="ap-stat">
          <p className="ap-stat-label">Pending</p>
          <p className="ap-stat-value amber">{stats.pendingRequests ?? 0}</p>
        </div>

        <div className="ap-stat">
          <p className="ap-stat-label">Granted</p>
          <p className="ap-stat-value green">{stats.grantedRequests ?? 0}</p>
        </div>

        <div className="ap-stat">
          <p className="ap-stat-label">Total Users</p>
          <p className="ap-stat-value">{stats.totalUsers ?? 0}</p>
        </div>
      </div>

      <div className="ap-card">
        <div className="ap-card-header">
          <h2 className="ap-card-title">Recent Donations</h2>
          <Link
            to="/admin/donations"
            style={{ fontSize: 13, color: '#2563eb', textDecoration: 'none' }}
          >
            View all →
          </Link>
        </div>

        <div className="ap-table-wrap">
          <table className="ap-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recent.donations.length === 0 ? (
                <tr>
                  <td colSpan="4" className="ap-empty">
                    No donations yet.
                  </td>
                </tr>
              ) : (
                recent.donations.map((d) => (
                  <tr key={d._id || d.id}>
                    <td>{d.title || '—'}</td>
                    <td>
                      <span style={{ marginRight: 4 }}>
                        {CATEGORY_ICONS[d.category] || '📦'}
                      </span>
                      {d.category || '—'}
                    </td>
                    <td>
                      <span className={statusBadge(d.status)}>
                        {d.status || 'unknown'}
                      </span>
                    </td>
                    <td>{formatDate(d.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="ap-card">
        <div className="ap-card-header">
          <h2 className="ap-card-title">Recent Requests</h2>
          <Link
            to="/admin/requests"
            style={{ fontSize: 13, color: '#2563eb', textDecoration: 'none' }}
          >
            View all →
          </Link>
        </div>

        <div className="ap-table-wrap">
          <table className="ap-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Status</th>
                <th>Message</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recent.requests.length === 0 ? (
                <tr>
                  <td colSpan="4" className="ap-empty">
                    No requests yet.
                  </td>
                </tr>
              ) : (
                recent.requests.map((r) => (
                  <tr key={r._id || r.id}>
                    <td>
                      <span style={{ marginRight: 4 }}>
                        {CATEGORY_ICONS[r.category] || '📦'}
                      </span>
                      {r.category || '—'}
                    </td>
                    <td>
                      <span className={statusBadge(r.status)}>
                        {r.status || 'unknown'}
                      </span>
                    </td>
                    <td>{cleanMessage(r.message)}</td>
                    <td>{formatDate(r.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard