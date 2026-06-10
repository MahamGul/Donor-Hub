import { Link } from 'react-router-dom'
import React from 'react'

function Navbar() {
  return (
    <nav className="navbar">
      <div className="container navbar-content">
        <h2 className="logo">DonorHub</h2>

        <div className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/login">Login</Link>
        </div>
      </div>
    </nav>
  )
}

export default Navbar