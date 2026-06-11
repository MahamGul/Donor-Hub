import { Link } from 'react-router-dom'
import React from 'react'

function Hero() {
  return (
    <section className="hero">
      <div className="container hero-content">
        <h1>Make a Difference Today</h1>

        <p>
          Connect donors with people in need.
          Donate food, clothes, books,
          medical supplies, and funds.
        </p>

        <div className="hero-buttons">
          <Link to="/login/donor">
            <button className="btn btn-primary">
              Donate Now
            </button>
          </Link>

          <Link to="/login/recipient">
            <button className="btn btn-secondary">
              Request Help
            </button>
          </Link>
        </div>
      </div>
    </section>
  )
}

export default Hero