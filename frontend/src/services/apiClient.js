import axios from 'axios'

/**
 * Axios instance pre-configured for the Financial Companion API.
 *
 * - Base URL from VITE_API_URL (or /api/v1 proxied by Vite in dev).
 * - JWT token attached automatically from localStorage.
 * - 401 responses clear auth and redirect to /login.
 */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// Request interceptor: attach token
apiClient.interceptors.request.use((config) => {
  const token = window.localStorage.getItem('fc_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor: handle 401 globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.localStorage.removeItem('fc_token')
      window.localStorage.removeItem('fc_user')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)

export default apiClient
