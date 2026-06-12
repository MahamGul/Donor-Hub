import React, { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import './Hero.css'

function SceneSVG() {
  return (
    <svg
      className="hero__scene"
      viewBox="0 0 1440 800"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="horizonGlow" cx="50%" cy="62%" r="55%">
          <stop offset="0%"  stopColor="#f5c842" stopOpacity="0.32" />
          <stop offset="45%" stopColor="#e8a020" stopOpacity="0.10" />
          <stop offset="100%" stopColor="#e8a020" stopOpacity="0" />
        </radialGradient>

        <linearGradient id="arcGradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#e8a020" stopOpacity="0.05" />
          <stop offset="50%"  stopColor="#f5c842" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#e8a020" stopOpacity="0.05" />
        </linearGradient>

        <linearGradient id="skyFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#09101f" stopOpacity="0" />
          <stop offset="100%" stopColor="#09101f" stopOpacity="1" />
        </linearGradient>
      </defs>

      {/* Horizon glow */}
      <ellipse cx="720" cy="540" rx="760" ry="400" fill="url(#horizonGlow)" />

      {/* Ground line */}
      <line x1="0" y1="600" x2="1440" y2="600" stroke="#e8a020" strokeWidth="1" opacity="0.12" />

      {/* Faint outer arc */}
      <path
        d="M40,600 Q720,260 1400,600"
        fill="none"
        stroke="#e8a020"
        strokeWidth="1"
        strokeDasharray="2,10"
        opacity="0.18"
      />

      {/* Glowing primary arc — the "bridge of light" */}
      <path
        d="M180,600 Q720,300 1260,600"
        fill="none"
        stroke="url(#arcGradient)"
        strokeWidth="2.5"
      />

      {/* Anchor glow points at each end of the arc */}
      <circle cx="180" cy="600" r="3"  fill="#f5c842" opacity="0.9" />
      <circle cx="180" cy="600" r="12" fill="#f5c842" opacity="0.15" />
      <circle cx="1260" cy="600" r="3"  fill="#f5c842" opacity="0.9" />
      <circle cx="1260" cy="600" r="12" fill="#f5c842" opacity="0.15" />

      {/* Apex glow point */}
      <circle cx="720" cy="300" r="3"  fill="#f5c842" opacity="0.95" />
      <circle cx="720" cy="300" r="14" fill="#f5c842" opacity="0.18" />

      {/* Vertical light tethers from arc down to ground, evoking suspension cables */}
      <line x1="450" y1="408" x2="450" y2="600" stroke="#e8a020" strokeWidth="1" strokeDasharray="2,8" opacity="0.18" />
      <line x1="990" y1="408" x2="990" y2="600" stroke="#e8a020" strokeWidth="1" strokeDasharray="2,8" opacity="0.18" />
      <line x1="720" y1="300" x2="720" y2="600" stroke="#f5c842" strokeWidth="1" strokeDasharray="2,8" opacity="0.22" />

      {/* Bottom fade to merge into solid background */}
      <rect x="0" y="600" width="1440" height="200" fill="url(#skyFade)" />
    </svg>
  )
}

function BridgeSVG() {
  return (
    <svg
      className="hero__bridge"
      viewBox="0 0 900 260"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <line x1="0" y1="200" x2="900" y2="200" stroke="#e8a020" strokeWidth="2" />
      <path d="M100,200 Q450,60 800,200" fill="none" stroke="#e8a020" strokeWidth="2.5" />
      <line x1="450" y1="60"  x2="450" y2="200" stroke="#e8a020" strokeWidth="1.5" strokeDasharray="6,4" />
      <line x1="300" y1="107" x2="300" y2="200" stroke="#e8a020" strokeWidth="1.5" strokeDasharray="6,4" />
      <line x1="600" y1="107" x2="600" y2="200" stroke="#e8a020" strokeWidth="1.5" strokeDasharray="6,4" />
      <line x1="200" y1="155" x2="200" y2="200" stroke="#e8a020" strokeWidth="1.5" strokeDasharray="6,4" />
      <line x1="700" y1="155" x2="700" y2="200" stroke="#e8a020" strokeWidth="1.5" strokeDasharray="6,4" />
      <line x1="375" y1="82"  x2="375" y2="200" stroke="#e8a020" strokeWidth="1"   strokeDasharray="6,4" opacity="0.6" />
      <line x1="525" y1="82"  x2="525" y2="200" stroke="#e8a020" strokeWidth="1"   strokeDasharray="6,4" opacity="0.6" />
      <circle cx="100" cy="200" r="5" fill="#e8a020" />
      <circle cx="800" cy="200" r="5" fill="#e8a020" />
      <circle cx="450" cy="60"  r="5" fill="#e8a020" />
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
      <SceneSVG />
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
