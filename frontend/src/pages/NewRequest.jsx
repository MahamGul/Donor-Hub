import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import './Newdonations.css'

const STORAGE_KEY = 'aidbridge-user'
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

const CATEGORIES = [
  {
    id: 'Food',
    icon: '🍲',
    label: 'Food',
    description: 'Receive a food package with items, expiry date, and storage info.',
    renderFields: () => null,
    isValid: () => true,
    buildDetails: () => ({}),
  },
  {
    id: 'Funds',
    icon: '💰',
    label: 'Funds',
    description: 'Request financial assistance (up to PKR 5,000) directly to your bank.',
    renderFields: (form, onChange) => (
      <>
        <div className="nd-field">
          <label className="nd-label">Account / wallet number <span className="nd-req">*</span></label>
          <input
            className="nd-input"
            placeholder="e.g. 03001234567 or IBAN"
            value={form.details.accountNumber || ''}
            onChange={e => onChange('accountNumber', e.target.value)}
          />
        </div>
        <div className="nd-field">
          <label className="nd-label">Account holder name <span className="nd-req">*</span></label>
          <input
            className="nd-input"
            placeholder="e.g. Ali Hassan"
            value={form.details.accountName || ''}
            onChange={e => onChange('accountName', e.target.value)}
          />
        </div>
        <div className="nd-field">
          <label className="nd-label">Bank / wallet provider <span className="nd-req">*</span></label>
          <select
            className="nd-input nd-select"
            value={form.details.bankProvider || ''}
            onChange={e => onChange('bankProvider', e.target.value)}
          >
            <option value="" disabled>Select provider</option>
            <option value="EasyPaisa">EasyPaisa</option>
            <option value="JazzCash">JazzCash</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <p className="nd-hint">A maximum of PKR 5,000 can be allocated per request, subject to available funds.</p>
      </>
    ),
    isValid: (form) =>
      form.details.accountNumber && form.details.accountName && form.details.bankProvider,
    buildDetails: (details) => ({
      bankDetails: {
        accountNumber: details.accountNumber,
        accountName: details.accountName,
        bankProvider: details.bankProvider,
      },
    }),
  },
  {
    id: 'Education',
    icon: '📚',
    label: 'Education',
    description: 'Request books matching your grade and subject.',
    renderFields: (form, onChange) => (
      <>
        <div className="nd-field">
          <label className="nd-label">Grade / Level <span className="nd-req">*</span></label>
          <select
            className="nd-input nd-select"
            value={form.details.grade || ''}
            onChange={e => onChange('grade', e.target.value)}
          >
            <option value="" disabled>Select grade</option>
            <option value="Primary (1–5)">Primary (1–5)</option>
            <option value="Middle (6–8)">Middle (6–8)</option>
            <option value="Matric (9–10)">Matric (9–10)</option>
            <option value="Intermediate (11–12)">Intermediate (11–12)</option>
            <option value="Undergraduate">Undergraduate</option>
            <option value="Postgraduate">Postgraduate</option>
          </select>
        </div>
        <div className="nd-field">
          <label className="nd-label">Subject <span className="nd-req">*</span></label>
          <input
            className="nd-input"
            placeholder="e.g. Programming"
            value={form.details.subject || ''}
            onChange={e => onChange('subject', e.target.value)}
          />
        </div>
      </>
    ),
    isValid: (form) => form.details.grade && form.details.subject,
    buildDetails: (details) => ({
      grade: details.grade,
      subject: details.subject,
    }),
  },
  {
    id: 'Blood',
    icon: '🩸',
    label: 'Blood',
    description: 'Find a compatible blood donor based on your blood type.',
    renderFields: (form, onChange) => (
      <div className="nd-field">
        <label className="nd-label">Your blood group <span className="nd-req">*</span></label>
        <select
          className="nd-input nd-select"
          value={form.details.bloodGroup || ''}
          onChange={e => onChange('bloodGroup', e.target.value)}
        >
          <option value="" disabled>Select blood group</option>
          {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </div>
    ),
    isValid: (form) => form.details.bloodGroup,
    buildDetails: (details) => ({
      bloodGroup: details.bloodGroup,
    }),
  },
  {
    id: 'Clothes',
    icon: '👕',
    label: 'Clothes',
    description: 'Request clothing matching your gender and season needs.',
    renderFields: (form, onChange) => (
      <>
        <div className="nd-field">
          <label className="nd-label">Type <span className="nd-req">*</span></label>
          <select
            className="nd-input nd-select"
            value={form.details.type || ''}
            onChange={e => onChange('type', e.target.value)}
          >
            <option value="" disabled>Select type</option>
            <option value="Winter">Winter</option>
            <option value="Summer">Summer</option>
            <option value="Children">Children</option>
            <option value="Women">Women</option>
            <option value="Men">Men</option>
          </select>
        </div>
        <div className="nd-field">
          <label className="nd-label">Size (optional)</label>
          <select
            className="nd-input nd-select"
            value={form.details.size || ''}
            onChange={e => onChange('size', e.target.value)}
          >
            <option value="">Any size</option>
            {['XS','S','M','L','XL','XXL'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </>
    ),
    isValid: (form) => form.details.type,
    buildDetails: (details) => ({
      type: details.type,
      size: details.size || null,
    }),
  },
  {
    id: 'Medicine',
    icon: '💊',
    label: 'Medicine',
    description: 'Request a specific medicine if currently available.',
    renderFields: (form, onChange) => (
      <div className="nd-field">
        <label className="nd-label">Medicine name <span className="nd-req">*</span></label>
        <input
          className="nd-input"
          placeholder="e.g. Panadol"
          value={form.details.medicineName || ''}
          onChange={e => onChange('medicineName', e.target.value)}
        />
      </div>
    ),
    isValid: (form) => form.details.medicineName,
    buildDetails: (details) => ({
      medicineName: details.medicineName,
    }),
  },
]

function StepDot({ n, current }) {
  const done = current > n
  const active = current === n
  return (
    <div className={`step-dot ${active ? 'step-dot--active' : ''} ${done ? 'step-dot--done' : ''}`}>
      {done ? '✓' : n}
    </div>
  )
}

function ReviewRow({ label, value }) {
  if (!value && value !== 0) return null
  return (
    <div className="nd-review__row">
      <span className="nd-review__key">{label}</span>
      <span className="nd-review__val">
        {Array.isArray(value) ? value.join(', ') : String(value)}
      </span>
    </div>
  )
}

export default function NewRequest() {
  const navigate = useNavigate()
  const userRaw = localStorage.getItem(STORAGE_KEY)
  const user = userRaw ? JSON.parse(userRaw) : null

  const [step, setStep] = useState(1)
  const [cat, setCat] = useState(null)
  const [form, setForm] = useState({ details: {} })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  if (!user || user.role !== 'recipient') {
    navigate('/login/recipient')
    return null
  }

  const handleCatSelect = (c) => {
    setCat(c)
    setForm({ details: {} })
    setError('')
    setStep(2)
  }

  const handleDetailChange = (field, value) => {
    setForm(prev => ({ ...prev, details: { ...prev.details, [field]: value } }))
  }

  const canProceed = () => cat?.isValid(form)

  const handleSubmit = async () => {
    setError('')
    setLoading(true)
    try {
      const payload = {
        recipientId: user.id,
        category: cat.id,
        details: cat.buildDetails(form.details),
      }
      const res = await fetch(`${API_URL}/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to submit request')
      }
      setResult(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (result) {
    return (
      <div className="nd-root">
        <Sidebar user={user} navigate={navigate} />
        <main className="nd-main">
          <div className="nd-success">
            <div className="nd-success__icon">🎉</div>
            <h2>Request fulfilled!</h2>
            <p>{result.message}</p>

            <div className="nd-review" style={{ textAlign: 'left', marginBottom: '32px' }}>
              {Object.entries(result.details)
                .filter(([, v]) => v !== '' && v !== null && v !== undefined &&
                  !(Array.isArray(v) && v.length === 0) &&
                  typeof v !== 'object')
                .map(([k, v]) => (
                  <ReviewRow
                    key={k}
                    label={k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                    value={v}
                  />
                ))}
            </div>

            <div className="nd-success__actions">
              <button className="nd-btn nd-btn--primary" onClick={() => navigate('/dashboard')}>
                Back to Dashboard
              </button>
              <button className="nd-btn nd-btn--ghost" onClick={() => { setResult(null); setStep(1); setCat(null) }}>
                Make another request
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="nd-root">
      <Sidebar user={user} navigate={navigate} />

      <main className="nd-main">
        <header className="nd-header">
          <div>
            <p className="nd-eyebrow">🤝 Recipient Account</p>
            <h1 className="nd-title">New Request</h1>
          </div>
          <div className="nd-steps">
            <StepDot n={1} current={step} />
            <div className="nd-steps__line" />
            <StepDot n={2} current={step} />
            <div className="nd-steps__line" />
            <StepDot n={3} current={step} />
          </div>
        </header>

        {step === 1 && (
          <section className="nd-section">
            <h2 className="nd-section__title">What do you need?</h2>
            <div className="nd-cat-grid">
              {CATEGORIES.map(c => (
                <button key={c.id} className="nd-cat-card" onClick={() => handleCatSelect(c)}>
                  <span className="nd-cat-card__icon">{c.icon}</span>
                  <span className="nd-cat-card__label">{c.label}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {step === 2 && cat && (
          <section className="nd-section">
            <button className="nd-back" onClick={() => setStep(1)}>← Back</button>
            <h2 className="nd-section__title">{cat.icon} {cat.label}</h2>
            <p className="nd-hint" style={{ marginBottom: '20px' }}>{cat.description}</p>

            <div className="nd-form">
              {cat.renderFields(form, handleDetailChange)}

              <button
                className="nd-btn nd-btn--primary nd-btn--full"
                disabled={!canProceed()}
                onClick={() => setStep(3)}
              >
                Review Request →
              </button>
            </div>
          </section>
        )}

        {step === 3 && cat && (
          <section className="nd-section">
            <button className="nd-back" onClick={() => setStep(2)}>← Back</button>
            <h2 className="nd-section__title">Review & Confirm</h2>

            <div className="nd-review">
              <ReviewRow label="Category" value={`${cat.icon} ${cat.label}`} />
              {Object.entries(form.details)
                .filter(([, v]) => v !== '' && v !== undefined && v !== null)
                .map(([k, v]) => (
                  <ReviewRow
                    key={k}
                    label={k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                    value={v}
                  />
                ))}
              <ReviewRow label="Recipient" value={user.name} />
            </div>

            {error && <p className="nd-error">{error}</p>}

            <button
              className="nd-btn nd-btn--primary nd-btn--full"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Submitting…' : 'Submit Request ✓'}
            </button>
          </section>
        )}
      </main>
    </div>
  )
}

function Sidebar({ user, navigate }) {
  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY)
    navigate('/')
  }
  return (
    <aside className="dash-sidebar">
      <Link to="/" className="dash-logo">Aid<span>Bridge</span></Link>
      <nav className="dash-nav">
        <span className="dash-nav__label">Menu</span>
        <Link to="/dashboard" className="dash-nav__item"><span>🏠</span> Overview</Link>
<Link to="/requests/my" className="dash-nav__item"><span>📋</span> My Requests</Link>
<Link to="/requests/new" className="dash-nav__item dash-nav__item--active"><span>➕</span> New Request</Link>
<Link to="/requests/track" className="dash-nav__item"><span>🚚</span> Track Requests</Link>
<Link to="/feedback" className="dash-nav__item"><span>💬</span> Feedback</Link>
<Link to="/settings" className="dash-nav__item"><span>⚙️</span> Settings</Link>
      </nav>
      <button className="dash-logout" onClick={handleLogout}>Sign Out</button>
    </aside>
  )
}