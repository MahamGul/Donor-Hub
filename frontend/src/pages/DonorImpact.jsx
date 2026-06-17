import React from 'react'
import DonorDashboardLayout from '../components/DonorDashboardLayout'
import './Dashboard.css'

function Impact({ donations }) {
  // normalizeDonation maps 'available' → 'Pending', 'fulfilled' → 'Fulfilled'
  const fulfilled = donations.filter(d => d.status === 'Fulfilled')
  const pending   = donations.filter(d => d.status === 'Pending')

  // cities already extracted by normalizeDonation via details.city etc.
  const formatCity = city =>
  city
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

const cities = [
  ...new Set(
    donations
      .map(d => d.location?.trim())
      .filter(l => l && l !== '—')
      .map(formatCity)
  )
]

  // category breakdown
  const catCounts = donations.reduce((acc, d) => {
    acc[d.category] = (acc[d.category] || 0) + 1
    return acc
  }, {})
  const catMax = Math.max(...Object.values(catCounts), 1)

  const catColours = {
    Food:      '#e8a020',
    Education: '#5b8dee',
    Blood:     '#f87171',
    Funds:     '#3bc47f',
    Clothes:   '#a78bfa',
    Medicine:  '#60a5fa',
  }

  // real monthly trend from createdAt
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const now = new Date()
  const MONTHLY = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
    return { month: monthNames[d.getMonth()], year: d.getFullYear(), count: 0 }
  })
  donations.forEach(d => {
    if (!d.date && !d.createdAt) return
    const dt = new Date(d.date || d.createdAt)
    MONTHLY.forEach(m => {
      if (monthNames[dt.getMonth()] === m.month && dt.getFullYear() === m.year) m.count++
    })
  })
  const maxCount = Math.max(...MONTHLY.map(m => m.count), 1)

  const fulfillmentRate = donations.length
    ? Math.round((fulfilled.length / donations.length) * 100)
    : 0

  const MILESTONES = [
    { icon: '🌱', label: 'First Donation',    desc: 'You started your giving journey',           done: donations.length >= 1 },
    { icon: '🤝', label: '3 Donations',        desc: 'Consistent contributor milestone',          done: donations.length >= 3 },
    { icon: '✅', label: 'First Fulfilled',    desc: 'Your first donation reached someone',       done: fulfilled.length >= 1 },
    { icon: '🌍', label: '2 Cities Reached',   desc: 'Your donations spread to multiple cities',  done: cities.length >= 2 },
    { icon: '🌟', label: '5 Donations',        desc: 'Silver donor milestone',                    done: donations.length >= 5 },
    { icon: '🏆', label: '10 Donations',       desc: 'Gold donor — top contributor',              done: donations.length >= 10 },
  ]

  return (
    <>
      <div className="impact-header">
        <h2 className="impact-title">Your Impact</h2>
        <p className="impact-sub">A snapshot of the difference your donations have made.</p>
      </div>

      <section className="impact-hero-stats">
        <div className="impact-hero-card impact-hero-card--gold">
          <p className="impact-hero-card__num">{donations.length}</p>
          <p className="impact-hero-card__label">Total Donations</p>
        </div>
        <div className="impact-hero-card">
          <p className="impact-hero-card__num">{fulfilled.length}</p>
          <p className="impact-hero-card__label">Fulfilled</p>
        </div>
        <div className="impact-hero-card">
          <p className="impact-hero-card__num">{pending.length}</p>
          <p className="impact-hero-card__label">Pending</p>
        </div>
        <div className="impact-hero-card">
          <p className="impact-hero-card__num">{fulfillmentRate}%</p>
          <p className="impact-hero-card__label">Fulfillment Rate</p>
        </div>
      </section>

      <div className="impact-two-col">
        <div className="impact-panel">
          <p className="impact-panel__title">Donation Activity — Last 6 Months</p>
          <div className="impact-bar-chart">
            {MONTHLY.map((m, i) => (
              <div key={i} className="impact-bar-col">
                <span className="impact-bar-val">{m.count > 0 ? m.count : ''}</span>
                <div className="impact-bar-track">
                  <div
                    className="impact-bar-fill"
                    style={{ height: `${(m.count / maxCount) * 100}%` }}
                  />
                </div>
                <span className="impact-bar-month">{m.month}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="impact-panel">
          <p className="impact-panel__title">Donations by Category</p>
          {Object.keys(catCounts).length === 0 ? (
            <p style={{ color: 'var(--text-muted, #888)', fontSize: '0.875rem', marginTop: '1rem' }}>
              No donations yet.
            </p>
          ) : (
            <div className="impact-cat-list">
              {Object.entries(catCounts).map(([cat, count]) => (
                <div key={cat} className="impact-cat-row">
                  <span className="impact-cat-name">{cat}</span>
                  <div className="impact-cat-bar-track">
                    <div
                      className="impact-cat-bar-fill"
                      style={{
                        width: `${(count / catMax) * 100}%`,
                        background: catColours[cat] || '#888',
                      }}
                    />
                  </div>
                  <span className="impact-cat-count">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {cities.length > 0 && (
        <div className="impact-panel">
          <p className="impact-panel__title">Cities You've Reached</p>
          <div className="impact-cities">
            {cities.map(city => (
              <div key={city} className="impact-city-tag">
                <span className="impact-city-dot" />
                {city}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="impact-panel">
        <p className="impact-panel__title">Milestones</p>
        <div className="impact-milestones">
          {MILESTONES.map((m, i) => (
            <div
              key={i}
              className={`impact-milestone ${m.done ? 'impact-milestone--done' : 'impact-milestone--locked'}`}
            >
              <span className="impact-milestone__icon">{m.icon}</span>
              <p className="impact-milestone__label">{m.label}</p>
              <p className="impact-milestone__desc">{m.desc}</p>
              {m.done
                ? <span className="impact-milestone__badge impact-milestone__badge--done">Achieved</span>
                : <span className="impact-milestone__badge impact-milestone__badge--locked">Locked</span>}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

export default function DonorImpact() {
  return (
    <DonorDashboardLayout activePage="impact">
      {({ donations }) => <Impact donations={donations || []} />}
    </DonorDashboardLayout>
  )
}