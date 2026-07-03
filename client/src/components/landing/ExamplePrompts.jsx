import { motion } from 'framer-motion'

const EXAMPLES = [
  { icon: '🍽️', title: 'Restaurant Website', prompt: 'Build a modern restaurant website with an interactive menu, reservation system, photo gallery, and contact form. Use a warm dark theme.' },
  { icon: '📊', title: 'Finance Dashboard', prompt: 'Create a finance dashboard with charts, transaction history, budget tracking, expense categories, and monthly summaries.' },
  { icon: '🛒', title: 'E-Commerce Store', prompt: 'Build a full e-commerce store with product listings, shopping cart, checkout flow, product search, and category filtering.' },
  { icon: '🎯', title: 'Task Manager', prompt: 'Create a task management app with kanban board, drag and drop tasks, due dates, priority levels, and project organization.' },
  { icon: '✈️', title: 'Travel Booking App', prompt: 'Build a travel booking website with destination search, hotel listings, booking forms, price comparison, and reviews.' },
  { icon: '💼', title: 'Portfolio Website', prompt: 'Create a developer portfolio with animated hero, projects showcase, skills section, blog, and contact form. Make it visually stunning.' },
]

export default function ExamplePrompts({ onSelect }) {
  return (
    <section className="w-full max-w-5xl mx-auto px-4 mt-10">
      <p className="text-center text-sm text-slate-500 mb-5 font-medium tracking-wide uppercase">
        Or try an example
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {EXAMPLES.map((ex, i) => (
          <motion.button
            key={ex.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.4 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(ex.prompt)}
            className="glass hover:border-brand-500/30 rounded-xl p-4 text-left transition-all duration-200 group"
          >
            <span className="text-2xl block mb-2">{ex.icon}</span>
            <div className="font-medium text-sm text-slate-200 group-hover:text-white transition-colors">
              {ex.title}
            </div>
            <div className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
              {ex.prompt}
            </div>
          </motion.button>
        ))}
      </div>
    </section>
  )
}
