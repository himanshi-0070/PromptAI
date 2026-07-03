import { motion } from 'framer-motion'
import { Bell, UserCircle, LogOut } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 120, damping: 14, duration: 0.5 }}
      className="bg-darkcard p-4 shadow-md border-b border-darkborder md:ml-0"
    >
      <div className="container mx-auto flex justify-end items-center">
        <div className="flex items-center space-x-4">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="text-darktextsecondary hover:text-primary-400 transition-colors duration-200"
          >
            <Bell className="w-6 h-6" />
          </motion.button>

          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 text-darktext hover:text-primary-400 transition-colors duration-200"
            >
              <UserCircle className="w-7 h-7" />
              <span className="font-medium hidden sm:block">{user?.name || 'Guest'}</span>
            </motion.button>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-48 bg-darkbg rounded-md shadow-lg py-1 z-50 border border-darkborder"
                >
                  <div className="block px-4 py-2 text-sm text-darktextsecondary border-b border-darkborder">
                    Signed in as <span className="font-semibold text-darktext">{user?.email}</span>
                  </div>
                  <motion.button
                    whileHover={{ backgroundColor: 'rgba(99, 102, 241, 0.1)' }}
                    className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-darktext hover:text-primary-400 transition-colors duration-200"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.nav>
  )
}

export default Navbar
