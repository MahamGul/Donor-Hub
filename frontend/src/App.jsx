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
import RecipientFeedback from './pages/RecipientFeedback'
import DonorFeedback from './pages/DonorFeedback'
import AdminLayout from './pages/AdminLayout'
import AdminDashboard from './pages/AdminDashboard'
import AdminDonations from './pages/AdminDonations'
// A small wrapper that picks the right page based on stored user role
function Feedback() {
  const saved = localStorage.getItem('aidbridge-user')
  const user = saved ? JSON.parse(saved) : null
  if (!user) return <Navigate to="/login/donor" replace />
  return user.role === 'donor' ? <DonorFeedback /> : <RecipientFeedback />
}

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
      <Route path="/feedback" element={<ProtectedRoute><Feedback /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
      <Route
  path="/admin"
  element={
    <ProtectedRoute>
      <AdminLayout />
    </ProtectedRoute>
  }
>
  <Route index element={<AdminDashboard />} />
  <Route path="dashboard" element={<AdminDashboard />} />
  <Route path="donations" element={<AdminDonations />} />
</Route>
    </Routes>
  )
}

export default App