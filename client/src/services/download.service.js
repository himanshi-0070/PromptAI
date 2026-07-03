import api from './api'

/**
 * downloadService — Triggers a ZIP archive download of a generated project.
 */
export const downloadService = {
  /**
   * Returns the direct download URL for a project ZIP.
   * Used with an anchor tag to trigger the browser's native download.
   * @param {string} projectId
   * @returns {string} Download URL
   */
  getDownloadUrl: (projectId) => `/api/v1/download/${projectId}`,

  /**
   * Triggers a programmatic download by fetching the ZIP as a blob
   * and creating a temporary anchor element.
   * @param {string} projectId
   * @param {string} projectName
   */
  downloadProject: async (projectId, projectName) => {
    const res = await api.get(`/download/${projectId}`, {
      responseType: 'blob',
      timeout: 60000,
    })
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `${projectName}-${projectId.slice(0, 8)}.zip`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  },
}
