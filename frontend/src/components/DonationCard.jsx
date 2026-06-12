import React from 'react'
import './DonationCard.css'

function DonationCard({ icon, title, description, linkLabel = 'Donate' }) {
  return (
    <div className="donation-card">
      <span className="donation-card__icon" aria-hidden="true">
        {icon}
      </span>

      <h3 className="donation-card__title">{title}</h3>

      <p className="donation-card__desc">{description}</p>

      <span className="donation-card__arrow">{linkLabel} →</span>
    </div>
  )
}

export default DonationCard
