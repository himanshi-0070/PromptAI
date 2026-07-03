import { motion } from 'framer-motion'
import { Zap, ArrowRight, Sparkles } from 'lucide-react'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12 } }
}
const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
}

export default function Hero({ onGetStarted }) {
  return (
    <motion.section
      variants={container}
      initial="hidden"
      animate="show"
      className="relative min-h-[60vh] flex flex-col items-center justify-center text-center px-6 pt-24 pb-12 overflow-hidden"
    >
      {/* Background glow orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-brand-500/8 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-violet-500/5 rounded-full blur-[80px]" />
      </div>

      {/* Badge */}
      <motion.div variants={item} className="mb-6">
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-300 text-sm font-medium">
          <Sparkles size={13} className="animate-pulse" />
          Powered by Gemini AI
        </span>
      </motion.div>

      {/* Heading */}
      <motion.h1
        variants={item}
        className="text-5xl md:text-7xl font-extrabold max-w-4xl leading-[1.05] mb-6"
      >
        Build Full-Stack Apps
        <br />
        <span className="gradient-text">From a Single Prompt.</span>
      </motion.h1>

      {/* Description */}
      <motion.p
        variants={item}
        className="text-lg md:text-xl text-slate-400 max-w-2xl leading-relaxed mb-10"
      >
        Describe what you want to build. PromptAI analyzes, plans, and generates a
        complete production-ready application — frontend, backend, APIs, and database — in seconds.
      </motion.p>

      {/* CTA */}
      <motion.div variants={item} className="flex items-center gap-4">
        <motion.button
          whileHover={{ scale: 1.04, boxShadow: '0 0 30px rgba(99,102,241,0.4)' }}
          whileTap={{ scale: 0.97 }}
          onClick={onGetStarted}
          className="flex items-center gap-2 px-8 py-3.5 bg-brand-500 hover:bg-brand-600 text-white font-semibold text-base rounded-xl transition-colors duration-200"
        >
          <Zap size={18} fill="white" />
          Start Building
          <ArrowRight size={16} />
        </motion.button>
      </motion.div>

      {/* Stats */}
      <motion.div
        variants={item}
        className="mt-16 flex items-center gap-8 text-slate-500 text-sm"
      >
        {[
          ['Frontend + Backend', 'Complete stack'],
          ['MongoDB + APIs', 'Ready to deploy'],
          ['Instant download', 'Your code, your project'],
        ].map(([title, sub]) => (
          <div key={title} className="text-center">
            <div className="font-semibold text-slate-300">{title}</div>
            <div className="text-xs mt-0.5">{sub}</div>
          </div>
        ))}
      </motion.div>
    </motion.section>
  )
}
