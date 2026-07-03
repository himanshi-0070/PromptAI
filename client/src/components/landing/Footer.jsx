import { Zap } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="border-t border-white/5 mt-8">
      <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-brand-500 flex items-center justify-center">
            <Zap size={12} className="text-white" fill="white" />
          </div>
          <span className="text-sm font-semibold text-slate-300">PromptAI</span>
        </div>

        <p className="text-sm text-slate-500">
          AI-powered full-stack project generation. Describe it. Build it. Ship it.
        </p>

        <div className="flex items-center gap-4 text-sm text-slate-500">
          <Link to="/history" className="hover:text-slate-300 transition-colors">History</Link>
          <Link to="/settings" className="hover:text-slate-300 transition-colors">Settings</Link>
        </div>
      </div>
    </footer>
  )
}
