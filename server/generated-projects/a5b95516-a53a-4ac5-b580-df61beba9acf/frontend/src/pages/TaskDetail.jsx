import { motion } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import { useTasks } from '../hooks/useTasks'
import { useProjects } from '../hooks/useProjects'
import { useAuth } from '../hooks/useAuth'
import { 
  Calendar, 
  Tag, 
  Flag, 
  ListTodo, 
  Edit, 
  Trash2, 
  ArrowLeft, 
  Save, 
  XCircle, 
  Loader2 
} from 'lucide-react'
import PriorityBadge from '../components/PriorityBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorDisplay from '../components/ErrorDisplay'

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 }
}

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.5
}

function TaskDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { tasks, updateTask, deleteTask, loading: tasksLoading, error: tasksError } = useTasks()
  const { projects, loading: projectsLoading, error: projectsError } = useProjects()
  const { user } = useAuth()

  const [task, setTask] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium',
    status: 'todo',
    project: ''
  })
  const [formError, setFormError] = useState(null)
  const [isSaving, setIsSaving] = useState(false)

  const currentTask = tasks.find(t => t._id === id)

  useEffect(() => {
    if (currentTask) {
      setTask(currentTask)
      setFormData({
        title: currentTask.title,
        description: currentTask.description || '',
        dueDate: currentTask.dueDate ? new Date(currentTask.dueDate).toISOString().split('T')[0] : '',
        priority: currentTask.priority,
        status: currentTask.status,
        project: currentTask.project || ''
      })
    } else if (!tasksLoading && !tasksError) {
      // If task not found after loading, it might be an invalid ID or deleted
      // navigate('/not-found') // Or handle as appropriate
    }
  }, [currentTask, tasksLoading, tasksError])

  const handleChange = useCallback((e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }, [])

  const handleSave = async () => {
    setFormError(null)
    setIsSaving(true)
    try {
      const updatedTask = await updateTask(id, formData)
      setTask(updatedTask)
      setIsEditing(false)
    } catch (err) {
      setFormError(err.message || 'Failed to update task.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask(id)
        navigate('/list') // Redirect to list view after deletion
      } catch (err) {
        setFormError(err.message || 'Failed to delete task.')
      }
    }
  }

  const getProjectName = useCallback((projectId) => {
    const project = projects.find(p => p._id === projectId)
    return project ? project.name : 'No Project'
  }, [projects])

  if (tasksLoading || projectsLoading) return <LoadingSpinner />
  if (tasksError || projectsError) return <ErrorDisplay message={tasksError?.message || projectsError?.message || 'Failed to load task details.'} />
  if (!task) return <ErrorDisplay message="Task not found." />

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="container mx-auto py-8"
    >
      <div className="flex items-center justify-between mb-8">
        <motion.button
          whileHover={{ x: -5 }}
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-darktextsecondary hover:text-primary-500 transition-colors duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </motion.button>
        <h1 className="text-4xl font-bold text-darktext flex items-center gap-3">
          <ListTodo className="w-10 h-10 text-primary-400" />
          Task Details
        </h1>
        <div className="flex gap-4">
          {!isEditing ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-secondary-600 text-white rounded-md hover:bg-secondary-700 transition-colors duration-200"
            >
              <Edit className="w-5 h-5" />
              Edit
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {isSaving ? 'Saving...' : 'Save'}
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
          >
            <Trash2 className="w-5 h-5" />
            Delete
          </motion.button>
        </div>
      </div>

      {formError && <ErrorDisplay message={formError} className="mb-4" />}

      <div className="bg-darkcard p-8 rounded-lg shadow-lg border border-darkborder">
        {isEditing ? (
          <div className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-darktextsecondary text-sm font-medium mb-2">Title</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full p-3 bg-darkbg border border-darkborder rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-darktext"
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-darktextsecondary text-sm font-medium mb-2">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="5"
                className="w-full p-3 bg-darkbg border border-darkborder rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-darktext"
              ></textarea>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="dueDate" className="block text-darktextsecondary text-sm font-medium mb-2">Due Date</label>
                <input
                  type="date"
                  id="dueDate"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  className="w-full p-3 bg-darkbg border border-darkborder rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-darktext"
                />
              </div>
              <div>
                <label htmlFor="priority" className="block text-darktextsecondary text-sm font-medium mb-2">Priority</label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full p-3 bg-darkbg border border-darkborder rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-darktext appearance-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="status" className="block text-darktextsecondary text-sm font-medium mb-2">Status</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full p-3 bg-darkbg border border-darkborder rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-darktext appearance-none"
                >
                  <option value="backlog">Backlog</option>
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
              <div>
                <label htmlFor="project" className="block text-darktextsecondary text-sm font-medium mb-2">Project</label>
                <select
                  id="project"
                  name="project"
                  value={formData.project}
                  onChange={handleChange}
                  className="w-full p-3 bg-darkbg border border-darkborder rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-darktext appearance-none"
                >
                  <option value="">No Project</option>
                  {projects.map(proj => (
                    <option key={proj._id} value={proj._id}>{proj.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsEditing(false)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors duration-200"
              >
                <XCircle className="w-5 h-5" />
                Cancel
              </motion.button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-darktext mb-2">{task.title}</h2>
              <p className="text-darktextsecondary text-lg">{task.description || 'No description provided.'}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center gap-3">
                <Calendar className="w-6 h-6 text-primary-400" />
                <div>
                  <p className="text-darktextsecondary text-sm">Due Date</p>
                  <p className="text-darktext font-medium">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Flag className="w-6 h-6 text-secondary-400" />
                <div>
                  <p className="text-darktextsecondary text-sm">Priority</p>
                  <PriorityBadge priority={task.priority} />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center gap-3">
                <ListTodo className="w-6 h-6 text-indigo-400" />
                <div>
                  <p className="text-darktextsecondary text-sm">Status</p>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${task.status === 'done' ? 'bg-green-500/20 text-green-400' : task.status === 'in-progress' ? 'bg-yellow-500/20 text-yellow-400' : task.status === 'todo' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                    {task.status.charAt(0).toUpperCase() + task.status.slice(1).replace('-', ' ')}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Tag className="w-6 h-6 text-violet-400" />
                <div>
                  <p className="text-darktextsecondary text-sm">Project</p>
                  <p className="text-darktext font-medium">{task.project ? getProjectName(task.project) : 'No Project'}</p>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-darkborder text-darktextsecondary text-sm">
              <p>Created by: {user?.name || 'Unknown'}</p>
              <p>Created on: {new Date(task.createdAt).toLocaleDateString()} at {new Date(task.createdAt).toLocaleTimeString()}</p>
              {task.updatedAt && task.createdAt !== task.updatedAt && (
                <p>Last updated: {new Date(task.updatedAt).toLocaleDateString()} at {new Date(task.updatedAt).toLocaleTimeString()}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default TaskDetail
