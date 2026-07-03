import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Calendar, Tag, Project, MessageSquare } from 'lucide-react'
import PriorityBadge from './PriorityBadge'
import { useProjects } from '../hooks/useProjects'
import { useMemo } from 'react'

function TaskCard({ task }) {
  const { projects } = useProjects()

  const getProjectName = useMemo(() => {
    const project = projects.find(p => p._id === task.project)
    return project ? project.name : 'No Project'
  }, [projects, task.project])

  const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="bg-darkcard p-5 rounded-lg shadow-md border border-darkborder hover:border-primary-500 transition-all duration-300 cursor-pointer"
    >
      <Link to={`/task/${task._id}`} className="block">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-semibold text-darktext leading-tight pr-2">{task.title}</h3>
          <PriorityBadge priority={task.priority} />
        </div>
        <p className="text-darktextsecondary text-sm mb-4 line-clamp-2">{task.description || 'No description.'}</p>

        <div className="space-y-2 text-darktextsecondary text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary-400" />
            <span>Due: {dueDate}</span>
          </div>
          <div className="flex items-center gap-2">
            <Project className="w-4 h-4 text-secondary-400" />
            <span>Project: {getProjectName}</span>
          </div>
          {task.labels && task.labels.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Tag className="w-4 h-4 text-violet-400" />
              {task.labels.map(label => (
                <span key={label._id} className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: `${label.color}20`, color: label.color }}>
                  {label.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  )
}

export default TaskCard
