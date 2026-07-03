import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-8xl font-extrabold text-brand-500/20 mb-4 font-mono">404</div>
        <h1 className="text-2xl font-bold text-slate-100 mb-3">Page Not Found</h1>
        <p className="text-slate-400 mb-8 max-w-sm">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <div className="flex items-center gap-3 justify-center">
          <Link
            to="/"
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <Home size={15} /> Go Home
          </Link>
          <Link
            to="/history"
            className="flex items-center gap-2 px-5 py-2.5 glass text-slate-300 text-sm font-medium rounded-xl hover:bg-white/8 transition-colors"
          >
            View Projects
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
