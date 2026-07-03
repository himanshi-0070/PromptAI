import { motion } from 'framer-motion'
import { useTasks } from '../hooks/useTasks'
import { useProjects } from '../hooks/useProjects'
import { Link } from 'react-router-dom'
import { 
  LayoutDashboard, 
  ListTodo, 
  KanbanSquare, 
  CheckCircle2, 
  Hourglass, 
  XCircle, 
  CircleDotDashed 
} from 'lucide-react'
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

const cardVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } }
}

function Dashboard() {
  const { tasks, loading: tasksLoading, error: tasksError } = useTasks()
  const { projects, loading: projectsLoading, error: projectsError } = useProjects()

  const totalTasks = tasks.length
  const completedTasks = tasks.filter(task => task.status === 'done').length
  const inProgressTasks = tasks.filter(task => task.status === 'in-progress').length
  const todoTasks = tasks.filter(task => task.status === 'todo').length
  const backlogTasks = tasks.filter(task => task.status === 'backlog').length

  const loading = tasksLoading || projectsLoading
  const error = tasksError || projectsError

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorDisplay message={error.message || 'Failed to load dashboard data.'} />

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="container mx-auto py-8"
    >
      <h1 className="text-4xl font-bold mb-8 text-darktext flex items-center gap-3">
        <LayoutDashboard className="w-10 h-10 text-primary-400" />
        Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <motion.div variants={cardVariants} initial="hidden" animate="visible" className="bg-darkcard p-6 rounded-lg shadow-lg border border-darkborder hover:border-primary-500 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-darktextsecondary">Total Tasks</h2>
            <ListTodo className="w-6 h-6 text-primary-400" />
          </div>
          <p className="text-5xl font-bold text-darktext">{totalTasks}</p>
        </motion.div>

        <motion.div variants={cardVariants} initial="hidden" animate="visible" className="bg-darkcard p-6 rounded-lg shadow-lg border border-darkborder hover:border-green-500 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-darktextsecondary">Completed</h2>
            <CheckCircle2 className="w-6 h-6 text-green-400" />
          </div>
          <p className="text-5xl font-bold text-darktext">{completedTasks}</p>
        </motion.div>

        <motion.div variants={cardVariants} initial="hidden" animate="visible" className="bg-darkcard p-6 rounded-lg shadow-lg border border-darkborder hover:border-yellow-500 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-darktextsecondary">In Progress</h2>
            <Hourglass className="w-6 h-6 text-yellow-400" />
          </div>
          <p className="text-5xl font-bold text-darktext">{inProgressTasks}</p>
        </motion.div>

        <motion.div variants={cardVariants} initial="hidden" animate="visible" className="bg-darkcard p-6 rounded-lg shadow-lg border border-darkborder hover:border-red-500 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-darktextsecondary">To Do</h2>
            <XCircle className="w-6 h-6 text-red-400" />
          </div>
          <p className="text-5xl font-bold text-darktext">{todoTasks}</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={cardVariants} initial="hidden" animate="visible" className="bg-darkcard p-6 rounded-lg shadow-lg border border-darkborder">
          <h2 className="text-2xl font-semibold mb-4 text-darktext flex items-center gap-2">
            <KanbanSquare className="w-6 h-6 text-secondary-400" />
            Task Status Overview
          </h2>
          <ul className="space-y-3">
            <li className="flex justify-between items-center text-darktextsecondary">
              <span className="flex items-center gap-2"><CheckCircle2 className="text-green-400" /> Completed</span>
              <span className="text-darktext font-medium">{completedTasks}</span>
            </li>
            <li className="flex justify-between items-center text-darktextsecondary">
              <span className="flex items-center gap-2"><Hourglass className="text-yellow-400" /> In Progress</span>
              <span className="text-darktext font-medium">{inProgressTasks}</span>
            </li>
            <li className="flex justify-between items-center text-darktextsecondary">
              <span className="flex items-center gap-2"><XCircle className="text-red-400" /> To Do</span>
              <span className="text-darktext font-medium">{todoTasks}</span>
            </li>
            <li className="flex justify-between items-center text-darktextsecondary">
              <span className="flex items-center gap-2"><CircleDotDashed className="text-blue-400" /> Backlog</span>
              <span className="text-darktext font-medium">{backlogTasks}</span>
            </li>
          </ul>
          <div className="mt-6 flex justify-end">
            <Link to="/board" className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors duration-200">
              View Kanban Board
            </Link>
          </div>
        </motion.div>

        <motion.div variants={cardVariants} initial="hidden" animate="visible" className="bg-darkcard p-6 rounded-lg shadow-lg border border-darkborder">
          <h2 className="text-2xl font-semibold mb-4 text-darktext flex items-center gap-2">
            <ListTodo className="w-6 h-6 text-primary-400" />
            Projects Overview
          </h2>
          {projects.length > 0 ? (
            <ul className="space-y-3">
              {projects.slice(0, 5).map(project => (
                <li key={project._id} className="flex justify-between items-center text-darktextsecondary">
                  <span>{project.name}</span>
                  <span className="text-darktext font-medium">{tasks.filter(task => task.project === project._id).length} tasks</span>
                </li>
              ))}
              {projects.length > 5 && (
                <li className="text-center text-darktextsecondary">
                  ... {projects.length - 5} more projects
                </li>
              )}
            </ul>
          ) : (
            <p className="text-darktextsecondary">No projects found. Start by creating one!</p>
          )}
          <div className="mt-6 flex justify-end">
            <Link to="/settings" className="px-4 py-2 bg-secondary-600 text-white rounded-md hover:bg-secondary-700 transition-colors duration-200">
              Manage Projects
            </Link>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default Dashboard
