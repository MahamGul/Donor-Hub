import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DonorDashboardLayout from '../components/DonorDashboardLayout'
import './Newdonations.css'

const STORAGE_KEY = 'aidbridge-user'
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

/* ───────────────────────────────────────────────────────────
   Shared helper: a donation is exactly ONE package. The donor
   just names the items that go inside it — no quantity field.
   ─────────────────────────────────────────────────────────── */
function renderItemListFields(form, onChange, opts) {
  const {
    itemsKey    = 'items',
    itemLabel   = 'Items in this package',
    itemPlaceholder = 'e.g. Item name',
    addLabel    = '+ Add item',
  } = opts

  const items      = form.details[itemsKey] || []
  const addItem    = () => onChange(itemsKey, [...items, ''])
  const updateItem = (i, val) => {
    const next = [...items]; next[i] = val; onChange(itemsKey, next)
  }
  const removeItem = (i) => onChange(itemsKey, items.filter((_, idx) => idx !== i))

  return (
    <div className="nd-field">
      <label className="nd-label">{itemLabel} <span className="nd-req">*</span></label>
      <span className="nd-hint">This donation is one package — just list what's inside it.</span>
      {items.map((item, i) => (
        <div key={i} className="nd-tag-row">
          <input
            className="nd-input nd-input--sm"
            placeholder={itemPlaceholder}
            value={item}
            onChange={e => updateItem(i, e.target.value)}
          />
          <button className="nd-remove" onClick={() => removeItem(i)} type="button">✕</button>
        </div>
      ))}
      <button className="nd-add-btn" onClick={addItem} type="button">{addLabel}</button>
    </div>
  )
}

/* Shared city field used by every category */
function CityField({ form, onChange }) {
  return (
    <div className="nd-field">
      <label className="nd-label">City <span className="nd-req">*</span></label>
      <input
        className="nd-input"
        placeholder="e.g. Lahore"
        value={form.details.city || ''}
        onChange={e => onChange('city', e.target.value)}
      />
    </div>
  )
}

const itemListIsValid    = (itemsKey) => (form) =>
  (form.details[itemsKey] || []).some(i => i.trim())

const itemListBuildDetails = (itemsKey) => (details) => ({
  [itemsKey]: (details[itemsKey] || []).filter(i => i.trim()),
})

const CATEGORIES = [
  {
    id: 'Food',
    icon: '🍲',
    label: 'Food',
    titlePlaceholder: 'e.g. Monthly ration package',
    descPlaceholder:  'Describe the food items and who they are for…',
    renderFields: (form, onChange) => (
      <>
        {renderItemListFields(form, onChange, {
          itemsKey:        'items',
          itemLabel:       'Food items',
          itemPlaceholder: 'e.g. Rice, Flour, Oil',
          addLabel:        '+ Add item',
        })}

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

        <CityField form={form} onChange={onChange} />
      </>
    ),
    isValid: (form) => itemListIsValid('items')(form) && form.details.city,
    buildDetails: (details) => ({
      ...itemListBuildDetails('items')(details),
      expiryDate: details.expiryDate || null,
      frozen:     !!details.frozen,
      city:       details.city || null,
    }),
  },

  {
    id: 'Education',
    icon: '📚',
    label: 'Education',
    titlePlaceholder: 'e.g. Programming Books for CS students',
    descPlaceholder:  'Who are these books for? Any specific level or institution?',
    renderFields: (form, onChange) => (
      <>
        {renderItemListFields(form, onChange, {
          itemsKey:        'subjects',
          itemLabel:       'Books / subjects in this package',
          itemPlaceholder: 'e.g. Programming, Mathematics',
          addLabel:        '+ Add subject',
        })}

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

        <CityField form={form} onChange={onChange} />
      </>
    ),
    isValid: (form) => itemListIsValid('subjects')(form) && form.details.city,
    buildDetails: (details) => ({
      subjects: (details.subjects || []).filter(s => s.trim()),
      grade:    details.grade || null,
      city:     details.city || null,
    }),
  },

  {
    id: 'Medicine',
    icon: '💊',
    label: 'Medicine',
    titlePlaceholder: 'e.g. Basic medicines for clinic',
    descPlaceholder:  'Any conditions or restrictions on use?',
    renderFields: (form, onChange) => (
      <>
        {renderItemListFields(form, onChange, {
          itemsKey:        'medicines',
          itemLabel:       'Medicines in this package',
          itemPlaceholder: 'e.g. Panadol, Augmentin',
          addLabel:        '+ Add medicine',
        })}

        <div className="nd-field">
          <label className="nd-label">Expiry date <span className="nd-req">*</span></label>
          <input
            className="nd-input"
            type="date"
            value={form.details.expiryDate || ''}
            onChange={e => onChange('expiryDate', e.target.value)}
          />
        </div>

        <CityField form={form} onChange={onChange} />
      </>
    ),
    isValid: (form) => itemListIsValid('medicines')(form) && form.details.expiryDate && form.details.city,
    buildDetails: (details) => ({
      medicines:  (details.medicines || []).filter(m => m.trim()),
      expiryDate: details.expiryDate,
      city:       details.city || null,
    }),
  },

  {
    id: 'Funds',
    icon: '💰',
    label: 'Funds',
    titlePlaceholder: 'e.g. Educational financial aid',
    descPlaceholder:  'What should the funds be used for?',
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

        <CityField form={form} onChange={onChange} />
      </>
    ),
    isValid: (form) =>
      form.details.amount &&
      form.details.currency &&
      form.details.transferMethod &&
      form.details.accountNumber &&
      form.details.city,
    buildDetails: (details) => ({
      amount:         Number(details.amount),
      currency:       details.currency || 'PKR',
      transferMethod: details.transferMethod,
      accountNumber:  details.accountNumber,
      accountName:    details.accountName || null,
      city:           details.city || null,
    }),
  },

  {
    id: 'Blood',
    icon: '🩸',
    label: 'Blood',
    titlePlaceholder: 'e.g. Emergency blood donation available',
    descPlaceholder:  'Any availability windows or contact preferences?',
    renderFields: (form, onChange) => (
      <>
        <div className="nd-field">
          <label className="nd-label">Blood Group <span className="nd-req">*</span></label>
          <select
            className="nd-input nd-select"
            value={form.details.bloodGroup || ''}
            onChange={e => onChange('bloodGroup', e.target.value)}
          >
            <option value="" disabled>Select blood group</option>
            {['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'].map(g => (
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
      bloodGroups:        [details.bloodGroup].filter(Boolean),
      city:               details.city,
      hospitalPreference: details.hospitalPreference || '',
    }),
  },

  {
    id: 'Clothes',
    icon: '👕',
    label: 'Clothes',
    titlePlaceholder: 'e.g. Winter clothes for needy families',
    descPlaceholder:  'Condition of clothes, any special notes?',
    renderFields: (form, onChange) => (
      <>
        {renderItemListFields(form, onChange, {
          itemsKey:        'items',
          itemLabel:       'Clothing items in this package',
          itemPlaceholder: 'e.g. Jackets, Sweaters',
          addLabel:        '+ Add item',
        })}

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
          <label className="nd-label">Size</label>
          <select
            className="nd-input nd-select"
            value={form.details.size || ''}
            onChange={e => onChange('size', e.target.value)}
          >
            <option value="" disabled>Select size</option>
            {['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Mixed'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <CityField form={form} onChange={onChange} />
      </>
    ),
    isValid: (form) => itemListIsValid('items')(form) && form.details.type && form.details.city,
    buildDetails: (details) => ({
      items: (details.items || []).filter(i => i.trim()),
      type:  details.type,
      size:  details.size || null,
      city:  details.city || null,
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

/* ── Inner content component (needs hooks, receives user from layout) ── */
function NewDonationContent({ user, navigate }) {
  const today = new Date().toISOString().split('T')[0]

  const [step,    setStep]    = useState(1)
  const [cat,     setCat]     = useState(null)
  const [form,    setForm]    = useState({ title: '', description: '', details: {} })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState(false)
  const [recurring, setRecurring] = useState({
    enabled:   false,
    frequency: 'monthly',
    startDate: today,
    endDate:   '',
  })

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
          <button className="nd-btn nd-btn--ghost" onClick={() => {
            setSuccess(false)
            setStep(1)
            setCat(null)
            setRecurring({ enabled: false, frequency: 'monthly', startDate: today, endDate: '' })
          }}>
            Donate again
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
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
                <ReviewRow
                  key={k}
                  label={k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                  value={v}
                />
              ))
            }

            {recurring.enabled && (
              <>
                <div className="nd-review__divider" />
                <ReviewRow label="🔁 Schedule" value={`${recurring.frequency.charAt(0).toUpperCase() + recurring.frequency.slice(1)}`} />
                <ReviewRow label="Starts"      value={recurring.startDate} />
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
    </>
  )
}

/* ═══════════════════════════════════════════════════════════ */
export default function NewDonation() {
  const navigate = useNavigate()

  return (
    <DonorDashboardLayout activePage="new">
      {({ user }) => (
        <NewDonationContent user={user} navigate={navigate} />
      )}
    </DonorDashboardLayout>
  )
}