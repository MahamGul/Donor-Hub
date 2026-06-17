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
    titlePlaceholder: 'e.g. Monthly ration package',
    descPlaceholder: 'Describe the food items and who they are for…',
    renderFields: (form, onChange) => {
      const items = form.details.items || []
      const addItem = () => onChange('items', [...items, ''])
      const updateItem = (i, val) => {
        const next = [...items]; next[i] = val; onChange('items', next)
      }
      const removeItem = (i) => onChange('items', items.filter((_, idx) => idx !== i))

      return (
        <>
          <div className="nd-field">
            <label className="nd-label">Food items <span className="nd-req">*</span></label>
            {items.map((item, i) => (
              <div key={i} className="nd-tag-row">
                <input
                  className="nd-input nd-input--sm"
                  placeholder={`e.g. Rice, Flour, Oil`}
                  value={item}
                  onChange={e => updateItem(i, e.target.value)}
                />
                <button className="nd-remove" onClick={() => removeItem(i)} type="button">✕</button>
              </div>
            ))}
            <button className="nd-add-btn" onClick={addItem} type="button">+ Add item</button>
          </div>

          <div className="nd-field">
            <label className="nd-label">Number of packages <span className="nd-req">*</span></label>
            <input
              className="nd-input"
              type="number"
              min="1"
              placeholder="e.g. 10"
              value={form.details.quantity || ''}
              onChange={e => onChange('quantity', e.target.value)}
            />
          </div>

          <div className="nd-field">
            <label className="nd-label">Expiry date</label>
            <input
              className="nd-input"
              type="date"
              value={form.details.expiryDate || ''}
              onChange={e => onChange('expiryDate', e.target.value)}
            />
          </div>

          <div className="nd-field">
            <label className="nd-checkbox-label">
              <input
                type="checkbox"
                className="nd-checkbox"
                checked={!!form.details.frozen}
                onChange={e => onChange('frozen', e.target.checked)}
              />
              <span>Frozen item</span>
              <span className="nd-checkbox-hint">Requires cold storage / freezer</span>
            </label>
          </div>
        </>
      )
    },
    isValid: (form) =>
      (form.details.items || []).some(i => i.trim()) &&
      form.details.quantity,
    buildDetails: (details) => ({
      items:      (details.items || []).filter(i => i.trim()),
      quantity:   Number(details.quantity),
      expiryDate: details.expiryDate || null,
      frozen:     !!details.frozen,
    }),
  },

  {
    id: 'Education',
    icon: '📚',
    label: 'Education',
    titlePlaceholder: 'e.g. Programming Books for CS students',
    descPlaceholder: 'Who are these books for? Any specific level or institution?',
    renderFields: (form, onChange) => {
      const subjects = form.details.subjects || []
      const addSubject = () => onChange('subjects', [...subjects, ''])
      const updateSubject = (i, val) => {
        const next = [...subjects]; next[i] = val; onChange('subjects', next)
      }
      const removeSubject = (i) => onChange('subjects', subjects.filter((_, idx) => idx !== i))

      return (
        <>
          <div className="nd-field">
            <label className="nd-label">Number of books <span className="nd-req">*</span></label>
            <input
              className="nd-input"
              type="number"
              min="1"
              placeholder="e.g. 5"
              value={form.details.bookCount || ''}
              onChange={e => onChange('bookCount', e.target.value)}
            />
          </div>

          <div className="nd-field">
            <label className="nd-label">Grade / Level</label>
            <select
              className="nd-input nd-select"
              value={form.details.grade || ''}
              onChange={e => onChange('grade', e.target.value)}
            >
              <option value="">Select grade (optional)</option>
              <option value="Primary (1–5)">Primary (1–5)</option>
              <option value="Middle (6–8)">Middle (6–8)</option>
              <option value="Matric (9–10)">Matric (9–10)</option>
              <option value="Intermediate (11–12)">Intermediate (11–12)</option>
              <option value="Undergraduate">Undergraduate</option>
              <option value="Postgraduate">Postgraduate</option>
              <option value="All levels">All levels</option>
            </select>
          </div>

          <div className="nd-field">
            <label className="nd-label">Subjects</label>
            {subjects.map((s, i) => (
              <div key={i} className="nd-tag-row">
                <input
                  className="nd-input nd-input--sm"
                  placeholder="e.g. Programming"
                  value={s}
                  onChange={e => updateSubject(i, e.target.value)}
                />
                <button className="nd-remove" onClick={() => removeSubject(i)} type="button">✕</button>
              </div>
            ))}
            <button className="nd-add-btn" onClick={addSubject} type="button">+ Add subject</button>
          </div>
        </>
      )
    },
    isValid: (form) => form.details.bookCount,
    buildDetails: (details) => ({
      bookCount: Number(details.bookCount),
      grade:     details.grade || null,
      subjects:  (details.subjects || []).filter(s => s.trim()),
    }),
  },

  {
    id: 'Medicine',
    icon: '💊',
    label: 'Medicine',
    titlePlaceholder: 'e.g. Basic medicines for clinic',
    descPlaceholder: 'Any conditions or restrictions on use?',
    renderFields: (form, onChange) => (
      <>
        <div className="nd-field">
          <label className="nd-label">Medicine name <span className="nd-req">*</span></label>
          <input
            className="nd-input"
            placeholder="e.g. Panadol"
            value={form.details.medicineName || ''}
            onChange={e => onChange('medicineName', e.target.value)}
          />
        </div>

        <div className="nd-field">
          <label className="nd-label">Quantity (units/strips) <span className="nd-req">*</span></label>
          <input
            className="nd-input"
            type="number"
            min="1"
            placeholder="e.g. 20"
            value={form.details.quantity || ''}
            onChange={e => onChange('quantity', e.target.value)}
          />
        </div>

        <div className="nd-field">
          <label className="nd-label">Expiry date <span className="nd-req">*</span></label>
          <input
            className="nd-input"
            type="date"
            value={form.details.expiryDate || ''}
            onChange={e => onChange('expiryDate', e.target.value)}
          />
        </div>
      </>
    ),
    isValid: (form) =>
      form.details.medicineName &&
      form.details.quantity &&
      form.details.expiryDate,
    buildDetails: (details) => ({
      medicineName: details.medicineName,
      quantity: Number(details.quantity),
      expiryDate: details.expiryDate,
    }),
  },

  {
    id: 'Funds',
    icon: '💰',
    label: 'Funds',
    titlePlaceholder: 'e.g. Educational financial aid',
    descPlaceholder: 'What should the funds be used for?',
    renderFields: (form, onChange) => (
      <>
        <div className="nd-field">
          <label className="nd-label">Amount <span className="nd-req">*</span></label>
          <input
            className="nd-input"
            type="number"
            min="1"
            placeholder="e.g. 10000"
            value={form.details.amount || ''}
            onChange={e => onChange('amount', e.target.value)}
          />
        </div>

        <div className="nd-field">
          <label className="nd-label">Currency <span className="nd-req">*</span></label>
          <select
            className="nd-input nd-select"
            value={form.details.currency || 'PKR'}
            onChange={e => onChange('currency', e.target.value)}
          >
            <option value="PKR">PKR — Pakistani Rupee</option>
            <option value="USD">USD — US Dollar</option>
            <option value="GBP">GBP — British Pound</option>
            <option value="SAR">SAR — Saudi Riyal</option>
            <option value="AED">AED — UAE Dirham</option>
          </select>
        </div>

        <div className="nd-field">
          <label className="nd-label">Transfer method <span className="nd-req">*</span></label>
          <select
            className="nd-input nd-select"
            value={form.details.transferMethod || ''}
            onChange={e => onChange('transferMethod', e.target.value)}
          >
            <option value="" disabled>Select method</option>
            <option value="EasyPaisa">EasyPaisa</option>
            <option value="JazzCash">JazzCash</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Cash">Cash</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="nd-field">
          <label className="nd-label">Account / wallet number <span className="nd-req">*</span></label>
          <input
            className="nd-input"
            placeholder="e.g. 03001234567 or IBAN"
            value={form.details.accountNumber || ''}
            onChange={e => onChange('accountNumber', e.target.value)}
          />
          <span className="nd-hint">This is your donor account — recipient details are stored separately.</span>
        </div>

        <div className="nd-field">
          <label className="nd-label">Account holder name</label>
          <input
            className="nd-input"
            placeholder="e.g. Ali Hassan"
            value={form.details.accountName || ''}
            onChange={e => onChange('accountName', e.target.value)}
          />
        </div>
      </>
    ),
    isValid: (form) => form.details.amount && form.details.currency && form.details.transferMethod && form.details.accountNumber,
    buildDetails: (details) => ({
      amount:         Number(details.amount),
      currency:       details.currency || 'PKR',
      transferMethod: details.transferMethod,
      accountNumber:  details.accountNumber,
      accountName:    details.accountName || null,
    }),
  },

  {
    id: 'Blood',
    icon: '🩸',
    label: 'Blood',
    titlePlaceholder: 'e.g. Emergency blood donation available',
    descPlaceholder: 'Any availability windows or contact preferences?',
    renderFields: (form, onChange) => (
      <>
        <div className="nd-field">
          <label className="nd-label">Blood group <span className="nd-req">*</span></label>
          <select
            className="nd-input nd-select"
            value={form.details.bloodGroup || ''}
            onChange={e => onChange('bloodGroup', e.target.value)}
          >
            <option value="" disabled>Select blood group</option>
            {['A+','A−','B+','B−','AB+','AB−','O+','O−'].map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        <div className="nd-field">
          <label className="nd-label">City <span className="nd-req">*</span></label>
          <input
            className="nd-input"
            placeholder="e.g. Lahore"
            value={form.details.city || ''}
            onChange={e => onChange('city', e.target.value)}
          />
        </div>

        <div className="nd-field">
          <label className="nd-label">Hospital preference</label>
          <input
            className="nd-input"
            placeholder="e.g. Jinnah Hospital"
            value={form.details.hospitalPreference || ''}
            onChange={e => onChange('hospitalPreference', e.target.value)}
          />
        </div>
      </>
    ),
    isValid: (form) => form.details.bloodGroup && form.details.city,
    buildDetails: (details) => ({
      bloodGroup: details.bloodGroup,
      city: details.city,
      hospitalPreference: details.hospitalPreference || '',
    }),
  },

  {
    id: 'Clothes',
    icon: '👕',
    label: 'Clothes',
    titlePlaceholder: 'e.g. Winter clothes for needy families',
    descPlaceholder: 'Condition of clothes, any special notes?',
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
            <option value="All-season">All-season</option>
            <option value="Children">Children</option>
            <option value="Women">Women</option>
            <option value="Men">Men</option>
          </select>
        </div>

        <div className="nd-field">
          <label className="nd-label">Size <span className="nd-req">*</span></label>
          <select
            className="nd-input nd-select"
            value={form.details.size || ''}
            onChange={e => onChange('size', e.target.value)}
          >
            <option value="" disabled>Select size</option>
            {['XS','S','M','L','XL','XXL','Mixed'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="nd-field">
          <label className="nd-label">Quantity (pieces) <span className="nd-req">*</span></label>
          <input
            className="nd-input"
            type="number"
            min="1"
            placeholder="e.g. 15"
            value={form.details.quantity || ''}
            onChange={e => onChange('quantity', e.target.value)}
          />
        </div>
      </>
    ),
    isValid: (form) =>
      form.details.type && form.details.size && form.details.quantity,
    buildDetails: (details) => ({
      type: details.type,
      size: details.size,
      quantity: Number(details.quantity),
    }),
  },
]

/* ── Step indicator dot ── */
function StepDot({ n, current }) {
  const done   = current > n
  const active = current === n
  return (
    <div className={`step-dot ${active ? 'step-dot--active' : ''} ${done ? 'step-dot--done' : ''}`}>
      {done ? '✓' : n}
    </div>
  )
}

/* ── Review row helper ── */
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

/* ── Recurring toggle block ── */
function RecurringSection({ recurring, onChange }) {
  const today = new Date().toISOString().split('T')[0]
  return (
    <div className="nd-recurring">
      <label className="nd-checkbox-label nd-recurring__toggle">
        <input
          type="checkbox"
          className="nd-checkbox"
          checked={recurring.enabled}
          onChange={e => onChange({ ...recurring, enabled: e.target.checked })}
        />
        <span className="nd-recurring__label">🔁 Make this a recurring donation</span>
        <span className="nd-checkbox-hint">Automatically repeats on your chosen schedule</span>
      </label>

      {recurring.enabled && (
        <div className="nd-recurring__fields">
          <div className="nd-field">
            <label className="nd-label">Frequency <span className="nd-req">*</span></label>
            <div className="nd-freq-pills">
              {['daily', 'weekly', 'monthly'].map(f => (
                <button
                  key={f}
                  type="button"
                  className={`nd-freq-pill ${recurring.frequency === f ? 'nd-freq-pill--active' : ''}`}
                  onClick={() => onChange({ ...recurring, frequency: f })}
                >
                  {f === 'daily' ? '📅 Daily' : f === 'weekly' ? '🗓 Weekly' : '📆 Monthly'}
                </button>
              ))}
            </div>
          </div>

          <div className="nd-field-row">
            <div className="nd-field">
              <label className="nd-label">Start date <span className="nd-req">*</span></label>
              <input
                className="nd-input"
                type="date"
                min={today}
                value={recurring.startDate}
                onChange={e => onChange({ ...recurring, startDate: e.target.value })}
              />
            </div>
            <div className="nd-field">
              <label className="nd-label">End date <span className="nd-hint-inline">(optional)</span></label>
              <input
                className="nd-input"
                type="date"
                min={recurring.startDate || today}
                value={recurring.endDate}
                onChange={e => onChange({ ...recurring, endDate: e.target.value })}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════ */
export default function NewDonation() {
  const navigate = useNavigate()
  const userRaw  = localStorage.getItem(STORAGE_KEY)
  const user     = userRaw ? JSON.parse(userRaw) : null

  const [step,    setStep]    = useState(1)
  const [cat,     setCat]     = useState(null)
  const [form,    setForm]    = useState({ title: '', description: '', details: {} })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState(false)

  const today = new Date().toISOString().split('T')[0]
  const [recurring, setRecurring] = useState({
    enabled:   false,
    frequency: 'monthly',
    startDate: today,
    endDate:   '',
  })

  if (!user || user.role !== 'donor') {
    navigate('/login/donor')
    return null
  }

  const handleCatSelect = (c) => {
    setCat(c)
    const defaults = c.id === 'Funds' ? { currency: 'PKR' } : {}
    setForm({ title: '', description: '', details: defaults })
    setStep(2)
  }

  const handleDetailChange = (field, value) => {
    setForm(prev => ({ ...prev, details: { ...prev.details, [field]: value } }))
  }

  const canProceed = () => {
    if (!form.title.trim() || !cat?.isValid(form)) return false
    if (recurring.enabled && (!recurring.frequency || !recurring.startDate)) return false
    return true
  }

  const handleSubmit = async () => {
    setError('')
    setLoading(true)
    try {
      const builtDetails = cat.buildDetails(form.details)

      if (recurring.enabled) {
        // Create a donation PLAN instead of a one-off donation
        const payload = {
          donorId:     user.id,
          category:    cat.id,
          title:       form.title,
          description: form.description,
          details:     builtDetails,
          frequency:   recurring.frequency,
          startDate:   recurring.startDate,
          endDate:     recurring.endDate || null,
        }
        const res = await fetch(`${API_URL}/donation-plans`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(payload),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.detail || 'Failed to create donation plan')
        }
      } else {
        // Regular one-time donation
        const payload = {
          donorId:     user.id,
          category:    cat.id,
          title:       form.title,
          description: form.description,
          details:     builtDetails,
        }
        const res = await fetch(`${API_URL}/donations`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(payload),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.detail || 'Failed to submit donation')
        }
      }

      setSuccess(true)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  /* ── Success screen ── */
  if (success) {
    return (
      <div className="nd-root">
        <Sidebar user={user} navigate={navigate} />
        <main className="nd-main">
          <div className="nd-success">
            <div className="nd-success__icon">{recurring.enabled ? '🔁' : '🎉'}</div>
            <h2>{recurring.enabled ? 'Recurring plan created!' : 'Donation submitted!'}</h2>
            <p>
              {recurring.enabled
                ? `Your ${recurring.frequency} ${cat.label.toLowerCase()} donation is scheduled. The first one runs on ${recurring.startDate}.`
                : `Thank you, ${user.name.split(' ')[0]}. Your donation has been logged and will be matched with a recipient soon.`
              }
            </p>
            <div className="nd-success__actions">
              <button className="nd-btn nd-btn--primary" onClick={() => navigate('/dashboard')}>
                Back to Dashboard
              </button>
              {recurring.enabled && (
                <button className="nd-btn nd-btn--ghost" onClick={() => navigate('/dashboard/plans')}>
                  View My Plans
                </button>
              )}
              <button className="nd-btn nd-btn--ghost" onClick={() => { setSuccess(false); setStep(1); setCat(null); setRecurring({ enabled: false, frequency: 'monthly', startDate: today, endDate: '' }) }}>
                Donate again
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

        {/* ── Header ── */}
        <header className="nd-header">
          <div>
            <p className="nd-eyebrow">💛 Donor Account</p>
            <h1 className="nd-title">New Donation</h1>
          </div>
          <div className="nd-steps">
            <StepDot n={1} current={step} />
            <div className="nd-steps__line" />
            <StepDot n={2} current={step} />
            <div className="nd-steps__line" />
            <StepDot n={3} current={step} />
          </div>
        </header>

        {/* ── Step 1: pick category ── */}
        {step === 1 && (
          <section className="nd-section">
            <h2 className="nd-section__title">What would you like to donate?</h2>
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

        {/* ── Step 2: fill details ── */}
        {step === 2 && cat && (
          <section className="nd-section">
            <button className="nd-back" onClick={() => setStep(1)}>← Back</button>
            <h2 className="nd-section__title">{cat.icon} {cat.label}</h2>

            <div className="nd-form">
              <div className="nd-field">
                <label className="nd-label">Title <span className="nd-req">*</span></label>
                <input
                  className="nd-input"
                  placeholder={cat.titlePlaceholder}
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                />
              </div>

              <div className="nd-field">
                <label className="nd-label">Description</label>
                <textarea
                  className="nd-input nd-textarea"
                  rows={3}
                  placeholder={cat.descPlaceholder}
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                />
              </div>

              {/* Category-specific fields */}
              {cat.renderFields(form, handleDetailChange)}

              {/* ── Recurring section ── */}
              <RecurringSection recurring={recurring} onChange={setRecurring} />

              <button
                className="nd-btn nd-btn--primary nd-btn--full"
                disabled={!canProceed()}
                onClick={() => setStep(3)}
              >
                Review Donation →
              </button>
            </div>
          </section>
        )}

        {/* ── Step 3: confirm ── */}
        {step === 3 && cat && (
          <section className="nd-section">
            <button className="nd-back" onClick={() => setStep(2)}>← Back</button>
            <h2 className="nd-section__title">Review & Confirm</h2>

            <div className="nd-review">
              <ReviewRow label="Category"    value={`${cat.icon} ${cat.label}`} />
              <ReviewRow label="Title"       value={form.title} />
              <ReviewRow label="Description" value={form.description} />

              {Object.entries(form.details)
                .filter(([, v]) => v !== '' && v !== undefined && !(Array.isArray(v) && v.length === 0))
                .map(([k, v]) => (
                  <ReviewRow key={k} label={k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())} value={v} />
                ))
              }

              {recurring.enabled && (
                <>
                  <div className="nd-review__divider" />
                  <ReviewRow label="🔁 Schedule"  value={`${recurring.frequency.charAt(0).toUpperCase() + recurring.frequency.slice(1)}`} />
                  <ReviewRow label="Starts"       value={recurring.startDate} />
                  {recurring.endDate && <ReviewRow label="Ends" value={recurring.endDate} />}
                </>
              )}

              <ReviewRow label="Donor" value={user.name} />
            </div>

            {error && <p className="nd-error">{error}</p>}

            <button
              className="nd-btn nd-btn--primary nd-btn--full"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading
                ? 'Submitting…'
                : recurring.enabled
                  ? `Confirm ${recurring.frequency.charAt(0).toUpperCase() + recurring.frequency.slice(1)} Plan ✓`
                  : 'Confirm Donation ✓'
              }
            </button>
          </section>
        )}

      </main>
    </div>
  )
}

/* ── Sidebar ── */
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
        <Link to="/donations/new" className="dash-nav__item dash-nav__item--active"><span>➕</span> New Donation</Link>
        <Link to="/dashboard/donations" className="dash-nav__item"><span>📦</span> My Donations</Link>
        <Link to="/dashboard/plans" className="dash-nav__item"><span>🔁</span> My Plans</Link>
        <Link to="/dashboard/impact" className="dash-nav__item"><span>📊</span> Impact</Link>
        <Link to="/feedback" className="dash-nav__item"><span>💬</span> Feedback</Link>
        <Link to="/dashboard/settings" className="dash-nav__item"><span>⚙️</span> Settings</Link>
      </nav>
      <button className="dash-logout" onClick={handleLogout}>Sign Out</button>
    </aside>
  )
}
