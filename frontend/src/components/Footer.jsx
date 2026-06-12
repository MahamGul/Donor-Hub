import React from 'react'
import { Link } from 'react-router-dom'
import './Footer.css'

function Footer() {
  return (
    <footer className="footer">
      <div className="footer__top">
        <div className="footer__brand">
          <Link to="/" className="footer__logo">Aid<span>Bridge</span></Link>
          <p>
            Connecting generous donors with people in need through a
            transparent, category-driven donation management system.
          </p>
        </div>

        <div className="footer__links-group">
          <h5>Platform</h5>
          <Link to="/login/donor">Donate</Link>
          <Link to="/login/recipient">Request Aid</Link>
          <a href="#how-it-works">How It Works</a>
          <a href="#categories">Categories</a>
        </div>

        <div className="footer__links-group">
          <h5>Company</h5>
          <a href="#">About</a>
          <a href="#">Contact</a>
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Use</a>
        </div>

        <div className="footer__links-group">
          <h5>Donate</h5>
          <a href="#">Funds</a>
          <a href="#">Food</a>
          <a href="#">Clothing</a>
          <a href="#">Education</a>
          <a href="#">Medical</a>
          <a href="#">Blood</a>
        </div>
      </div>

      <div className="footer__bottom">
        <span>© 2026 AidBridge. All Rights Reserved.</span>
        <span>Database Management System Project</span>
      </div>
    </footer>
  )
}

export default Footer
