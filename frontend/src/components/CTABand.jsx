import React from 'react'
import { Link } from 'react-router-dom'
import './CTABand.css'
function CTABand() {
  return (
    <section className="cta-band">

      <div>
        <h2 className="cta-band__heading">
          Become The Reason <br />
          Someone Still <em>Believes</em>
        </h2>

        <p className="cta-band__sub">
          Your contribution today can provide food,
          education, shelter and hope tomorrow.
        </p>
      </div>

      <div className="cta-band__buttons">
        <button className="cta-band__btn-dark">
          Donate Today
        </button>

        <button className="cta-band__btn-outline">
          View Campaigns
        </button>
      </div>

    </section>
  );
}

export default CTABand;