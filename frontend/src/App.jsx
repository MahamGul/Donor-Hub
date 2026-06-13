import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Home from './pages/Home'
import NewDonation from './pages/Newdonations'
import NewRequest from './pages/NewRequest'
import DonorDonations from './pages/DonorDonations'
import DonorImpact from './pages/DonorImpact'
import MyRequests from './pages/MyRequests'
import Track from './pages/Track'
import Settings from './pages/Settings'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />

      <Route path="/login" element={<Navigate to="/login/donor" replace />} />
      <Route path="/login/:role" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/dashboard/donations" element={<ProtectedRoute><DonorDonations /></ProtectedRoute>} />
      <Route path="/dashboard/impact" element={<ProtectedRoute><DonorImpact /></ProtectedRoute>} />

      <Route path="/donations/new" element={<ProtectedRoute><NewDonation /></ProtectedRoute>} />

      <Route path="/requests/new" element={<ProtectedRoute><NewRequest /></ProtectedRoute>} />
      <Route path="/requests/my" element={<ProtectedRoute><MyRequests /></ProtectedRoute>} />
      <Route path="/requests/track" element={<ProtectedRoute><Track /></ProtectedRoute>} />

      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App