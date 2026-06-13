import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import DonorDashboardLayout from '../components/DonorDashboardLayout'
import './Dashboard.css'

const STATUS_FILTERS = ['All', 'Delivered', 'Pending']
const CAT_FILTERS = ['All', 'Food', 'Education', 'Health', 'Financial', 'Clothing']

function MyDonations({ donations }) {
  const [filter, setFilter] = useState('All')
  const [catFilter, setCatFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState(null)

  const visible = donations.filter(d => {
    const matchStatus = filter === 'All' || d.status === filter
    const matchCat = catFilter === 'All' || d.category === catFilter
    const matchSearch = d.label.toLowerCase().includes(search.toLowerCase()) ||
                        d.recipient.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchCat && matchSearch
  })

  return (
    <>
      <div className="donations-page-header">
        <div>
          <h2 className="donations-page-title">My Donations</h2>
          <p className="donations-page-sub">{donations.length} donations total</p>
        </div>
        <Link to="/donations/new" className="dash-action__btn">+ New Donation</Link>
      </div>

      <div className="donations-toolbar">
        <div className="donations-search">
          <span className="donations-search__icon">🔍</span>
          <input
            type="text"
            placeholder="Search donations or recipients…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="donations-search__input"
          />
        </div>
        <div className="filter-row">
          <div className="filter-group">
            {STATUS_FILTERS.map(f => (
              <button
                key={f}
                className={`filter-btn ${filter === f ? 'filter-btn--active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="filter-group">
            {CAT_FILTERS.map(c => (
              <button
                key={c}
                className={`filter-btn filter-btn--sm ${catFilter === c ? 'filter-btn--active' : ''}`}
                onClick={() => setCatFilter(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="donations-empty">
          <span>📭</span>
          <p>No donations match your filters.</p>
          <Link to="/donations/new" className="dash-action__btn" style={{ marginTop: 8, fontSize: 12, padding: '10px 20px' }}>
            Make your first donation
          </Link>
        </div>
      ) : (
        <div className="donations-list">
          {visible.map(d => (
            <div key={d.id} className={`donation-card ${expanded === d.id ? 'donation-card--open' : ''}`}>
              <div className="donation-card__row" onClick={() => setExpanded(expanded === d.id ? null : d.id)}>
                <span className="donation-card__icon">{d.icon}</span>
                <div className="donation-card__info">
                  <p className="donation-card__label">{d.label}</p>
                  <p className="donation-card__meta">{d.date} · {d.recipient}</p>
                </div>
                <span><span className="cat-badge">{d.category}</span></span>
                <span className="pill pill--amber">{d.status}</span>
                <span className="donation-card__chevron">{expanded === d.id ? '▲' : '▼'}</span>
              </div>
              {expanded === d.id && (
                <div className="donation-card__detail">
                  <div className="detail-grid">
                    <div className="detail-item"><span className="detail-item__label">Recipient</span><span className="detail-item__val">{d.recipient}</span></div>
                    <div className="detail-item"><span className="detail-item__label">Location</span><span className="detail-item__val">{d.location}</span></div>
                    <div className="detail-item"><span className="detail-item__label">Impact</span><span className="detail-item__val">{d.impact}</span></div>
                    <div className="detail-item"><span className="detail-item__label">Note</span><span className="detail-item__val">{d.note}</span></div>
                  </div>
                  {d.status === 'Pending' && (
                    <div className="donation-card__pending-note">
                      ⏳ Awaiting recipient match — we'll notify you once paired.
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  )
}

export default function DonorDonations() {
  return (
    <DonorDashboardLayout activePage="donations">
      {({ donations }) => <MyDonations donations={donations} />}
    </DonorDashboardLayout>
  )
}
