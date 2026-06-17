import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import DonorDashboardLayout from '../components/DonorDashboardLayout'
import './Dashboard.css'

const STATUS_FILTERS   = ['All', 'Pending', 'Fulfilled', 'Expired']
const CATEGORY_FILTERS = ['All', 'Food', 'Education', 'Medicine', 'Funds', 'Blood', 'Clothes']

function MyDonations({ donations, setDonations }) {
  const [statusFilter, setStatusFilter] = useState('All')
  const [catFilter,    setCatFilter]    = useState('All')
  const [search,       setSearch]       = useState('')
  const [expanded,     setExpanded]     = useState(null)

  const visible = donations.filter(d => {
    const matchStatus = statusFilter === 'All' || d.status === statusFilter
    const matchCat    = catFilter    === 'All' || d.category === catFilter
    const matchSearch =
      !search ||
      d.label?.toLowerCase().includes(search.toLowerCase()) ||
      d.category?.toLowerCase().includes(search.toLowerCase()) ||
      d.title?.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchCat && matchSearch
  })

  return (
    <>
      <div className="donations-page-header">
        <div>
          <h2 className="donations-page-title">My Donations</h2>
          <p className="donations-page-sub">{donations.length} donation{donations.length !== 1 ? 's' : ''} total</p>
        </div>
        <Link to="/donations/new" className="dash-action__btn">+ New Donation</Link>
      </div>

      {/* ── Filters ── */}
      <div className="donations-toolbar">
        <div className="donations-search">
          <span className="donations-search__icon">🔍</span>
          <input
            type="text"
            placeholder="Search donations…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="donations-search__input"
          />
        </div>

        <div className="filter-row">
          <div className="filter-group">
            {STATUS_FILTERS.map(f => (
              <button
                key={f}
                className={`filter-btn ${statusFilter === f ? 'filter-btn--active' : ''}`}
                onClick={() => setStatusFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="filter-group">
            {CATEGORY_FILTERS.map(c => (
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

      {/* ── Empty state ── */}
      {visible.length === 0 ? (
        <div className="donations-empty">
          <span>📭</span>
          <p>{donations.length === 0 ? "You haven't made any donations yet." : "No donations match your filters."}</p>
          <Link
            to="/donations/new"
            className="dash-action__btn"
            style={{ marginTop: 8, fontSize: 12, padding: '10px 20px' }}
          >
            Make your first donation
          </Link>
        </div>
      ) : (
        <div className="donations-list">
          {visible.map(d => {
            const pillClass =
              d.status === 'Fulfilled' ? 'pill pill--green' :
              d.status === 'Expired'   ? 'pill pill--red'   :
              'pill pill--amber'

            return (
              <div
                key={d.id}
                className={`donation-card ${expanded === d.id ? 'donation-card--open' : ''}`}
              >
                <div
                  className="donation-card__row"
                  onClick={() => setExpanded(expanded === d.id ? null : d.id)}
                >
                  <span className="donation-card__icon">{d.icon}</span>
                  <div className="donation-card__info">
                    <p className="donation-card__label">{d.label}</p>
                    <p className="donation-card__meta">{d.date}</p>
                  </div>
                  <span><span className="cat-badge">{d.category}</span></span>
                  <span className={pillClass}>{d.status}</span>
                  <span className="donation-card__chevron">{expanded === d.id ? '▲' : '▼'}</span>
                </div>

                {expanded === d.id && (
                  <div className="donation-card__detail">
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="detail-item__label">Location</span>
                        <span className="detail-item__val">{d.location}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-item__label">Impact</span>
                        <span className="detail-item__val">{d.impact}</span>
                      </div>
                      {d.note && d.note !== 'No notes provided.' && (
                        <div className="detail-item">
                          <span className="detail-item__label">Note</span>
                          <span className="detail-item__val">{d.note}</span>
                        </div>
                      )}

                      {/* Category-specific extras */}
                      {d.category === 'Blood' && d.details?.bloodGroups?.length > 0 && (
                        <div className="detail-item">
                          <span className="detail-item__label">Blood Group</span>
                          <span className="detail-item__val">{d.details.bloodGroups.join(', ')}</span>
                        </div>
                      )}
                      {d.category === 'Medicine' && d.details?.medicines?.length > 0 && (
                        <div className="detail-item">
                          <span className="detail-item__label">Medicines</span>
                          <span className="detail-item__val">{d.details.medicines.join(', ')}</span>
                        </div>
                      )}
                      {d.category === 'Food' && d.details?.items?.length > 0 && (
                        <div className="detail-item">
                          <span className="detail-item__label">Items</span>
                          <span className="detail-item__val">{d.details.items.join(', ')}</span>
                        </div>
                      )}
                      {d.category === 'Funds' && d.details?.amount && (
                        <div className="detail-item">
                          <span className="detail-item__label">Amount</span>
                          <span className="detail-item__val">
                            {d.details.amount} {d.details.currency || ''}
                          </span>
                        </div>
                      )}
                      {d.category === 'Education' && d.details?.subjects?.length > 0 && (
                        <div className="detail-item">
                          <span className="detail-item__label">Subjects</span>
                          <span className="detail-item__val">{d.details.subjects.join(', ')}</span>
                        </div>
                      )}
                      {d.category === 'Clothes' && d.details?.type && (
                        <div className="detail-item">
                          <span className="detail-item__label">Type / Size</span>
                          <span className="detail-item__val">
                            {d.details.type}{d.details.size ? ` · ${d.details.size}` : ''}
                          </span>
                        </div>
                      )}
                    </div>

                    {d.status === 'Pending' && (
                      <div className="donation-card__pending-note">
                        ⏳ Awaiting recipient match — we'll notify you once paired.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}

export default function DonorDonations() {
  return (
    <DonorDashboardLayout activePage="donations">
      {({ donations, setDonations }) => (
        <MyDonations donations={donations} setDonations={setDonations} />
      )}
    </DonorDashboardLayout>
  )
}