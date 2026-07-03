import api from '../utils/api'

export const getTasks = async (filters = {}) => {
  try {
    const query = new URLSearchParams(filters).toString()
    const res = await api.get(`/tasks?${query}`)
    return res.data
  } catch (error) {
    throw error
  }
}

export const getTaskById = async (id) => {
  try {
    const res = await api.get(`/tasks/${id}`)
    return res.data
  } catch (error) {
    throw error
  }
}

export const createTask = async (taskData) => {
  try {
    const res = await api.post('/tasks', taskData)
    return res.data
  } catch (error) {
    throw error
  }
}

export const updateTask = async (id, taskData) => {
  try {
    const res = await api.put(`/tasks/${id}`, taskData)
    return res.data
  } catch (error) {
    throw error
  }
}

export const updateTaskStatus = async (id, status) => {
  try {
    const res = await api.patch(`/tasks/${id}/status`, { status })
    return res.data
  } catch (error) {
    throw error
  }
}

export const deleteTask = async (id) => {
  try {
    const res = await api.delete(`/tasks/${id}`)
    return res.data
  } catch (error) {
    throw error
  }
}
