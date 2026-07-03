import api from './api'

export const projectService = {
  getProject: async (projectId) => {
    const res = await api.get(`/projects/${projectId}`)
    return res.data.data.project
  },

  deleteProject: async (projectId) => {
    const res = await api.delete(`/projects/${projectId}`)
    return res.data
  },
}
