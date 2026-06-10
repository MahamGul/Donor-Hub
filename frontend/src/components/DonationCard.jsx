import React from 'react'

function DonationCard({ icon, title, description }) {
  return (
    <div className="card">
      <div
        style={{
          fontSize: '50px',
          marginBottom: '15px'
        }}
      >
        {icon}
      </div>

      <h3>{title}</h3>

      <p
        style={{
          marginTop: '10px',
          color: '#555'
        }}
      >
        {description}
      </p>
    </div>
  )
}

export default DonationCard