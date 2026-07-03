import React, { createContext, useState, useEffect, useCallback } from 'react'
import * as taskService from '../services/task.service'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorDisplay from '../components/ErrorDisplay'
import { useAuth } from '../hooks/useAuth'

export const TaskContext = createContext(null)

export const TaskProvider = ({ children }) => {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchTasks = useCallback(async () => {
    if (!isAuthenticated) {
      setTasks([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await taskService.getTasks()
      setTasks(res.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch tasks.')
      console.error('Failed to fetch tasks:', err)
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (!authLoading) {
      fetchTasks()
    }
  }, [fetchTasks, authLoading])

  const createTask = useCallback(async (taskData) => {
    setError(null)
    try {
      const res = await taskService.createTask(taskData)
      setTasks(prevTasks => [res.data, ...prevTasks])
      return res.data
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to create task.'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [])

  const updateTask = useCallback(async (id, taskData) => {
    setError(null)
    try {
      const res = await taskService.updateTask(id, taskData)
      setTasks(prevTasks => prevTasks.map(task => (task._id === id ? res.data : task)))
      return res.data
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to update task.'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [])

  const updateTaskStatus = useCallback(async (id, newStatus) => {
    setError(null)
    try {
      const res = await taskService.updateTaskStatus(id, newStatus)
      setTasks(prevTasks => prevTasks.map(task => (task._id === id ? res.data : task)))
      return res.data
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to update task status.'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [])

  const deleteTask = useCallback(async (id) => {
    setError(null)
    try {
      await taskService.deleteTask(id)
      setTasks(prevTasks => prevTasks.filter(task => task._id !== id))
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to delete task.'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [])

  const value = {
    tasks,
    loading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    updateTaskStatus,
    deleteTask,
  }

  if (authLoading) {
    return <LoadingSpinner />
  }

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  )
}
