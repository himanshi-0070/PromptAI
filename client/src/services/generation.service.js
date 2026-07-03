import api from './api'

export const generationService = {
  generateProject: async (prompt, onProgress = () => {}) => {
    const token = api.defaults.headers.common['Authorization']
    
    const headers = {
      'Content-Type': 'application/json',
    }
    
    if (token) {
      headers['Authorization'] = token
    }

    const response = await fetch('/api/v1/generate', {
      method: 'POST',
      headers,
      body: JSON.stringify({ prompt }),
    })

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}))
      throw new Error(errData.error || `Server responded with status ${response.status}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { value, done } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.trim().startsWith('data: ')) {
          const content = line.trim().slice(6)
          try {
            const data = JSON.parse(content)
            if (data.type === 'stage') {
              onProgress(data)
            } else if (data.type === 'complete') {
              return data
            } else if (data.type === 'error') {
              throw new Error(data.error)
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue
            throw e
          }
        }
      }
    }
    throw new Error('Stream ended without completion payload.')
  },
}
