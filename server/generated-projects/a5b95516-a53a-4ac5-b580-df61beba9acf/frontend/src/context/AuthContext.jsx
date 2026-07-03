import React, { createContext, useState, useEffect, useCallback } from 'react'
import * as authService from '../services/auth.service'
import api from '../utils/api'

export const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadUser = useCallback(async () => {
    if (token) {
      try {
        setLoading(true)
        const res = await authService.getMe()
        setUser(res.data)
        setIsAuthenticated(true)
        setError(null)
      } catch (err) {
        console.error('Failed to fetch user:', err)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setToken(null)
        setUser(null)
        setIsAuthenticated(false)
        setError(err.response?.data?.error || 'Failed to load user data.')
      } finally {
        setLoading(false)
      }
    } else {
      setLoading(false)
      setIsAuthenticated(false)
      setUser(null)
    }
  }, [token])

  useEffect(() => {
    loadUser()
  }, [loadUser])

  const login = useCallback(async (email, password) => {
    setLoading(true)
    setError(null)
    try {
      const res = await authService.login(email, password)
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      setToken(res.data.token)
      setUser(res.data.user)
      setIsAuthenticated(true)
      return res.data.user
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Login failed. Please check your credentials.'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const register = useCallback(async (name, email, password) => {
    setLoading(true)
    setError(null)
    try {
      const res = await authService.register(name, email, password)
      // Optionally log in user immediately after registration
      // await login(email, password);
      return res.data
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Registration failed. Please try again.'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
    setIsAuthenticated(false)
    setError(null)
  }, [])

  const checkAuthStatus = useCallback(() => {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
      setIsAuthenticated(true)
    } else {
      setToken(null)
      setUser(null)
      setIsAuthenticated(false)
    }
    setLoading(false)
  }, [])

  const value = {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    register,
    logout,
    checkAuthStatus
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
