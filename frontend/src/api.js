import axios from 'axios'

const API_URL =
  import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

const client = axios.create({
  baseURL: API_URL
})

export async function login(email, password) {
  const response = await client.post('/login', {
    email,
    password
  })

  return response.data
}

export async function getDonors() {
  const response = await client.get('/donors')
  return response.data
}