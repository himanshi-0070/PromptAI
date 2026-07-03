import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { toast } from 'sonner'
import Hero from '@/components/landing/Hero'
import PromptInput from '@/components/landing/PromptInput'
import ExamplePrompts from '@/components/landing/ExamplePrompts'
import GenerationProgress from '@/components/landing/GenerationProgress'
import Features from '@/components/landing/Features'
import HowItWorks from '@/components/landing/HowItWorks'
import Footer from '@/components/landing/Footer'
import { useGeneration } from '@/context/GenerationContext'
import { useProject } from '@/context/ProjectContext'
import { generationService } from '@/services/generation.service'
import { historyService } from '@/services/history.service'
import { usePromptInput } from '@/hooks/usePromptInput'
import { useAuth } from '@/context/AuthContext'

export default function Landing() {
  const navigate = useNavigate()
  const { isGenerating, stage, stageIndex, totalStages, startGeneration, setGenerationStage, finishGeneration, failGeneration } = useGeneration()
  const { setCurrentProject } = useProject()
  const { user } = useAuth()
  const { value: prompt, setValue: setPrompt } = usePromptInput()
  const [recentProjects, setRecentProjects] = useState([])

  useEffect(() => {
    historyService.getHistory({ limit: 4 })
      .then(data => {
        setRecentProjects(data.projects || [])
      })
      .catch(() => {})
  }, [])

  const handleGenerate = async (promptText) => {
    const text = promptText || prompt
    if (!text.trim()) return
    startGeneration()
    toast.info('Generation started! Loading pipeline stages...')

    try {
      const data = await generationService.generateProject(text.trim(), (status) => {
        setGenerationStage(status.stage, status.index - 1)
      })
      finishGeneration(data)
      setCurrentProject(data.project)
      toast.success(`"${data.project.name}" generated successfully!`)
      navigate(`/workspace/${data.project.projectId}`)
    } catch (err) {
      failGeneration(err?.message || 'Generation failed.')
      toast.error(err?.message || 'Generation failed. Please check your API key and try again.')
    }
  }

  const scrollToPrompt = () => {
    document.getElementById('prompt-input')?.focus()
  }

  return (
    <div className="flex flex-col items-center">
      <Hero onGetStarted={scrollToPrompt} />

      <div className="w-full flex flex-col items-center py-8 px-4 gap-8">
        <AnimatePresence mode="wait">
          {isGenerating ? (
            <motion.div
              key="progress"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-3xl flex justify-center"
            >
              <GenerationProgress stage={stage} stageIndex={stageIndex} totalStages={totalStages} />
            </motion.div>
          ) : (
            <motion.div
              key="input"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full flex flex-col items-center gap-6"
            >
              <PromptInput
                onGenerate={handleGenerate}
                isGenerating={isGenerating}
                value={prompt}
                onChange={setPrompt}
              />
              
              <div className="w-full max-w-3xl px-4 grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                {/* User Dashboard / Account Info Column */}
                {user && (
                  <div className="glass-strong rounded-2xl p-4 border border-white/6 flex flex-col justify-between h-full bg-surface-2 shadow-lg">
                    <div>
                      <div className="flex items-center gap-2 border-b border-white/5 pb-2 mb-3">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-8 h-8 rounded-full border border-white/10"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-brand-500/20 text-brand-300 flex items-center justify-center text-xs font-bold font-sans">
                            {user.name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-100 truncate">{user.name}</div>
                          <div className="text-[9px] text-slate-500 truncate">{user.email}</div>
                        </div>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Plan Tier:</span>
                          <span className="text-brand-300 font-bold uppercase text-[9px] bg-brand-500/10 px-1.5 py-0.5 rounded border border-brand-500/20">
                            {user.subscriptionTier || 'Free'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Workspaces:</span>
                          <span className="text-slate-350 font-mono font-semibold">{user.projectCount || 0} / 5</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Storage Size:</span>
                          <span className="text-slate-350 font-mono font-semibold">{((user.projectCount || 0) * 12.4).toFixed(1)} MB</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/5">
                      <button
                        onClick={() => toast.info('Billing and upgrade systems will be available in the upcoming Pro tier.')}
                        className="w-full text-center py-1.5 bg-gradient-to-r from-brand-500 to-violet-500 hover:from-brand-650 hover:to-violet-650 text-[10px] font-bold text-white rounded-lg transition-colors cursor-pointer"
                      >
                        Upgrade Plan
                      </button>
                    </div>
                  </div>
                )}

                {/* Recent Projects Column (Spans 2 columns) */}
                <div className="md:col-span-2 flex flex-col gap-2">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Resume Recent Work</h4>
                  {recentProjects.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {recentProjects.map(proj => (
                        <div
                          key={proj.projectId}
                          onClick={() => {
                            setCurrentProject(proj)
                            navigate(`/workspace/${proj.projectId}`)
                          }}
                          className="glass hover:bg-white/4 rounded-xl p-3 border border-white/6 hover:border-brand-500/20 cursor-pointer transition-all duration-200 flex flex-col justify-between h-[90px]"
                        >
                          <div>
                            <div className="text-xs font-bold text-slate-200 truncate">{proj.name}</div>
                            <div className="text-[10px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">{proj.prompt}</div>
                          </div>
                          <div className="text-[9px] text-slate-600 mt-2 font-mono">
                            {new Date(proj.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 border border-dashed border-white/5 rounded-xl text-center min-h-[90px]">
                      <div className="text-xs text-slate-650 font-medium">No workspaces generated yet</div>
                      <button
                        onClick={scrollToPrompt}
                        className="text-[10px] text-brand-400 hover:underline mt-1 font-sans"
                      >
                        Write your first prompt above
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <ExamplePrompts onSelect={(p) => { setPrompt(p) }} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Features />
      <HowItWorks />
      <Footer />
    </div>
  )
}
