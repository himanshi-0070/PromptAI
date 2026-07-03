import React, { createContext, useState, useEffect, useCallback } from 'react'
import * as projectService from '../services/project.service'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorDisplay from '../components/ErrorDisplay'
import { useAuth } from '../hooks/useAuth'

export const ProjectContext = createContext(null)

export const ProjectProvider = ({ children }) => {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchProjects = useCallback(async () => {
    if (!isAuthenticated) {
      setProjects([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await projectService.getProjects()
      setProjects(res.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch projects.')
      console.error('Failed to fetch projects:', err)
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (!authLoading) {
      fetchProjects()
    }
  }, [fetchProjects, authLoading])

  const createProject = useCallback(async (projectData) => {
    setError(null)
    try {
      const res = await projectService.createProject(projectData)
      setProjects(prevProjects => [res.data, ...prevProjects])
      return res.data
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to create project.'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [])

  const updateProject = useCallback(async (id, projectData) => {
    setError(null)
    try {
      const res = await projectService.updateProject(id, projectData)
      setProjects(prevProjects => prevProjects.map(project => (project._id === id ? res.data : project)))
      return res.data
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to update project.'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [])

  const deleteProject = useCallback(async (id) => {
    setError(null)
    try {
      await projectService.deleteProject(id)
      setProjects(prevProjects => prevProjects.filter(project => project._id !== id))
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to delete project.'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [])

  const value = {
    projects,
    loading,
    error,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
  }

  if (authLoading) {
    return <LoadingSpinner />
  }

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  )
}
