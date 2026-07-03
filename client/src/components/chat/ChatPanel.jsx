import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Send, Loader2, Bot, User } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { chatService } from '@/services/chat.service'
import { useProject } from '@/context/ProjectContext'
import { projectService } from '@/services/project.service'

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 py-1 px-1">
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className="w-1.5 h-1.5 bg-brand-400 rounded-full"
          style={{ animation: `typing-dot 1.2s ease-in-out ${i * 0.2}s infinite` }}
        />
      ))}
    </div>
  )
}

function ChatMessage({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 p-3 rounded-xl ${isUser ? 'chat-message-user' : 'chat-message-assistant'}`}
    >
      <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
        isUser ? 'bg-brand-500/30' : 'bg-white/8'
      }`}>
        {isUser ? <User size={12} className="text-brand-300" /> : <Bot size={12} className="text-slate-300" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium mb-1 text-slate-400">
          {isUser ? 'You' : 'PromptAI'}
        </div>
        <div className="text-sm text-slate-200 leading-relaxed prose-chat">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
        </div>
      </div>
    </motion.div>
  )
}

export default function ChatPanel({ projectId }) {
  const {
    triggerFileTreeRefresh,
    setCurrentProject,
    isGeneratingChat,
    setIsGeneratingChat,
    chatProgressIndex,
    setChatProgressIndex,
    setGenerationSummary,
    gitStatus
  } = useProject()

  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (!projectId) return
    chatService.getHistory(projectId).then(setMessages).catch(() => {})
  }, [projectId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping, isGeneratingChat])

  const handleSend = async () => {
    if (!input.trim() || loading) return
    const userMsg = { role: 'user', content: input.trim(), timestamp: new Date() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)
    setIsTyping(true)
    setIsGeneratingChat(true)
    setChatProgressStage('Understanding Project')
    setChatProgressIndex(1)

    try {
      const data = await chatService.sendMessage(projectId, userMsg.content, (status) => {
        setChatProgressStage(status.stage)
        setChatProgressIndex(status.index)
      })
      setIsTyping(false)
      setIsGeneratingChat(false)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.assistantMessage,
        timestamp: new Date()
      }])
      triggerFileTreeRefresh()
      projectService.getProject(projectId).then(setCurrentProject).catch(() => {})
      setGenerationSummary(data) // Open success summary modal!
    } catch (err) {
      setIsTyping(false)
      setIsGeneratingChat(false)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: err?.message || '⚠️ Failed to process your request. Please try again.',
        timestamp: new Date()
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  return (
    <div className="flex flex-col h-full border-t border-white/6 bg-surface-1">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-white/6 flex items-center gap-2">
        <Bot size={14} className="text-brand-400" />
        <span className="text-xs font-semibold text-slate-300">AI Chat</span>
        <span className="ml-auto text-xs text-slate-600">Continue improving your project</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 && (
          <div className="text-center py-6 text-slate-600">
            <Bot size={24} className="mx-auto mb-2 opacity-30" />
            <p className="text-xs">Ask AI to improve your project</p>
            <p className="text-xs mt-1 opacity-60">"Add authentication", "Improve the UI", "Add a dashboard"</p>
          </div>
        )}
        {messages.map((msg, i) => <ChatMessage key={i} msg={msg} />)}
        {isTyping && !isGeneratingChat && (
          <div className="flex gap-3 p-3 rounded-xl chat-message-assistant">
            <div className="w-6 h-6 rounded-lg bg-white/8 flex items-center justify-center shrink-0">
              <Bot size={12} className="text-slate-300" />
            </div>
            <TypingIndicator />
          </div>
        )}
        {isGeneratingChat && (
          <div className="flex gap-3 p-3 rounded-xl chat-message-assistant">
            <div className="w-6 h-6 rounded-lg bg-white/8 flex items-center justify-center shrink-0">
              <Bot size={12} className="text-slate-300" />
            </div>
            <div className="glass-strong rounded-xl p-3 border border-white/5 max-w-sm flex-1 flex flex-col gap-2 bg-surface-2 shadow-lg">
              <div className="flex items-center gap-2 border-b border-white/4 pb-1.5 mb-1">
                <Loader2 size={12} className="text-brand-400 animate-spin" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">AI Thinking Timeline</span>
              </div>
              <div className="space-y-1.5">
                {[
                  'Understanding Project',
                  'Analyzing Existing Code',
                  'Planning Changes',
                  'Generating Source Files',
                  'Running Code Review Checks',
                  'Writing Workspace Files',
                  'Saving Version History'
                ].map((step, idx) => {
                  const isCompleted = idx < chatProgressIndex - 1
                  const isActive = idx === chatProgressIndex - 1
                  return (
                    <div key={step} className={`flex items-center gap-2 text-xs transition-all duration-200 ${
                      isActive ? 'text-brand-400 font-semibold' :
                      isCompleted ? 'text-emerald-400 opacity-70' : 'text-slate-600 opacity-40'
                    }`}>
                      {isCompleted ? (
                        <span className="text-[10px] text-emerald-400 font-bold shrink-0">✓</span>
                      ) : isActive ? (
                        <Loader2 size={10} className="animate-spin text-brand-400 shrink-0" />
                      ) : (
                        <span className="w-1 h-1 rounded-full bg-slate-700 shrink-0 ml-1" />
                      )}
                      <span className="truncate">{step}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3 pb-3 pt-2">
        {gitStatus && !gitStatus.clean ? (
          <div className="bg-yellow-500/5 border border-yellow-500/15 rounded-xl p-3 text-center space-y-2">
            <p className="text-[11px] text-yellow-500 leading-relaxed font-sans font-medium">
              ⚠️ You have uncommitted manual changes in the workspace. Please commit or discard them in the Git panel to resume AI editing.
            </p>
          </div>
        ) : (
          <div className="flex gap-2 glass rounded-xl p-2">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask AI to improve your project..."
              rows={1}
              disabled={loading}
              className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-600 outline-none resize-none"
              style={{ maxHeight: '100px' }}
            />
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="w-8 h-8 rounded-lg bg-brand-500 disabled:opacity-40 flex items-center justify-center text-white shrink-0 hover:bg-brand-600 transition-colors"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </motion.button>
          </div>
        )}
      </div>
    </div>
  )
}
