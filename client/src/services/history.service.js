import api from './api'

export const historyService = {
  getHistory: async ({ page = 1, limit = 12, search = '' } = {}) => {
    const res = await api.get('/history', { params: { page, limit, search } })
    return res.data.data
  },
}
