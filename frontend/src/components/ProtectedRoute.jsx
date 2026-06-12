import React from 'react'
import { Navigate } from 'react-router-dom'

const STORAGE_KEY = 'aidbridge-user'

function ProtectedRoute({ children }) {
  const user = localStorage.getItem(STORAGE_KEY)

  if (!user) {
    return <Navigate to="/login/donor" replace />
  }

  return children
}

export default ProtectedRoute
