import api from '../utils/api'

export const register = async (name, email, password) => {
  try {
    const res = await api.post('/auth/register', { name, email, password })
    return res.data
  } catch (error) {
    throw error
  }
}

export const login = async (email, password) => {
  try {
    const res = await api.post('/auth/login', { email, password })
    return res.data
  } catch (error) {
    throw error
  }
}

export const getMe = async () => {
  try {
    const res = await api.get('/auth/me')
    return res.data
  } catch (error) {
    throw error
  }
}
