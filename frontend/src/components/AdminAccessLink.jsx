import React from 'react'
import { Link } from 'react-router-dom'
import './AdminAccessLink.css'

/**
 * A quiet admin link shown at the bottom of the homepage.
 * Not prominently advertised — just accessible to those who know it's there.
 */
function AdminAccessLink() {
  return (
    <div className="admin-access-wrap">
      <Link to="/login/admin" className="admin-access-link">
        🛡️ Platform Administration
      </Link>
    </div>
  )
}

export default AdminAccessLink