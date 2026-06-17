import React from 'react'
import { Navigate } from 'react-router-dom'

const STORAGE_KEY = 'aidbridge-user'

/**
 * Wraps any component so only admin-role users can access it.
 * Everyone else is redirected to the admin login page.
 */
function RequireAdmin({ children }) {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return <Navigate to="/login/admin" replace />

  try {
    const user = JSON.parse(raw)
    if (user?.role !== 'admin') return <Navigate to="/login/admin" replace />
  } catch {
    return <Navigate to="/login/admin" replace />
  }

  return children
}

export default RequireAdmin