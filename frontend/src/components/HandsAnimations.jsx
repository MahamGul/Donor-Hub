import React, { useEffect, useRef } from 'react'
import './HandsAnimations.css'

export default function HandsAnimation() {
  const sceneRef = useRef(null)

  useEffect(() => {
    function spawnSparks() {
      const scene = sceneRef.current
      if (!scene) return
      const cx = scene.offsetWidth / 2
      const cy = scene.offsetHeight / 2
      for (let i = 0; i < 14; i++) {
        const s = document.createElement('div')
        s.className = 'hj-spark'
        const angle = (Math.PI * 2 * i) / 14 + Math.random() * 0.4
        const dist  = 40 + Math.random() * 70
        const dx    = Math.cos(angle) * dist
        const dy    = Math.sin(angle) * dist
        const size  = 4 + Math.random() * 5
        s.style.cssText = `left:${cx - size / 2}px;top:${cy - size / 2}px;--dx:${dx}px;--dy:${dy}px;animation-delay:${Math.random() * 0.25}s;width:${size}px;height:${size}px;`
        scene.appendChild(s)
        setTimeout(() => s.remove(), 900)
      }
    }

    const t1 = setTimeout(spawnSparks, 1800)
    const t2 = setTimeout(spawnSparks, 2150)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  return (
    <div className="hj-scene" ref={sceneRef}>

      {/* Light rays */}
      <div className="hj-rays">
        <svg viewBox="0 0 800 420" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(400,210)" opacity="0.18">
            <line x1="0" y1="0" x2="0"    y2="-320" stroke="#f5c842" strokeWidth="1"/>
            <line x1="0" y1="0" x2="60"   y2="-315" stroke="#f5c842" strokeWidth="0.8"/>
            <line x1="0" y1="0" x2="-60"  y2="-315" stroke="#f5c842" strokeWidth="0.8"/>
            <line x1="0" y1="0" x2="120"  y2="-300" stroke="#f5c842" strokeWidth="0.6"/>
            <line x1="0" y1="0" x2="-120" y2="-300" stroke="#f5c842" strokeWidth="0.6"/>
            <line x1="0" y1="0" x2="200"  y2="-260" stroke="#f5c842" strokeWidth="0.5"/>
            <line x1="0" y1="0" x2="-200" y2="-260" stroke="#f5c842" strokeWidth="0.5"/>
            <line x1="0" y1="0" x2="300"  y2="-180" stroke="#e8a020" strokeWidth="0.5"/>
            <line x1="0" y1="0" x2="-300" y2="-180" stroke="#e8a020" strokeWidth="0.5"/>
            <line x1="0" y1="0" x2="380"  y2="-60"  stroke="#e8a020" strokeWidth="0.4"/>
            <line x1="0" y1="0" x2="-380" y2="-60"  stroke="#e8a020" strokeWidth="0.4"/>
            <line x1="0" y1="0" x2="380"  y2="60"   stroke="#e8a020" strokeWidth="0.4"/>
            <line x1="0" y1="0" x2="-380" y2="60"   stroke="#e8a020" strokeWidth="0.4"/>
          </g>
        </svg>
      </div>

      {/* Radial glow at join point */}
      <div className="hj-glow" />

      {/* Hands */}
      <div className="hj-hands">

        {/* Left hand — darker skin, sliding from left */}
        <svg className="hj-hand hj-hand--left" viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg">
          <g transform="scale(-1,1) translate(-180,0)">
            <path
              d="M90 160 C70 155 50 140 40 120 C30 100 32 75 38 60
                 C42 50 50 46 58 50 C60 42 68 38 76 42
                 C80 35 90 33 97 38 C102 32 112 32 116 40
                 C124 38 132 44 132 55 L132 90
                 C132 110 128 130 120 145 C112 158 100 162 90 160 Z"
              fill="#c8956b" stroke="#a0724a" strokeWidth="1.5"
            />
            <path d="M58 50 C58 50 56 70 58 85" stroke="#a0724a" strokeWidth="1" fill="none" opacity="0.5"/>
            <path d="M76 42 C75 42 73 62 74 80" stroke="#a0724a" strokeWidth="1" fill="none" opacity="0.5"/>
            <path d="M97 38 C96 38 95 58 96 76" stroke="#a0724a" strokeWidth="1" fill="none" opacity="0.5"/>
            <path d="M116 40 C116 40 116 58 116 74" stroke="#a0724a" strokeWidth="1" fill="none" opacity="0.5"/>
          </g>
        </svg>

        {/* Right hand — lighter skin, sliding from right */}
        <svg className="hj-hand hj-hand--right" viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M90 160 C70 155 50 140 40 120 C30 100 32 75 38 60
               C42 50 50 46 58 50 C60 42 68 38 76 42
               C80 35 90 33 97 38 C102 32 112 32 116 40
               C124 38 132 44 132 55 L132 90
               C132 110 128 130 120 145 C112 158 100 162 90 160 Z"
            fill="#e0b090" stroke="#b8865a" strokeWidth="1.5"
          />
          <path d="M58 50 C58 50 56 70 58 85" stroke="#b8865a" strokeWidth="1" fill="none" opacity="0.5"/>
          <path d="M76 42 C75 42 73 62 74 80" stroke="#b8865a" strokeWidth="1" fill="none" opacity="0.5"/>
          <path d="M97 38 C96 38 95 58 96 76" stroke="#b8865a" strokeWidth="1" fill="none" opacity="0.5"/>
          <path d="M116 40 C116 40 116 58 116 74" stroke="#b8865a" strokeWidth="1" fill="none" opacity="0.5"/>
        </svg>
      </div>

      {/* Tagline */}
      <div className="hj-text">
        <p className="hj-tagline">Connecting Generosity with Need</p>
        <p className="hj-sub">Aid Bridge &mdash; Together we give</p>
      </div>

      {/* Cinematic overlays */}
      <div className="hj-vignette" />
      <div className="hj-filmgrain" />
    </div>
  )
}