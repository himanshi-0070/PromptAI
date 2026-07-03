import { motion } from 'framer-motion'

const STEPS = [
  { n: '01', title: 'Describe Your App', desc: 'Type what you want to build in plain English. Be as detailed or as brief as you like.' },
  { n: '02', title: 'AI Plans & Designs', desc: 'ForgeAI analyzes requirements, plans the architecture, determines components, APIs, and database models.' },
  { n: '03', title: 'Code Is Generated', desc: 'A complete full-stack project is generated: React frontend, Express backend, MongoDB models, and all configuration.' },
  { n: '04', title: 'Browse & Improve', desc: 'Explore the file tree, view the code, and continue chatting with AI to refine or extend your application.' },
]

export default function HowItWorks() {
  return (
    <section className="w-full max-w-4xl mx-auto px-6 py-16 border-t border-white/5">
      <div className="text-center mb-14">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-100 mb-3">How It Works</h2>
        <p className="text-slate-400">Four steps from idea to running application.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {STEPS.map((step, i) => (
          <motion.div
            key={step.n}
            initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            className="flex gap-5 p-5 glass rounded-2xl"
          >
            <span className="text-4xl font-extrabold text-brand-500/30 font-mono shrink-0 leading-none mt-0.5">
              {step.n}
            </span>
            <div>
              <h3 className="font-semibold text-slate-100 mb-1.5">{step.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{step.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
