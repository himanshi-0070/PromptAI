import React from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-darkbg text-primary-400">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      >
        <Loader2 className="w-12 h-12" />
      </motion.div>
      <p className="ml-4 text-xl font-medium">Loading...</p>
    </div>
  )
}

export default LoadingSpinner
