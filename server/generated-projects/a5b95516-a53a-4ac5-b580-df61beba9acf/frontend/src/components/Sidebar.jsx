import { motion } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, ListTodo, KanbanSquare, Settings, LogOut } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

const sidebarVariants = {
  hidden: { x: '-100%' },
  visible: { x: '0%', transition: { type: 'spring', stiffness: 120, damping: 14 } }
}

const linkVariants = {
  hover: { scale: 1.05, x: 5 },
  tap: { scale: 0.95 }
}

function Sidebar() {
  const { logout } = useAuth()
  const location = useLocation()

  const navLinks = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { name: 'Board View', icon: KanbanSquare, path: '/board' },
    { name: 'List View', icon: ListTodo, path: '/list' },
    { name: 'Settings', icon: Settings, path: '/settings' },
  ]

  return (
    <motion.aside
      initial="hidden"
      animate="visible"
      variants={sidebarVariants}
      className="fixed inset-y-0 left-0 w-64 bg-darkcard text-darktext p-6 flex flex-col shadow-lg border-r border-darkborder z-40"
    >
      <div className="text-3xl font-bold text-primary-400 mb-10 text-center">
        Task Manager
      </div>
      <nav className="flex-1">
        <ul className="space-y-3">
          {navLinks.map((link) => (
            <motion.li key={link.name} whileHover="hover" whileTap="tap" variants={linkVariants}>
              <Link
                to={link.path}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors duration-200
                  ${location.pathname === link.path ? 'bg-primary-600 text-white shadow-md' : 'text-darktextsecondary hover:bg-darkbg hover:text-primary-400'}`}
              >
                <link.icon className="w-5 h-5" />
                <span className="text-lg font-medium">{link.name}</span>
              </Link>
            </motion.li>
          ))}
        </ul>
      </nav>
      <div className="mt-auto">
        <motion.button
          whileHover="hover"
          whileTap="tap"
          variants={linkVariants}
          onClick={logout}
          className="w-full flex items-center gap-3 p-3 rounded-lg text-red-400 hover:bg-darkbg hover:text-red-500 transition-colors duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-lg font-medium">Logout</span>
        </motion.button>
      </div>
    </motion.aside>
  )
}

export default Sidebar
