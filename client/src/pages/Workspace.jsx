import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Download, ChevronLeft, Menu, AlertTriangle, GitCommit, GitBranch, X, Check, Trash } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import Sidebar from '@/components/workspace/Sidebar'
import EditorPanel from '@/components/editor/EditorPanel'
import PreviewPanel from '@/components/preview/PreviewPanel'
import ChatPanel from '@/components/chat/ChatPanel'
import { useProject } from '@/context/ProjectContext'
import { projectService } from '@/services/project.service'
import { gitService } from '@/services/git.service'

export default function Workspace() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const {
    currentProject,
    setCurrentProject,
    generationSummary,
    setGenerationSummary,
    fileTreeTrigger,
    triggerFileTreeRefresh,
    gitStatus,
    setGitStatus
  } = useProject()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Git Drawer states
  const [showGitDrawer, setShowGitDrawer] = useState(false)
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false)
  const [gitDiff, setGitDiff] = useState('')
  const [commitMessage, setCommitMessage] = useState('')
  const [commitLoading, setCommitLoading] = useState(false)
  const [rollbackTarget, setRollbackTarget] = useState(null)
  const [rollbackLoading, setRollbackLoading] = useState(false)

  // Resizable panel states
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(`pw_sidebar_${projectId}`)
    return saved ? parseInt(saved, 10) : 260
  })
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem(`pc_sidebar_${projectId}`) === 'true'
  })
  const [chatHeight, setChatHeight] = useState(() => {
    const saved = localStorage.getItem(`ph_chat_${projectId}`)
    return saved ? parseInt(saved, 10) : 280
  })
  const [previewWidth, setPreviewWidth] = useState(() => {
    const saved = localStorage.getItem(`pw_preview_${projectId}`)
    return saved ? parseInt(saved, 10) : 320
  })
  const [showPreview, setShowPreview] = useState(() => {
    return localStorage.getItem(`pc_preview_${projectId}`) !== 'false'
  })

  // Fetch project record
  useEffect(() => {
    if (!currentProject || currentProject.projectId !== projectId) {
      setLoading(true)
      projectService.getProject(projectId)
        .then(p => { setCurrentProject(p); setLoading(false) })
        .catch(() => { setError('Project not found.'); setLoading(false) })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  // Fetch Git status
  const loadGitStatus = async () => {
    try {
      const status = await gitService.getStatus(projectId)
      setGitStatus(status)

      // If workspace is dirty, fetch active uncommitted diff
      if (!status.clean) {
        const diffData = await gitService.getDiff(projectId)
        setGitDiff(diffData)
      } else {
        setGitDiff('')
      }
    } catch (err) {
      console.error('Failed to load Git status:', err)
    }
  }

  useEffect(() => {
    if (projectId) {
      loadGitStatus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, fileTreeTrigger])

  // Keyboard shortcut listener (Ctrl + \)
  useEffect(() => {
    const handleShortcut = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
        e.preventDefault()
        toggleSidebar()
      }
    }
    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDownload = () => {
    toast.info('Preparing download zip archive...')
    window.open(`/api/v1/download/${projectId}`, '_blank')
  }

  const toggleSidebar = () => {
    setSidebarCollapsed(s => {
      const next = !s
      localStorage.setItem(`pc_sidebar_${projectId}`, next)
      return next
    })
  }

  const togglePreview = () => {
    setShowPreview(p => {
      const next = !p
      localStorage.setItem(`pc_preview_${projectId}`, next)
      return next
    })
  }

  // Handle manual commits
  const handleCommitManual = async (e) => {
    e.preventDefault()
    if (!commitMessage.trim()) return
    try {
      setCommitLoading(true)
      await gitService.commitChanges(projectId, commitMessage.trim())
      setCommitMessage('')
      toast.success('Workspace changes committed successfully.')
      triggerFileTreeRefresh()
      // Reload project schema details to sync versions history list
      const p = await projectService.getProject(projectId)
      setCurrentProject(p)
    } catch (err) {
      toast.error(err.message || 'Failed to commit changes.')
    } finally {
      setCommitLoading(false)
    }
  }

  // Handle manual discards
  const handleDiscardChanges = async () => {
    const confirmDiscard = window.confirm('WARNING: Are you absolutely sure you want to discard all uncommitted manual changes in the workspace? This cannot be undone.')
    if (!confirmDiscard) return
    try {
      await gitService.discardChanges(projectId)
      toast.success('All uncommitted changes discarded successfully.')
      triggerFileTreeRefresh()
      // Force preview panel reload
      window.dispatchEvent(new Event('refresh_preview'))
    } catch (err) {
      console.error('Discard changes failed:', err)
      toast.error('Failed to discard changes.')
    }
  }

  // Handle Rollback executions
  const handleRollbackConfirm = async () => {
    if (!rollbackTarget) return
    try {
      setRollbackLoading(true)
      toast.info(`Rolling back project files to commit ${rollbackTarget.commitHash.slice(0, 7)}...`)
      await gitService.rollback(projectId, rollbackTarget.commitHash)
      
      toast.success('Project rolled back successfully.')
      setRollbackTarget(null)
      triggerFileTreeRefresh()
      
      // Sync DB records
      const p = await projectService.getProject(projectId)
      setCurrentProject(p)
      
      // Force preview panel reload
      window.dispatchEvent(new Event('refresh_preview'))
    } catch (err) {
      console.error('Rollback execution failed:', err)
      toast.error('Rollback failed. Please try again.')
    } finally {
      setRollbackLoading(false)
    }
  }

  const handleSidebarDrag = (e) => {
    e.preventDefault()
    const startX = e.clientX
    const startWidth = sidebarWidth
    const onMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX
      const nextWidth = Math.max(180, Math.min(450, startWidth + deltaX))
      setSidebarWidth(nextWidth)
      localStorage.setItem(`pw_sidebar_${projectId}`, nextWidth)
    }
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  const handlePreviewDrag = (e) => {
    e.preventDefault()
    const startX = e.clientX
    const startWidth = previewWidth
    const onMouseMove = (moveEvent) => {
      const deltaX = startX - moveEvent.clientX
      const nextWidth = Math.max(200, Math.min(600, startWidth + deltaX))
      setPreviewWidth(nextWidth)
      localStorage.setItem(`pw_preview_${projectId}`, nextWidth)
    }
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  const handleChatDrag = (e) => {
    e.preventDefault()
    const startY = e.clientY
    const startHeight = chatHeight
    const onMouseMove = (moveEvent) => {
      const deltaY = startY - moveEvent.clientY
      const nextHeight = Math.max(150, Math.min(500, startHeight + deltaY))
      setChatHeight(nextHeight)
      localStorage.setItem(`ph_chat_${projectId}`, nextHeight)
    }
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-[calc(100vh-64px)]">
      <div className="w-6 h-6 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
    </div>
  )

  if (error) return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] text-slate-500">
      <AlertTriangle size={36} className="mb-3 text-red-400/50" />
      <p className="text-slate-300 font-medium mb-1">{error}</p>
      <button onClick={() => navigate('/')} className="mt-4 text-sm text-brand-400 hover:underline flex items-center gap-1">
        <ChevronLeft size={14} /> Back to Home
      </button>
    </div>
  )

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col overflow-hidden bg-surface-0 relative">
      {/* Workspace Topbar */}
      <div className="h-10 border-b border-white/6 bg-surface-2 flex items-center px-3 gap-3 shrink-0 select-none">
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded text-slate-500 hover:text-slate-350 hover:bg-white/5 transition-colors cursor-pointer"
        >
          <Menu size={14} />
        </button>

        <div className="h-4 w-px bg-white/8" />

        <span className="text-xs text-slate-400 font-semibold truncate">
          {currentProject?.name || projectId}
        </span>

        {/* Git Toolbar Badges */}
        {gitStatus && (
          <div className="flex items-center gap-1.5 ml-2 font-sans text-[10px]">
            <span className="text-slate-700">|</span>
            
            {/* Branch name */}
            <div className="flex items-center gap-1 text-slate-500 bg-white/4 px-1.5 py-0.5 rounded border border-white/5 font-mono">
              <GitBranch size={10} className="text-slate-500" />
              <span>{gitStatus.branch || 'main'}</span>
            </div>

            {/* Dirty indicators */}
            <button
              onClick={() => {
                setShowGitDrawer(!showGitDrawer)
                setShowHistoryDrawer(false)
              }}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                gitStatus.clean
                  ? 'bg-emerald-500/5 text-emerald-450 border-emerald-500/10 hover:bg-emerald-500/10'
                  : 'bg-yellow-500/5 text-yellow-450 border-yellow-500/10 hover:bg-yellow-500/10 animate-pulse'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${gitStatus.clean ? 'bg-emerald-400' : 'bg-yellow-400'}`} />
              <span>{gitStatus.clean ? 'Clean' : 'Workspace Dirty'}</span>
            </button>

            {/* Commit total versions count */}
            <button
              onClick={() => {
                setShowHistoryDrawer(!showHistoryDrawer)
                setShowGitDrawer(false)
              }}
              className="flex items-center gap-1 bg-white/4 text-slate-400 border border-white/5 px-1.5 py-0.5 rounded hover:bg-white/6 transition-colors cursor-pointer"
            >
              <GitCommit size={10} className="text-slate-500" />
              <span>{currentProject?.versions?.length || 1} commits</span>
            </button>
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={togglePreview}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              showPreview ? 'bg-white/10 text-slate-300 hover:bg-white/15' : 'bg-brand-500/20 text-brand-300 hover:bg-brand-500/30'
            }`}
          >
            <span className="mr-1 text-[11px]">🖥️</span>
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </motion.button>
          
          <button
            onClick={handleDownload}
            className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors cursor-pointer"
            title="Download Project ZIP"
          >
            <Download size={14} />
          </button>
        </div>
      </div>

      {/* Main Workspace Workspace Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Left: Sidebar */}
        <div style={{ width: sidebarCollapsed ? 0 : `${sidebarWidth}px`, transition: 'width 0.15s ease-out' }} className="shrink-0 flex overflow-hidden">
          <Sidebar
            projectId={projectId}
            collapsed={sidebarCollapsed}
            onToggle={toggleSidebar}
          />
        </div>

        {/* Sidebar Splitter Handle */}
        {!sidebarCollapsed && (
          <div
            onMouseDown={handleSidebarDrag}
            className="w-1 hover:w-1.5 bg-white/5 hover:bg-brand-500/40 cursor-col-resize transition-all self-stretch z-30 shrink-0"
          />
        )}

        {/* Center + Bottom: Editor + Chat */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Editor + Preview Area */}
          <div className="flex-1 flex overflow-hidden">
            <EditorPanel />

            {/* Preview Splitter Handle */}
            {showPreview && (
              <div
                onMouseDown={handlePreviewDrag}
                className="w-1 hover:w-1.5 bg-white/5 hover:bg-brand-500/40 cursor-col-resize transition-all self-stretch z-30 shrink-0"
              />
            )}

            {/* Right: Preview */}
            <div style={{ width: showPreview ? `${previewWidth}px` : 0, transition: 'width 0.15s ease-out' }} className="shrink-0 flex overflow-hidden">
              <PreviewPanel project={currentProject} />
            </div>
          </div>

          {/* Horizontal Splitter Handle for Chat */}
          <div
            onMouseDown={handleChatDrag}
            className="h-1 hover:h-1.5 bg-white/5 hover:bg-brand-500/40 cursor-row-resize transition-all w-full z-30 shrink-0"
          />

          {/* Bottom: Chat */}
          <div style={{ height: `${chatHeight}px` }} className="shrink-0 flex overflow-hidden">
            <ChatPanel projectId={projectId} />
          </div>
        </div>

        {/* ── Slide Over drawers ────────────────────────────────────────────── */}

        {/* 1. Git Changes Drawer */}
        <AnimatePresence>
          {showGitDrawer && gitStatus && (
            <>
              {/* Backdrop */}
              <div className="absolute inset-0 bg-slate-950/40 z-30 backdrop-blur-[1px]" onClick={() => setShowGitDrawer(false)} />
              
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="absolute right-0 top-0 bottom-0 w-80 bg-surface-2 border-l border-white/6 z-40 flex flex-col shadow-2xl"
              >
                <div className="p-4 border-b border-white/6 flex items-center justify-between bg-surface-3 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                    <span className="text-xs font-bold text-slate-200">Git Workspace Changes</span>
                  </div>
                  <button onClick={() => setShowGitDrawer(false)} className="text-slate-500 hover:text-slate-300">
                    <X size={14} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                  {gitStatus.clean ? (
                    <div className="text-center py-8 text-slate-550 flex flex-col items-center gap-2">
                      <Check size={24} className="text-emerald-500/60" />
                      <p className="font-semibold">Workspace is clean</p>
                      <p className="text-[10px]">No uncommitted changes detected.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Action buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={handleDiscardChanges}
                          className="flex-1 py-1.5 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 font-bold rounded-lg cursor-pointer transition-colors flex items-center justify-center gap-1"
                        >
                          <Trash size={11} /> Discard All
                        </button>
                      </div>

                      {/* Files modification list */}
                      <div className="space-y-2">
                        <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Changed Files</div>
                        <div className="space-y-1 font-mono text-[11px] max-h-40 overflow-y-auto pr-1">
                          {gitStatus.modified.map(f => (
                            <div key={f} className="flex justify-between items-center bg-white/3 p-1 rounded px-2">
                              <span className="text-slate-300 truncate mr-2">{f}</span>
                              <span className="text-[8px] bg-yellow-500/15 text-yellow-450 px-1 rounded uppercase tracking-wider scale-90">mod</span>
                            </div>
                          ))}
                          {gitStatus.added.map(f => (
                            <div key={f} className="flex justify-between items-center bg-white/3 p-1 rounded px-2">
                              <span className="text-slate-300 truncate mr-2">{f}</span>
                              <span className="text-[8px] bg-emerald-500/15 text-emerald-450 px-1 rounded uppercase tracking-wider scale-90">add</span>
                            </div>
                          ))}
                          {gitStatus.deleted.map(f => (
                            <div key={f} className="flex justify-between items-center bg-white/3 p-1 rounded px-2">
                              <span className="text-slate-300 truncate mr-2">{f}</span>
                              <span className="text-[8px] bg-red-500/15 text-red-400 px-1 rounded uppercase tracking-wider scale-90">del</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Commit manual form */}
                      <form onSubmit={handleCommitManual} className="space-y-2.5 pt-3 border-t border-white/5">
                        <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Commit Message</div>
                        <textarea
                          value={commitMessage}
                          onChange={e => setCommitMessage(e.target.value)}
                          required
                          placeholder="Describe your manual changes..."
                          className="w-full bg-slate-950 border border-white/6 rounded-lg p-2 text-slate-200 outline-none resize-none h-16 text-xs"
                        />
                        <button
                          type="submit"
                          disabled={commitLoading || !commitMessage.trim()}
                          className="w-full py-2 bg-brand-500 hover:bg-brand-600 text-xs font-semibold text-white rounded-lg transition-colors cursor-pointer disabled:opacity-40"
                        >
                          {commitLoading ? 'Committing...' : 'Commit Changes'}
                        </button>
                      </form>

                      {/* Live Diff Preview */}
                      {gitDiff && (
                        <div className="space-y-2 pt-3 border-t border-white/5">
                          <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Diff Output</div>
                          <div className="bg-slate-950 border border-white/6 rounded-lg p-2.5 font-mono text-[9px] text-slate-400 max-h-48 overflow-auto whitespace-pre leading-relaxed">
                            {gitDiff}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* 2. Version / Git Commit History Drawer */}
        <AnimatePresence>
          {showHistoryDrawer && currentProject && (
            <>
              {/* Backdrop */}
              <div className="absolute inset-0 bg-slate-950/40 z-30 backdrop-blur-[1px]" onClick={() => setShowHistoryDrawer(false)} />
              
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="absolute right-0 top-0 bottom-0 w-80 bg-surface-2 border-l border-white/6 z-40 flex flex-col shadow-2xl"
              >
                <div className="p-4 border-b border-white/6 flex items-center justify-between bg-surface-3 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-200">Commit Versions History</span>
                  </div>
                  <button onClick={() => setShowHistoryDrawer(false)} className="text-slate-500 hover:text-slate-300">
                    <X size={14} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                  <div className="space-y-3 relative pl-3 border-l border-white/6 ml-2">
                    {/* Reverse order history */}
                    {[...(currentProject.versions || [])].reverse().map((ver, idx) => {
                      const isLatest = idx === 0
                      return (
                        <div key={ver.versionNumber} className="relative space-y-1 pb-4">
                          {/* Dot indicator */}
                          <div className={`absolute left-[-16px] top-1 w-2.5 h-2.5 rounded-full border border-surface-2 flex items-center justify-center ${
                            isLatest ? 'bg-brand-500 scale-110' : 'bg-slate-700'
                          }`} />
                          
                          <div className="flex items-center justify-between">
                            <span className={`font-semibold ${isLatest ? 'text-slate-100' : 'text-slate-400'}`}>
                              Commit v{ver.versionNumber}
                            </span>
                            <span className="text-[9px] text-slate-650 font-mono">
                              {ver.commitHash ? ver.commitHash.slice(0, 7) : 'N/A'}
                            </span>
                          </div>

                          <div className="text-[10px] text-slate-500 leading-tight">
                            {new Date(ver.timestamp).toLocaleString()}
                          </div>

                          <p className="text-slate-300 font-sans leading-relaxed text-[11px] bg-white/3 p-2 rounded border border-white/4">
                            {ver.summary || ver.prompt}
                          </p>

                          {/* Rollback action */}
                          {!isLatest && ver.commitHash && (
                            <button
                              onClick={() => setRollbackTarget(ver)}
                              className="text-[9px] text-brand-400 hover:text-brand-300 font-bold uppercase tracking-wider pt-1 hover:underline cursor-pointer"
                            >
                              Rollback to this version
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

      </div>

      {/* ── Rollback Confirmation Modal Overlay ─────────────────────────────── */}
      <AnimatePresence>
        {rollbackTarget && (
          <div className="fixed inset-0 bg-surface-0/85 backdrop-blur-sm z-55 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-strong border-red-500/20 max-w-sm w-full rounded-2xl p-6 shadow-2xl bg-surface-2 text-center flex flex-col items-center gap-3"
            >
              <div className="p-3 bg-red-500/10 text-red-400 rounded-full">
                <AlertTriangle size={24} />
              </div>
              
              <h3 className="text-sm font-bold text-slate-100">Confirm Project Rollback</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                You are about to restore all files in this workspace to commit <span className="font-mono text-slate-200 bg-white/5 px-1.5 py-0.5 rounded border border-white/6">{rollbackTarget.commitHash.slice(0, 7)}</span>. 
                <br />
                <span className="text-[10px] text-slate-500 font-medium">This will create a new commit, keeping your full version history history safely intact.</span>
              </p>

              <div className="flex gap-2.5 w-full mt-2 font-sans">
                <button
                  onClick={() => setRollbackTarget(null)}
                  disabled={rollbackLoading}
                  className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 rounded-xl cursor-pointer transition-colors border border-white/6"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRollbackConfirm}
                  disabled={rollbackLoading}
                  className="flex-1 py-2 bg-brand-500 hover:bg-brand-600 text-xs font-semibold text-white rounded-xl cursor-pointer transition-colors"
                >
                  {rollbackLoading ? 'Rolling back...' : 'Confirm Rollback'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Generation Summary Modal Overlay */}
      {generationSummary && (
        <div className="fixed inset-0 bg-surface-0/85 backdrop-blur-sm z-55 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-strong border-brand-500/20 max-w-xl w-full rounded-2xl p-6 shadow-2xl relative overflow-hidden max-h-[85vh] flex flex-col bg-surface-2"
          >
            <div className="flex items-center gap-3 pb-3 border-b border-white/6 mb-4 shrink-0">
              <div className="p-2 bg-emerald-500/10 rounded-full text-emerald-400">
                <span className="text-sm font-bold">✓</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">Generation Complete</h3>
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Workspace updated incrementally</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-4 text-xs">
              {/* Summary explanation */}
              {generationSummary.summary && (
                <div className="bg-white/4 rounded-xl p-3 border border-white/6">
                  <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">AI Execution Summary</div>
                  <p className="text-slate-300 leading-relaxed">{generationSummary.summary}</p>
                </div>
              )}

              {/* Diffs lists */}
              <div className="space-y-3">
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">File Modifications Summary</div>
                
                {generationSummary.diffs ? (
                  <div className="space-y-2">
                    {/* Added */}
                    {generationSummary.diffs.added?.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-[10px] text-emerald-450 font-bold">Created (+ {generationSummary.diffs.added.length})</div>
                        <div className="pl-3 border-l border-emerald-500/20 flex flex-col gap-0.5 font-mono text-[11px] text-slate-400">
                          {generationSummary.diffs.added.map(p => <span key={p}>+ {p}</span>)}
                        </div>
                      </div>
                    )}

                    {/* Modified */}
                    {generationSummary.diffs.modified?.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-[10px] text-brand-400 font-bold">Updated (~ {generationSummary.diffs.modified.length})</div>
                        <div className="pl-3 border-l border-brand-500/20 flex flex-col gap-0.5 font-mono text-[11px] text-slate-400">
                          {generationSummary.diffs.modified.map(p => <span key={p}>~ {p}</span>)}
                        </div>
                      </div>
                    )}

                    {/* Deleted */}
                    {generationSummary.diffs.deleted?.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-[10px] text-red-400 font-bold">Deleted (- {generationSummary.diffs.deleted.length})</div>
                        <div className="pl-3 border-l border-red-500/20 flex flex-col gap-0.5 font-mono text-[11px] text-slate-400">
                          {generationSummary.diffs.deleted.map(p => <span key={p}>- {p}</span>)}
                        </div>
                      </div>
                    )}

                    {/* Unchanged count */}
                    {generationSummary.diffs.unchanged?.length > 0 && (
                      <div className="text-[10px] text-slate-555">
                        {generationSummary.diffs.unchanged.length} unchanged files skipped
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-slate-400 font-mono">
                    Files written: {generationSummary.filesWritten}
                  </div>
                )}
              </div>

              {/* Review Warnings */}
              {generationSummary.reviewWarnings?.length > 0 && (
                <div className="bg-yellow-500/5 rounded-xl p-3 border border-yellow-500/15">
                  <div className="text-[10px] uppercase font-bold text-yellow-500/80 tracking-wider mb-1.5 flex items-center gap-1">
                    <span>⚠️</span> Code Review Pass Warnings
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-slate-405">
                    {generationSummary.reviewWarnings.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Timing */}
              {generationSummary.durationMs && (
                <div className="text-[10px] text-slate-500 font-mono">
                  Completed in {((generationSummary.durationMs) / 1000).toFixed(1)} seconds
                </div>
              )}
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-white/6 mt-4 shrink-0 font-sans">
              <button
                onClick={() => setGenerationSummary(null)}
                className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 rounded-xl text-xs font-semibold text-white cursor-pointer transition-colors"
              >
                Close & Explore
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
