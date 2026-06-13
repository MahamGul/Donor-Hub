import React from 'react'
import DonorDashboardLayout from '../components/DonorDashboardLayout'
import './Dashboard.css'

function Impact({ donations }) {
  const delivered = donations.filter(d => d.status === 'Delivered')
  const peopleHelped = delivered.reduce((s, d) => s + (parseInt(d.impact) || 0), 0)
  const cities = [...new Set(delivered.map(d => d.location).filter(l => l !== '—'))]

  const catCounts = donations.reduce((acc, d) => {
    acc[d.category] = (acc[d.category] || 0) + 1
    return acc
  }, {})
  const catMax = Math.max(...Object.values(catCounts), 1)

  const catColours = { Food: '#e8a020', Education: '#5b8dee', Health: '#3bc47f', Financial: '#a78bfa', Clothing: '#f87171' }

  const MONTHLY = [
    { month: 'Jan', donated: 2, helped: 6 },
    { month: 'Feb', donated: 5, helped: 14 },
    { month: 'Mar', donated: 3, helped: 9 },
    { month: 'Apr', donated: 7, helped: 22 },
    { month: 'May', donated: 4, helped: 11 },
    { month: 'Jun', donated: donations.length, helped: peopleHelped },
  ]
  const maxHelped = Math.max(...MONTHLY.map(m => m.helped), 1)

  const MILESTONES = [
    { icon: '🌱', label: 'First Donation',   desc: 'You started your giving journey',       done: donations.length >= 1 },
    { icon: '🤝', label: '5 Donations',      desc: 'Consistent contributor milestone',      done: donations.length >= 5 },
    { icon: '👥', label: '10 People Helped', desc: 'Directly impacted 10 lives',            done: peopleHelped >= 10 },
    { icon: '🏙️', label: '3 Cities Reached', desc: 'Donations spread across 3+ cities',     done: cities.length >= 3 },
    { icon: '🌟', label: '25 People Helped', desc: 'Silver impact milestone',               done: peopleHelped >= 25 },
    { icon: '🏆', label: '10 Donations',     desc: 'Gold donor — top 10% of contributors',  done: donations.length >= 10 },
  ]

  return (
    <>
      <div className="impact-header">
        <h2 className="impact-title">Your Impact</h2>
        <p className="impact-sub">A snapshot of the difference your donations have made.</p>
      </div>

      <section className="impact-hero-stats">
        <div className="impact-hero-card impact-hero-card--gold">
          <p className="impact-hero-card__num">{peopleHelped}</p>
          <p className="impact-hero-card__label">People Directly Helped</p>
        </div>
        <div className="impact-hero-card">
          <p className="impact-hero-card__num">{delivered.length}</p>
          <p className="impact-hero-card__label">Donations Delivered</p>
        </div>
        <div className="impact-hero-card">
          <p className="impact-hero-card__num">{cities.length}</p>
          <p className="impact-hero-card__label">Cities Reached</p>
        </div>
        <div className="impact-hero-card">
          <p className="impact-hero-card__num">{Math.round((delivered.length / (donations.length || 1)) * 100)}%</p>
          <p className="impact-hero-card__label">Delivery Rate</p>
        </div>
      </section>

      <div className="impact-two-col">
        <div className="impact-panel">
          <p className="impact-panel__title">People Helped — Monthly Trend</p>
          <div className="impact-bar-chart">
            {MONTHLY.map((m, i) => (
              <div key={i} className="impact-bar-col">
                <span className="impact-bar-val">{m.helped}</span>
                <div className="impact-bar-track">
                  <div
                    className="impact-bar-fill"
                    style={{ height: `${(m.helped / maxHelped) * 100}%` }}
                  />
                </div>
                <span className="impact-bar-month">{m.month}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="impact-panel">
          <p className="impact-panel__title">Donations by Category</p>
          <div className="impact-cat-list">
            {Object.entries(catCounts).map(([cat, count]) => (
              <div key={cat} className="impact-cat-row">
                <span className="impact-cat-name">{cat}</span>
                <div className="impact-cat-bar-track">
                  <div
                    className="impact-cat-bar-fill"
                    style={{ width: `${(count / catMax) * 100}%`, background: catColours[cat] || '#888' }}
                  />
                </div>
                <span className="impact-cat-count">{count}</span>
              </div>
            ))}
          </div>
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
            <div key={i} className={`impact-milestone ${m.done ? 'impact-milestone--done' : 'impact-milestone--locked'}`}>
              <span className="impact-milestone__icon">{m.icon}</span>
              <p className="impact-milestone__label">{m.label}</p>
              <p className="impact-milestone__desc">{m.desc}</p>
              {m.done
                ? <span className="impact-milestone__badge impact-milestone__badge--done">Achieved</span>
                : <span className="impact-milestone__badge impact-milestone__badge--locked">Locked</span>
              }
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
      {({ donations }) => <Impact donations={donations} />}
    </DonorDashboardLayout>
  )
}
