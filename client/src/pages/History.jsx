import { motion } from 'framer-motion'
import HistoryGrid from '@/components/history/HistoryGrid'
import { History as HistoryIcon } from 'lucide-react'

export default function History() {
  return (
    <div className="min-h-[calc(100vh-64px)]">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-6 py-8 border-b border-white/5"
        >
          <div className="flex items-center gap-3 mb-1">
            <HistoryIcon size={18} className="text-brand-400" />
            <h1 className="text-2xl font-bold text-slate-100">Project History</h1>
          </div>
          <p className="text-slate-400 text-sm ml-8">All your generated projects, ready to open or continue.</p>
        </motion.div>
        <HistoryGrid />
      </div>
    </div>
  )
}
