import { useState, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import Column from './Column'
import { useTasks } from '../hooks/useTasks'
import LoadingSpinner from './LoadingSpinner'
import ErrorDisplay from './components/ErrorDisplay'

const boardVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

function KanbanBoard() {
  const { tasks, updateTaskStatus, loading, error } = useTasks()
  const [draggedTask, setDraggedTask] = useState(null)

  const columns = useMemo(() => ({
    'backlog': { title: 'Backlog', icon: 'CircleDotDashed', color: 'blue', tasks: [] },
    'todo': { title: 'To Do', icon: 'XCircle', color: 'red', tasks: [] },
    'in-progress': { title: 'In Progress', icon: 'Hourglass', color: 'yellow', tasks: [] },
    'done': { title: 'Done', icon: 'CheckCircle2', color: 'green', tasks: [] },
  }), [])

  // Distribute tasks into columns
  const columnsWithTasks = useMemo(() => {
    const newColumns = JSON.parse(JSON.stringify(columns)) // Deep copy
    tasks.forEach(task => {
      if (newColumns[task.status]) {
        newColumns[task.status].tasks.push(task)
      }
    })
    // Sort tasks within each column (e.g., by creation date newest first)
    Object.values(newColumns).forEach(column => {
      column.tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    })
    return newColumns
  }, [tasks, columns])

  const handleDragStart = useCallback((e, task) => {
    setDraggedTask(task)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', task._id)
  }, [])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const handleDrop = useCallback(async (e, newStatus) => {
    e.preventDefault()
    if (draggedTask && draggedTask.status !== newStatus) {
      try {
        await updateTaskStatus(draggedTask._id, newStatus)
      } catch (err) {
        console.error('Failed to update task status:', err)
        // Optionally, revert UI state or show a temporary error message
      }
    }
    setDraggedTask(null)
  }, [draggedTask, updateTaskStatus])

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorDisplay message={error.message || 'Failed to load tasks for Kanban board.'} />

  return (
    <motion.div
      variants={boardVariants}
      initial="hidden"
      animate="visible"
      className="flex overflow-x-auto gap-6 pb-4"
    >
      {Object.entries(columnsWithTasks).map(([status, column]) => (
        <Column
          key={status}
          status={status}
          title={column.title}
          icon={column.icon}
          color={column.color}
          tasks={column.tasks}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        />
      ))}
    </motion.div>
  )
}

export default KanbanBoard
