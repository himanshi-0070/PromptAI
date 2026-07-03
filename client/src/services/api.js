import axios from 'axios'
import { toast } from 'sonner'

/**
 * Pre-configured Axios instance for all PromptAI API calls.
 *
 * Base URL: /api/v1  (proxied to http://localhost:5000 in dev)
 * Timeout: 5 minutes — accommodates long AI generation requests.
 */
const api = axios.create({
  baseURL: '/api/v1',
  timeout: 300000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // Crucial to send HttpOnly cookies to backend
})

let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

// Intercept responses to handle automatically refreshing expired access tokens
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Intercept 401 Unauthorized errors to perform silent refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't retry if the request itself was an auth request
      if (originalRequest.url.includes('/auth/google') || originalRequest.url.includes('/auth/refresh') || originalRequest.url.includes('/auth/logout')) {
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then(token => {
            originalRequest.headers['Authorization'] = 'Bearer ' + token
            return api(originalRequest)
          })
          .catch(err => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const res = await axios.post('/api/v1/auth/refresh')
        const { accessToken } = res.data.data

        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`

        const { setAuthToken } = await import('../context/AuthContext')
        setAuthToken(accessToken)

        processQueue(null, accessToken)
        return api(originalRequest)
      } catch (refreshErr) {
        processQueue(refreshErr, null)
        const { setAuthToken } = await import('../context/AuthContext')
        setAuthToken(null)
        window.dispatchEvent(new Event('auth_session_expired'))
        return Promise.reject(refreshErr)
      } finally {
        isRefreshing = false
      }
    }

    const message =
      error.response?.data?.error ||
      error.message ||
      'An unexpected error occurred.'

    // Don't toast if request was intentionally cancelled or unauthorized (refresh will handle or redirect)
    if (error.code !== 'ERR_CANCELED' && error.response?.status !== 401) {
      toast.error(message)
    }

    return Promise.reject(error)
  }
)

export default api
