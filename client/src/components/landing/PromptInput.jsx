import { useRef } from 'react'
import { motion } from 'framer-motion'
import { Zap, X } from 'lucide-react'

const MAX_CHARS = 4000

export default function PromptInput({ onGenerate, isGenerating, value, onChange }) {
  const textareaRef = useRef(null)

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleSubmit = () => {
    if (!value.trim() || isGenerating) return
    onGenerate(value.trim())
  }

  const handleInput = (e) => {
    onChange(e.target.value)
    // Auto-grow
    const ta = textareaRef.current
    if (ta) {
      ta.style.height = 'auto'
      ta.style.height = Math.min(ta.scrollHeight, 300) + 'px'
    }
  }

  const remaining = MAX_CHARS - value.length
  const isOverLimit = remaining < 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="w-full max-w-3xl mx-auto px-4"
    >
      <div className={`relative glass-strong rounded-2xl transition-all duration-300 ${
        isOverLimit ? 'border-red-500/40' : 'hover:border-brand-500/30 focus-within:border-brand-500/50'
      }`}>
        <textarea
          ref={textareaRef}
          id="prompt-input"
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          disabled={isGenerating}
          placeholder="Describe the application you want to build...&#10;&#10;e.g. Build a modern restaurant website with menu, reservations, and a contact form."
          rows={4}
          className="w-full bg-transparent text-slate-200 placeholder-slate-500 text-base leading-relaxed p-5 pb-3 resize-none outline-none rounded-2xl"
          style={{ minHeight: '120px', maxHeight: '300px' }}
        />

        {/* Bottom bar */}
        <div className="flex items-center justify-between px-5 pb-4 pt-1">
          <div className="flex items-center gap-3">
            {value && (
              <button
                onClick={() => { onChange(''); if (textareaRef.current) textareaRef.current.style.height = 'auto' }}
                className="text-slate-500 hover:text-slate-300 transition-colors p-1 rounded"
              >
                <X size={14} />
              </button>
            )}
            <span className={`text-xs ${isOverLimit ? 'text-red-400' : 'text-slate-600'}`}>
              {remaining.toLocaleString()} chars remaining
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:flex items-center gap-1 text-xs text-slate-600">
              <kbd className="px-1.5 py-0.5 bg-white/5 rounded text-xs font-mono">Ctrl</kbd>
              <span>+</span>
              <kbd className="px-1.5 py-0.5 bg-white/5 rounded text-xs font-mono">↵</kbd>
            </span>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSubmit}
              disabled={!value.trim() || isGenerating || isOverLimit}
              id="generate-btn"
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all duration-200 glow-brand-sm"
            >
              <Zap size={15} fill="white" />
              {isGenerating ? 'Generating...' : 'Generate'}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
