/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react'

const ProjectContext = createContext(null)

export function ProjectProvider({ children }) {
  const [currentProject, setCurrentProject] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [openTabs, setOpenTabs] = useState([])
  const [fileTreeTrigger, setFileTreeTrigger] = useState(0)
  
  const [generationSummary, setGenerationSummary] = useState(null)
  const [isGeneratingChat, setIsGeneratingChat] = useState(false)
  const [chatProgressStage, setChatProgressStage] = useState('')
  const [chatProgressIndex, setChatProgressIndex] = useState(0)
  const [gitStatus, setGitStatus] = useState(null)

  const triggerFileTreeRefresh = () => setFileTreeTrigger(prev => prev + 1)

  const openFile = (file) => {
    setSelectedFile(file)
    setOpenTabs(prev => {
      if (prev.find(t => t.path === file.path)) return prev
      return [...prev, file]
    })

    if (file && file.path && currentProject?.projectId) {
      try {
        const key = `recent_files_${currentProject.projectId}`
        const saved = localStorage.getItem(key)
        let recents = saved ? JSON.parse(saved) : []
        recents = recents.filter(f => f.path !== file.path)
        recents.unshift({
          path: file.path,
          name: file.name || file.path.split('/').pop(),
          type: 'file',
          language: file.language || 'plaintext'
        })
        recents = recents.slice(0, 15)
        localStorage.setItem(key, JSON.stringify(recents))
      } catch (err) {
        console.error(err)
      }
    }
  }

  const closeTab = (path) => {
    setOpenTabs(prev => {
      const next = prev.filter(t => t.path !== path)
      if (selectedFile?.path === path) {
        setSelectedFile(next[next.length - 1] || null)
      }
      return next
    })
  }

  const clearProject = () => {
    setCurrentProject(null)
    setSelectedFile(null)
    setOpenTabs([])
    setGenerationSummary(null)
  }

  return (
    <ProjectContext.Provider value={{
      currentProject, setCurrentProject,
      selectedFile, openFile, closeTab,
      openTabs, clearProject,
      fileTreeTrigger, triggerFileTreeRefresh,
      generationSummary, setGenerationSummary,
      isGeneratingChat, setIsGeneratingChat,
      chatProgressStage, setChatProgressStage,
      chatProgressIndex, setChatProgressIndex,
      gitStatus, setGitStatus
    }}>
      {children}
    </ProjectContext.Provider>
  )
}

export const useProject = () => {
  const ctx = useContext(ProjectContext)
  if (!ctx) throw new Error('useProject must be used within ProjectProvider')
  return ctx
}
