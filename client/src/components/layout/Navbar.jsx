import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, History, Settings, Sun, Moon, Plus } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'

function GithubIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
    </svg>
  )
}

import { useAuth } from '@/context/AuthContext'
import { LogOut, ChevronDown } from 'lucide-react'

export default function Navbar() {
  const { isDark, toggle } = useTheme()
  const { user, logout } = useAuth()
  const [scrolled, setScrolled] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'glass border-b border-white/8' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center glow-brand-sm group-hover:scale-110 transition-transform duration-200">
            <Zap size={16} className="text-white" fill="white" />
          </div>
          <span className="font-bold text-lg tracking-tight text-slate-100">
            Prompt<span className="gradient-text">AI</span>
          </span>
        </Link>

        {/* Nav Links */}
        <div className="flex items-center gap-2">
          <NavLink to="/history" icon={<History size={15} />} label="History" />
          <NavLink to="/settings" icon={<Settings size={15} />} label="Settings" />

          <div className="w-px h-5 bg-white/10 mx-1" />

          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all duration-200"
          >
            <GithubIcon size={15} />
            <span className="hidden sm:inline">GitHub</span>
          </a>

          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all duration-200"
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {user && (
            <div className="relative z-50">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/5 transition-all outline-none"
              >
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-6 h-6 rounded-full object-cover border border-white/10"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-brand-500/20 text-brand-300 flex items-center justify-center text-[10px] font-bold font-sans">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="hidden md:inline text-xs text-slate-350 font-medium max-w-[120px] truncate">{user.name}</span>
                <ChevronDown size={12} className="text-slate-500" />
              </button>

              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                  <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-white/8 rounded-xl shadow-xl py-1.5 z-50 font-sans text-xs">
                    <div className="px-3.5 py-2 border-b border-white/5">
                      <div className="font-semibold text-slate-200 truncate">{user.name}</div>
                      <div className="text-[10px] text-slate-500 truncate">{user.email}</div>
                    </div>
                    <button
                      onClick={() => {
                        setDropdownOpen(false)
                        logout()
                      }}
                      className="w-full text-left px-3.5 py-2 text-red-400 hover:bg-red-500/5 hover:text-red-300 transition-colors flex items-center gap-2"
                    >
                      <LogOut size={13} />
                      <span>Log Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors duration-200 glow-brand-sm"
          >
            <Plus size={14} />
            <span>Generate</span>
          </motion.button>
        </div>
      </div>
    </motion.nav>
  )
}

function NavLink({ to, icon, label }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all duration-200"
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </Link>
  )
}
