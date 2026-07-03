import api from '../utils/api'

export const getProjects = async () => {
  try {
    const res = await api.get('/projects')
    return res.data
  } catch (error) {
    throw error
  }
}

export const getProjectById = async (id) => {
  try {
    const res = await api.get(`/projects/${id}`)
    return res.data
  } catch (error) {
    throw error
  }
}

export const createProject = async (projectData) => {
  try {
    const res = await api.post('/projects', projectData)
    return res.data
  } catch (error) {
    throw error
  }
}

export const updateProject = async (id, projectData) => {
  try {
    const res = await api.put(`/projects/${id}`, projectData)
    return res.data
  } catch (error) {
    throw error
  }
}

export const deleteProject = async (id) => {
  try {
    const res = await api.delete(`/projects/${id}`)
    return res.data
  } catch (error) {
    throw error
  }
}
