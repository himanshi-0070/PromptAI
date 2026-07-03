import api from './api'

export const gitService = {
  getStatus: async (projectId) => {
    const res = await api.get(`/projects/${projectId}/git/status`)
    return res.data.data.status
  },

  getHistory: async (projectId) => {
    const res = await api.get(`/projects/${projectId}/git/history`)
    return res.data.data.history
  },

  getDiff: async (projectId, from = null, to = null) => {
    const params = {}
    if (from) params.from = from
    if (to) params.to = to
    const res = await api.get(`/projects/${projectId}/git/diff`, { params })
    return res.data.data.diff
  },

  commitChanges: async (projectId, message) => {
    const res = await api.post(`/projects/${projectId}/git/commit`, { message })
    return res.data.data
  },

  discardChanges: async (projectId) => {
    const res = await api.post(`/projects/${projectId}/git/discard`)
    return res.data.data
  },

  rollback: async (projectId, commitHash) => {
    const res = await api.post(`/projects/${projectId}/git/rollback`, { commitHash })
    return res.data.data
  },

  getBranches: async (projectId) => {
    const res = await api.get(`/projects/${projectId}/git/branches`)
    return res.data.data.branches
  },
}
