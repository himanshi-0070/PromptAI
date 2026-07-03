import { motion } from 'framer-motion'
import { CheckCircle2, Loader2 } from 'lucide-react'

const STAGES = [
  'Understanding Project',
  'Analyzing Requirements',
  'Planning Architecture',
  'Generating Source Files',
  'Running Code Review Checks',
  'Writing Workspace Files',
  'Saving Version History',
]

export default function GenerationProgress({ stage: _stage, stageIndex, totalStages }) {
  const progress = ((stageIndex + 1) / totalStages) * 100

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="w-full max-w-lg mx-auto glass-strong rounded-2xl p-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center">
          <Loader2 size={20} className="text-brand-400 animate-spin" />
        </div>
        <div>
          <div className="font-semibold text-slate-100">Generating Your Project</div>
          <div className="text-xs text-slate-500">Please wait, this may take a moment...</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 bg-white/5 rounded-full mb-6 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-brand-500 to-violet-500 rounded-full"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Stage List */}
      <div className="space-y-2.5">
        {STAGES.map((s, i) => {
          const isDone = i < stageIndex
          const isActive = i === stageIndex
          return (
            <motion.div
              key={s}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center gap-3 p-2.5 rounded-lg transition-all duration-300 ${
                isActive ? 'bg-brand-500/10 border border-brand-500/20' :
                isDone ? 'opacity-60' : 'opacity-30'
              }`}
            >
              {isDone ? (
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              ) : isActive ? (
                <Loader2 size={16} className="text-brand-400 animate-spin shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-white/20 shrink-0" />
              )}
              <span className={`text-sm ${isActive ? 'text-slate-100 font-medium' : 'text-slate-400'}`}>
                {s}
              </span>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
