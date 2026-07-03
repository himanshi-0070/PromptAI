import React from 'react'
import { motion } from 'framer-motion'
import { AlertCircle } from 'lucide-react'

function ErrorDisplay({ message, className = '' }) {
  if (!message) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={`flex items-center gap-3 p-4 bg-red-800/20 text-red-400 border border-red-700 rounded-md ${className}`}
      role="alert"
    >
      <AlertCircle className="w-5 h-5 flex-shrink-0" />
      <p className="text-sm font-medium">{message}</p>
    </motion.div>
  )
}

export default ErrorDisplay
