import axios from 'axios'

const API_URL =
  import.meta.env.VITE_API_URL ||
  'http://127.0.0.1:8000'

const client = axios.create({
  baseURL: API_URL
})

export async function login(email, password, role) {
  const response = await client.post('/login', { email, password, role })
  return response.data
}

export async function signup(data) {
  const response = await client.post('/signup', data)
  return response.data
}

export async function getDonors() {
  const response = await client.get('/donors')
  return response.data
}

/**
 * Create a new donation.
 * @param {{ donorId, category, title, description, details }} donation
 */
export async function createDonation(donation) {
  const response = await client.post('/donations', donation)
  return response.data
}

/**
 * Fetch all donations for a specific donor.
 * @param {string} donorId
 */
export async function getDonorDonations(donorId) {
  const response = await client.get(`/donations/donor/${donorId}`)
  return response.data
}

export async function getUser(userId) {
  const response = await client.get(`/users/${userId}`)
  return response.data
}

export async function updateUser(userId, data) {
  const response = await client.put(`/users/${userId}`, data)
  return response.data
}

/**
 * Fetch all donations (admin / matching use).
 */
export async function getAllDonations() {
  const response = await client.get('/donations')
  return response.data
}

/**
 * Delete a donation by id.
 * @param {string} donationId
 */
export async function deleteDonation(donationId) {
  const response = await client.delete(`/donations/${donationId}`)
  return response.data
}