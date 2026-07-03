import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PlusCircle, XCircle, Loader2, Calendar, Tag, Flag, ListTodo, Project } from 'lucide-react'
import { useTasks } from '../hooks/useTasks'
import { useProjects } from '../hooks/useProjects'
import ErrorDisplay from './ErrorDisplay'

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 }
}

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
}

function AddTaskForm({ isOpen, onClose }) {
  const { createTask } = useTasks()
  const { projects, loading: projectsLoading, error: projectsError } = useProjects()

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium',
    status: 'todo',
    project: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setFormData({
        title: '',
        description: '',
        dueDate: '',
        priority: 'medium',
        status: 'todo',
        project: projects.length > 0 ? projects[0]._id : '' // Default to first project if available
      })
      setError(null)
    }
  }, [isOpen, projects])

  const handleChange = useCallback((e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }, [])

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await createTask(formData)
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to create task.')
    } finally {
      setLoading(false)
    }
  }, [formData, createTask, onClose])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={onClose}
        >
          <motion.div
            className="bg-darkcard p-8 rounded-lg shadow-2xl border border-darkborder w-full max-w-lg max-h-[90vh] overflow-y-auto"
            variants={modalVariants}
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-darktext flex items-center gap-2">
                <PlusCircle className="w-7 h-7 text-primary-400" />
                Add New Task
              </h2>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="text-darktextsecondary hover:text-red-500 transition-colors duration-200"
              >
                <XCircle className="w-7 h-7" />
              </motion.button>
            </div>

            {error && <ErrorDisplay message={error} className="mb-4" />}
            {projectsError && <ErrorDisplay message={projectsError.message || 'Failed to load projects for task creation.'} className="mb-4" />}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="title" className="block text-darktextsecondary text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full p-3 bg-darkbg border border-darkborder rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-darktext"
                  placeholder="Task title"
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-darktextsecondary text-sm font-medium mb-2">Description (Optional)</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  className="w-full p-3 bg-darkbg border border-darkborder rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-darktext"
                  placeholder="Detailed description of the task"
                ></textarea>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="dueDate" className="block text-darktextsecondary text-sm font-medium mb-2 flex items-center gap-1">
                    <Calendar className="w-4 h-4" /> Due Date (Optional)
                  </label>
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
                  <label htmlFor="priority" className="block text-darktextsecondary text-sm font-medium mb-2 flex items-center gap-1">
                    <Flag className="w-4 h-4" /> Priority
                  </label>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="status" className="block text-darktextsecondary text-sm font-medium mb-2 flex items-center gap-1">
                    <ListTodo className="w-4 h-4" /> Status
                  </label>
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
                  <label htmlFor="project" className="block text-darktextsecondary text-sm font-medium mb-2 flex items-center gap-1">
                    <Project className="w-4 h-4" /> Project (Optional)
                  </label>
                  {projectsLoading ? (
                    <div className="w-full p-3 bg-darkbg border border-darkborder rounded-md text-darktextsecondary">Loading projects...</div>
                  ) : (
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
                  )}
                </div>
              </div>
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={loading || projectsLoading}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-primary-600 text-white font-semibold rounded-md shadow-md hover:bg-primary-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlusCircle className="w-5 h-5" />}
                {loading ? 'Adding Task...' : 'Add Task'}
              </motion.button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default AddTaskForm
