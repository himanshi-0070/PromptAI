import { motion } from 'framer-motion'
import TaskCard from './TaskCard'
import { 
  CircleDotDashed, 
  XCircle, 
  Hourglass, 
  CheckCircle2 
} from 'lucide-react'

const columnVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0 }
}

const iconMap = {
  'CircleDotDashed': CircleDotDashed,
  'XCircle': XCircle,
  'Hourglass': Hourglass,
  'CheckCircle2': CheckCircle2,
}

function Column({ status, title, icon, color, tasks, onDragStart, onDragOver, onDrop }) {
  const IconComponent = iconMap[icon]

  const handleDrop = (e) => {
    onDrop(e, status)
  }

  return (
    <motion.div
      variants={columnVariants}
      className="flex-shrink-0 w-80 bg-darkbg rounded-lg shadow-xl border border-darkborder p-4"
      onDragOver={onDragOver}
      onDrop={handleDrop}
    >
      <h2 className={`text-xl font-semibold mb-4 flex items-center gap-2 text-${color}-400`}>
        {IconComponent && <IconComponent className="w-6 h-6" />}
        {title} ({tasks.length})
      </h2>
      <div className="space-y-4 min-h-[100px]">
        {tasks.map(task => (
          <div
            key={task._id}
            draggable
            onDragStart={(e) => onDragStart(e, task)}
            className="cursor-grab"
          >
            <TaskCard task={task} />
          </div>
        ))}
        {tasks.length === 0 && (
          <p className="text-darktextsecondary text-center py-6 border border-dashed border-darkborder rounded-md">
            Drag tasks here or add a new one.
          </p>
        )}
      </div>
    </motion.div>
  )
}

export default Column
