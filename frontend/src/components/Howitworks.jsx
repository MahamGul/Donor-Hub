import React from 'react'
import './HowItWorks.css'

const STEPS = [
  {
    num: '01',
    icon: '🔐',
    title: 'Register',
    desc: 'Sign up as a donor or recipient. Your identity and data stay fully secure.',
  },
  {
    num: '02',
    icon: '📋',
    title: 'Post or Browse',
    desc: 'List what you can give, or submit a request for what you need.',
  },
  {
    num: '03',
    icon: '🤝',
    title: 'Get Matched',
    desc: 'Our system connects donors and recipients based on category and location.',
  },
  {
    num: '04',
    icon: '✅',
    title: 'Confirm & Track',
    desc: 'Follow every donation from initial pledge all the way through to delivery.',
  },
]

function HowItWorks() {
  return (
    <section className="how-it-works" id="how-it-works">
      <div className="container">
        <span className="section-label">Process</span>
        <h2 className="section-title">Simple. Transparent. Impactful.</h2>

        <div className="how-it-works__grid">
          {STEPS.map((step) => (
            <div key={step.num} className="how-it-works__step">
              <div className="how-it-works__step-num">{step.num}</div>
              <span className="how-it-works__step-icon" aria-hidden="true">
                {step.icon}
              </span>
              <h4 className="how-it-works__step-title">{step.title}</h4>
              <p className="how-it-works__step-desc">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default HowItWorks