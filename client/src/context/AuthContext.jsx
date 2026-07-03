/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'sonner'
import api from '../services/api'

const AuthContext = createContext(null)

// Helper to set backend Authorization headers for Axios calls
export let setAuthToken = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
  } else {
    delete axios.defaults.headers.common['Authorization']
    delete api.defaults.headers.common['Authorization']
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Silent refresh on mount & listen to session expirations
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const res = await axios.post('/api/v1/auth/refresh')
        const { accessToken, user: userData } = res.data.data
        setAuthToken(accessToken)
        setUser(userData)
      } catch (err) {
        // Silent fail — user simply needs to sign in
        loggerDebug('Silent refresh session failed or expired', err)
      } finally {
        setLoading(false)
      }
    }
    restoreSession()

    const handleExpired = () => {
      setAuthToken(null)
      setUser(null)
      toast.warn('Your session has expired. Please sign in again.')
    }
    window.addEventListener('auth_session_expired', handleExpired)
    return () => window.removeEventListener('auth_session_expired', handleExpired)
  }, [])

  const login = async (idToken) => {
    try {
      setLoading(true)
      const res = await axios.post('/api/v1/auth/google', { idToken })
      const { accessToken, user: userData } = res.data.data
      setAuthToken(accessToken)
      setUser(userData)
      toast.success(`Welcome back, ${userData.name}!`)
      return userData
    } catch (err) {
      toast.error(err.response?.data?.error || 'Authentication failed. Please try again.')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      setLoading(true)
      await axios.post('/api/v1/auth/logout')
    } catch (err) {
      console.error('Logout request failed', err)
    } finally {
      setAuthToken(null)
      setUser(null)
      setLoading(false)
      toast.info('Logged out successfully.')
    }
  }

  const updatePreferences = async (preferences) => {
    try {
      const res = await axios.put('/api/v1/auth/preferences', preferences)
      const newPrefs = res.data.data.preferences
      setUser((prev) => (prev ? { ...prev, preferences: newPrefs } : null))
      return newPrefs
    } catch (err) {
      toast.error('Failed to update preferences.')
      throw err
    }
  }

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    updatePreferences,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

function loggerDebug(msg, err) {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[AuthDebug] ${msg}`, err?.message)
  }
}
