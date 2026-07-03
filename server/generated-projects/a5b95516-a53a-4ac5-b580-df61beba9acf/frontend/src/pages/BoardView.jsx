import { motion } from 'framer-motion'
import KanbanBoard from '../components/KanbanBoard'
import AddTaskForm from '../components/AddTaskForm'
import { PlusCircle, KanbanSquare } from 'lucide-react'
import { useState } from 'react'

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

function BoardView() {
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false)

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
          <KanbanSquare className="w-10 h-10 text-secondary-400" />
          Kanban Board
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

      <KanbanBoard />

      <AddTaskForm isOpen={isAddTaskModalOpen} onClose={() => setIsAddTaskModalOpen(false)} />
    </motion.div>
  )
}

export default BoardView
