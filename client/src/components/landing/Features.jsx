import { motion } from 'framer-motion'
import { Layers, Cpu, Download, MessageSquare, GitBranch, Zap } from 'lucide-react'

const FEATURES = [
  { icon: Cpu, title: 'AI-Powered Planning', desc: 'ForgeAI analyzes your requirements, plans the architecture, and designs the system before writing a single line of code.' },
  { icon: Layers, title: 'Full-Stack Generation', desc: 'Complete React frontend, Express backend, MongoDB models, REST APIs, routing — everything your app needs.' },
  { icon: MessageSquare, title: 'Iterative Improvements', desc: 'Continue chatting with AI to improve your app. Add features, fix bugs, change themes — incrementally.' },
  { icon: Download, title: 'Instant Download', desc: 'Download your complete project as a ZIP archive, ready to run locally or deploy anywhere.' },
  { icon: GitBranch, title: 'Project History', desc: 'All your generated projects are saved. Reopen, continue, or reference past projects anytime.' },
  { icon: Zap, title: 'Production Ready', desc: 'Generated code follows real engineering standards — clean architecture, proper error handling, environment variables.' },
]

export default function Features() {
  return (
    <section className="w-full max-w-6xl mx-auto px-6 py-24">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-100 mb-4">
          Everything You Need to Ship
        </h2>
        <p className="text-slate-400 text-lg max-w-xl mx-auto">
          From prompt to production-ready code in seconds. No setup. No config. Just build.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.5 }}
            className="glass hover:border-brand-500/20 rounded-2xl p-6 group transition-all duration-300 hover:bg-white/5"
          >
            <div className="w-10 h-10 rounded-xl bg-brand-500/15 flex items-center justify-center mb-4 group-hover:bg-brand-500/25 transition-colors">
              <f.icon size={20} className="text-brand-400" />
            </div>
            <h3 className="font-semibold text-slate-100 mb-2">{f.title}</h3>
            <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
