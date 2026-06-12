import React, { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import './Hero.css'

function BridgeSVG() {
  return (
    <svg
      className="hero__bridge"
      viewBox="0 0 900 260"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Road / base line */}
      <line x1="0" y1="200" x2="900" y2="200" stroke="#e8a020" strokeWidth="2" />

      {/* Main arch */}
      <path
        d="M100,200 Q450,60 800,200"
        fill="none"
        stroke="#e8a020"
        strokeWidth="2.5"
      />

      {/* Vertical cables */}
      <line x1="450" y1="60"  x2="450" y2="200" stroke="#e8a020" strokeWidth="1.5" strokeDasharray="6,4" />
      <line x1="300" y1="107" x2="300" y2="200" stroke="#e8a020" strokeWidth="1.5" strokeDasharray="6,4" />
      <line x1="600" y1="107" x2="600" y2="200" stroke="#e8a020" strokeWidth="1.5" strokeDasharray="6,4" />
      <line x1="200" y1="155" x2="200" y2="200" stroke="#e8a020" strokeWidth="1.5" strokeDasharray="6,4" />
      <line x1="700" y1="155" x2="700" y2="200" stroke="#e8a020" strokeWidth="1.5" strokeDasharray="6,4" />
      <line x1="375" y1="82"  x2="375" y2="200" stroke="#e8a020" strokeWidth="1"   strokeDasharray="6,4" opacity="0.6" />
      <line x1="525" y1="82"  x2="525" y2="200" stroke="#e8a020" strokeWidth="1"   strokeDasharray="6,4" opacity="0.6" />

      {/* Anchor dots */}
      <circle cx="100" cy="200" r="5" fill="#e8a020" />
      <circle cx="800" cy="200" r="5" fill="#e8a020" />
      <circle cx="450" cy="60"  r="5" fill="#e8a020" />

      {/* Labels */}
      <text x="60"  y="230" fill="#e8a020" fontSize="11" fontFamily="Inter,sans-serif" opacity="0.65">Donor</text>
      <text x="808" y="230" fill="#e8a020" fontSize="11" fontFamily="Inter,sans-serif" opacity="0.65">Recipient</text>
    </svg>
  )
}

function Hero() {
  const particlesRef = useRef(null)

  useEffect(() => {
    const container = particlesRef.current
    if (!container) return

    const count = 24
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div')
      p.className = 'hero__particle'
      p.style.left             = `${Math.random() * 100}%`
      p.style.bottom           = `${Math.random() * 45}%`
      p.style.animationDuration = `${4 + Math.random() * 9}s`
      p.style.animationDelay   = `${Math.random() * 9}s`
      const size = 1 + Math.random() * 2.5
      p.style.width  = `${size}px`
      p.style.height = `${size}px`
      container.appendChild(p)
    }

    return () => {
      while (container.firstChild) container.removeChild(container.firstChild)
    }
  }, [])

  return (
    <section className="hero">
      <div className="hero__bg" />
      <div className="hero__glow" />
      <div className="hero__particles" ref={particlesRef} />

      <BridgeSVG />

      <div className="hero__content container">
        <span className="hero__eyebrow">Online Donation Platform</span>

        <h1 className="hero__heading">
          Aid that<br /><em>Bridges</em> the Gap
        </h1>

        <p className="hero__sub">
          Connecting generous hearts with those in need — donate food,
          clothing, education, medical supplies, blood, and funds through
          one transparent platform.
        </p>

        <div className="hero__buttons">
          <Link to="/login/donor">
            <button className="btn-primary">Start Donating</button>
          </Link>
          <Link to="/login/recipient">
            <button className="btn-secondary">Request Aid →</button>
          </Link>
        </div>
      </div>

      <div className="hero__stats">
        <div className="hero__stat">
          <span className="hero__stat-num">12K+</span>
          <span className="hero__stat-label">Donors</span>
        </div>
        <div className="hero__stat">
          <span className="hero__stat-num">6</span>
          <span className="hero__stat-label">Categories</span>
        </div>
        <div className="hero__stat">
          <span className="hero__stat-num">98%</span>
          <span className="hero__stat-label">Fulfilled</span>
        </div>
      </div>
    </section>
  )
}

export default Hero
