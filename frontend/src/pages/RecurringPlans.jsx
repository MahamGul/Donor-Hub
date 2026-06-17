import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import DonorDashboardLayout from '../components/DonorDashboardLayout'
import './RecurringPlans.css'

// NOTE: adjust this import path if your DashboardLayout component
// actually lives somewhere other than src/components/DashboardLayout.jsx

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

const CATEGORY_ICONS = {
  Food: '🍲',
  Education: '📚',
  Medicine: '💊',
  Funds: '💰',
  Blood: '🩸',
  Clothes: '👕',
}

const FREQUENCY_META = {
  daily:   { icon: '📅', label: 'Daily' },
  weekly:  { icon: '🗓', label: 'Weekly' },
  monthly: { icon: '📆', label: 'Monthly' },
}

const STATUS_META = {
  active:    { label: 'Active',    className: 'rp-badge--active' },
  paused:    { label: 'Paused',    className: 'rp-badge--paused' },
  cancelled: { label: 'Cancelled', className: 'rp-badge--cancelled' },
}

const STATUS_ORDER = { active: 0, paused: 1, cancelled: 2 }

function daysUntil(dateStr) {
  if (!dateStr) return null
  const target = new Date(`${dateStr}T00:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((target - today) / 86400000)
}

function formatNextRun(dateStr) {
  const diff = daysUntil(dateStr)
  if (diff === null) return '—'
  if (diff < 0) return `Overdue · was due ${dateStr}`
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  return `In ${diff} days · ${dateStr}`
}

function PlanCard({ plan, busy, onPause, onResume, onCancel }) {
  const icon   = CATEGORY_ICONS[plan.category] || '📦'
  const freq   = FREQUENCY_META[plan.frequency] || { icon: '🔁', label: plan.frequency }
  const status = STATUS_META[plan.status] || { label: plan.status, className: '' }

  return (
    <div className={`rp-card ${plan.status === 'cancelled' ? 'rp-card--cancelled' : ''}`}>
      <div className="rp-card__top">
        <div className="rp-card__title-row">
          <span className="rp-card__icon">{icon}</span>
          <div className="rp-card__title-text">
            <h3 className="rp-card__title">{plan.title}</h3>
            <p className="rp-card__category">{plan.category}</p>
          </div>
        </div>
        <span className={`rp-badge ${status.className}`}>{status.label}</span>
      </div>

      {plan.description && <p className="rp-card__desc">{plan.description}</p>}

      <div className="rp-card__meta">
        <div className="rp-meta-item">
          <span className="rp-meta-label">Frequency</span>
          <span className="rp-meta-value">{freq.icon} {freq.label}</span>
        </div>
        <div className="rp-meta-item">
          <span className="rp-meta-label">Next donation</span>
          <span className="rp-meta-value">
            {plan.status === 'active' ? formatNextRun(plan.nextRunDate) : '—'}
          </span>
        </div>
        <div className="rp-meta-item">
          <span className="rp-meta-label">Started</span>
          <span className="rp-meta-value">{plan.startDate}</span>
        </div>
        <div className="rp-meta-item">
          <span className="rp-meta-label">Ends</span>
          <span className="rp-meta-value">{plan.endDate || 'No end date'}</span>
        </div>
      </div>

      {plan.status !== 'cancelled' && (
        <div className="rp-card__actions">
          {plan.status === 'active' && (
            <button className="rp-btn rp-btn--ghost" disabled={busy} onClick={() => onPause(plan.id)}>
              ⏸ Pause
            </button>
          )}
          {plan.status === 'paused' && (
            <button className="rp-btn rp-btn--primary" disabled={busy} onClick={() => onResume(plan.id)}>
              ▶ Resume
            </button>
          )}
          <button className="rp-btn rp-btn--danger" disabled={busy} onClick={() => onCancel(plan.id)}>
            ✕ Cancel plan
          </button>
        </div>
      )}
    </div>
  )
}

function PlansContent({ user }) {
  const [plans, setPlans]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [busyId, setBusyId]   = useState(null)

  useEffect(() => {
    let cancelled = false

    const loadPlans = async () => {
      try {
        const res = await fetch(`${API_URL}/donation-plans/donor/${user.id}`)
        if (!res.ok) throw new Error('Failed to load your donation plans')
        const data = await res.json()
        if (!cancelled) setPlans(data)
      } catch (e) {
        if (!cancelled) setError(e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadPlans()
    return () => { cancelled = true }
  }, [user.id])

  const setStatus = async (planId, status) => {
    setBusyId(planId)
    setError('')
    try {
      const res = await fetch(`${API_URL}/donation-plans/${planId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || 'Failed to update this plan')
      }
      const updated = await res.json()
      setPlans(prev => prev.map(p => (p.id === planId ? updated : p)))
    } catch (e) {
      setError(e.message)
    } finally {
      setBusyId(null)
    }
  }

  const cancelPlan = async (planId) => {
    if (!window.confirm('Cancel this recurring plan? This stops all future donations and cannot be undone.')) {
      return
    }
    setBusyId(planId)
    setError('')
    try {
      const res = await fetch(`${API_URL}/donation-plans/${planId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || 'Failed to cancel this plan')
      }
      setPlans(prev => prev.filter(p => p.id !== planId))
    } catch (e) {
      setError(e.message)
    } finally {
      setBusyId(null)
    }
  }

  if (loading) {
    return <div className="rp-loading"><div className="rp-loading__spinner" /></div>
  }

  const activeCount = plans.filter(p => p.status === 'active').length
  const sorted = [...plans].sort((a, b) => {
    if (STATUS_ORDER[a.status] !== STATUS_ORDER[b.status]) {
      return STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
    }
    return (a.nextRunDate || '').localeCompare(b.nextRunDate || '')
  })

  return (
    <section className="rp-section">
      <div className="rp-section__header">
        <div>
          <h2 className="rp-section__title">Your Donation Plans</h2>
          <p className="rp-section__subtitle">
            {activeCount > 0
              ? `${activeCount} plan${activeCount === 1 ? '' : 's'} running automatically`
              : 'No active plans right now'}
          </p>
        </div>
        <Link to="/donations/new" className="rp-btn rp-btn--primary">+ New recurring donation</Link>
      </div>

      {error && <p className="rp-error">{error}</p>}

      {sorted.length === 0 ? (
        <div className="rp-empty">
          <div className="rp-empty__icon">🔁</div>
          <h3>No donation plans yet</h3>
          <p>Set up a recurring donation and it'll show up here — pause, resume, or cancel anytime.</p>
          <Link to="/donations/new" className="rp-btn rp-btn--primary">Start a recurring donation</Link>
        </div>
      ) : (
        <div className="rp-grid">
          {sorted.map(plan => (
            <PlanCard
              key={plan.id}
              plan={plan}
              busy={busyId === plan.id}
              onPause={(id) => setStatus(id, 'paused')}
              onResume={(id) => setStatus(id, 'active')}
              onCancel={cancelPlan}
            />
          ))}
        </div>
      )}
    </section>
  )
}

export default function RecurringPlans() {
  return (
    <DonorDashboardLayout activePage="plans">
      {({ user }) => <PlansContent user={user} />}
    </DonorDashboardLayout>
  )
}