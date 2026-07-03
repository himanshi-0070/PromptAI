import { motion } from 'framer-motion'
import { useTasks } from '../hooks/useTasks'
import { useState, useMemo } from 'react'
import { ListTodo, PlusCircle, Search, Filter, ArrowUp, ArrowDown } from 'lucide-react'
import TaskCard from '../components/TaskCard'
import AddTaskForm from '../components/AddTaskForm'
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

function ListView() {
  const { tasks, loading, error } = useTasks()
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [sortOrder, setSortOrder] = useState('newest') // 'newest', 'oldest', 'priority_high', 'priority_low'

  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks

    if (searchTerm) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(task => task.status === filterStatus)
    }

    if (filterPriority !== 'all') {
      filtered = filtered.filter(task => task.priority === filterPriority)
    }

    // Sorting logic
    filtered.sort((a, b) => {
      if (sortOrder === 'newest') {
        return new Date(b.createdAt) - new Date(a.createdAt)
      } else if (sortOrder === 'oldest') {
        return new Date(a.createdAt) - new Date(b.createdAt)
      } else if (sortOrder === 'priority_high') {
        const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 }
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      } else if (sortOrder === 'priority_low') {
        const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 }
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      }
      return 0
    })

    return filtered
  }, [tasks, searchTerm, filterStatus, filterPriority, sortOrder])

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorDisplay message={error.message || 'Failed to load tasks.'} />

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="container mx-auto py-8"
    >
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-darktext flex items-center gap-3">
          <ListTodo className="w-10 h-10 text-primary-400" />
          Task List
        </h1>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsAddTaskModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2 bg-primary-600 text-white rounded-lg shadow-md hover:bg-primary-700 transition-colors duration-200"
        >
          <PlusCircle className="w-5 h-5" />
          Add Task
        </motion.button>
      </div>

      <div className="bg-darkcard p-6 rounded-lg shadow-lg mb-8 border border-darkborder">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-darktextsecondary" />
            <input
              type="text"
              placeholder="Search tasks..."
              className="w-full pl-10 pr-4 py-2 bg-darkbg border border-darkborder rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-darktext"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-darktextsecondary" />
            <select
              className="w-full pl-10 pr-4 py-2 bg-darkbg border border-darkborder rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-darktext appearance-none"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Done</option>
              <option value="backlog">Backlog</option>
            </select>
            <ArrowDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-darktextsecondary pointer-events-none" />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-darktextsecondary" />
            <select
              className="w-full pl-10 pr-4 py-2 bg-darkbg border border-darkborder rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-darktext appearance-none"
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
            >
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <ArrowDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-darktextsecondary pointer-events-none" />
          </div>

          <div className="relative">
            <ArrowUp className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-darktextsecondary" />
            <select
              className="w-full pl-10 pr-4 py-2 bg-darkbg border border-darkborder rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-darktext appearance-none"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="priority_high">Priority (High to Low)</option>
              <option value="priority_low">Priority (Low to High)</option>
            </select>
            <ArrowDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-darktextsecondary pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredAndSortedTasks.length > 0 ? (
          filteredAndSortedTasks.map(task => (
            <TaskCard key={task._id} task={task} />
          ))
        ) : (
          <p className="col-span-full text-center text-darktextsecondary text-lg py-10">No tasks found matching your criteria.</p>
        )}
      </div>

      <AddTaskForm isOpen={isAddTaskModalOpen} onClose={() => setIsAddTaskModalOpen(false)} />
    </motion.div>
  )
}

export default ListView
