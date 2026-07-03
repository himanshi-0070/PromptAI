import { useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogIn, Mail, Lock, Loader2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
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

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }, [email, password, login, navigate])

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="flex items-center justify-center min-h-screen bg-darkbg"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-darkcard p-8 rounded-lg shadow-xl border border-darkborder w-full max-w-md"
      >
        <h2 className="text-4xl font-bold text-center text-darktext mb-8 flex items-center justify-center gap-3">
          <LogIn className="w-9 h-9 text-primary-400" />
          Login
        </h2>
        {error && <ErrorDisplay message={error} className="mb-6" />}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-darktextsecondary text-sm font-medium mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-darktextsecondary" />
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 bg-darkbg border border-darkborder rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-darktext"
                placeholder="your@example.com"
              />
            </div>
          </div>
          <div>
            <label htmlFor="password" className="block text-darktextsecondary text-sm font-medium mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-darktextsecondary" />
              <input
                type="password"
                id="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 bg-darkbg border border-darkborder rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-darktext"
                placeholder="********"
              />
            </div>
          </div>
          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-primary-600 text-white font-semibold rounded-md shadow-md hover:bg-primary-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
            {loading ? 'Logging in...' : 'Login'}
          </motion.button>
        </form>
        <p className="text-center text-darktextsecondary mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary-400 hover:underline font-medium">
            Register
          </Link>
        </p>
      </motion.div>
    </motion.div>
  )
}

export default Login
