import api from './api'

export const workspaceService = {
  getFileTree: async (projectId) => {
    const res = await api.get(`/workspace/${projectId}/files`)
    return res.data.data.tree
  },

  getFileContent: async (projectId, filePath) => {
    const res = await api.get(`/workspace/${projectId}/file`, {
      params: { path: filePath },
    })
    return res.data.data.file
  },
}
