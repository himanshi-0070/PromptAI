import { useState, useEffect } from 'react'
import { Copy, Check, WrapText, X, FileCode2, Loader2, Search, Download, Lock } from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { workspaceService } from '@/services/workspace.service'
import { useProject } from '@/context/ProjectContext'
import { gitService } from '@/services/git.service'
import { toast } from 'sonner'

function FileTabs({ tabs, activeFile, onSelect, onClose }) {
  if (!tabs.length) return null
  return (
    <div className="flex items-center overflow-x-auto border-b border-white/6 bg-surface-2 h-9 shrink-0">
      {tabs.map(tab => (
        <div
          key={tab.path}
          className={`group flex items-center gap-2 px-3 h-full border-r border-white/6 text-xs cursor-pointer shrink-0 transition-colors ${
            activeFile?.path === tab.path
              ? 'bg-surface-3 text-slate-200 border-t-2 border-t-brand-500'
              : 'text-slate-500 hover:text-slate-300 hover:bg-white/4'
          }`}
          onClick={() => onSelect(tab)}
        >
          <span className="max-w-[120px] truncate">{tab.name}</span>
          <button
            onClick={e => { e.stopPropagation(); onClose(tab.path) }}
            className="opacity-0 group-hover:opacity-100 hover:text-slate-200 ml-1 transition-opacity cursor-pointer"
          >
            <X size={10} />
          </button>
        </div>
      ))}
    </div>
  )
}

export default function EditorPanel() {
  const { selectedFile, openFile, openTabs, closeTab, currentProject, triggerFileTreeRefresh } = useProject()
  const [content, setContent] = useState('')
  const [language, setLanguage] = useState('plaintext')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [wordWrap, setWordWrap] = useState(false)

  // In-file search states
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [currentSearchIndex, setCurrentSearchIndex] = useState(-1)

  useEffect(() => {
    if (!selectedFile?.path) { setContent(''); return }
    const pathParts = window.location.pathname.split('/')
    const projectId = pathParts[pathParts.indexOf('workspace') + 1]
    if (!projectId) return

    setLoading(true)
    workspaceService.getFileContent(projectId, selectedFile.path)
      .then(data => {
        setContent(data.content)
        setLanguage(data.language || selectedFile.language || 'plaintext')
        // Reset search states on file change
        setSearchQuery('')
        setShowSearch(false)
      })
      .catch(() => setContent('// Failed to load file content.'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFile?.path])

  const handleManualSaveCommit = async () => {
    if (!currentProject) return
    try {
      toast.info('Saving file state to local Git repository...')
      await gitService.commitChanges(currentProject.projectId, 'Manual save checkpoint')
      toast.success('Changes committed successfully!')
      triggerFileTreeRefresh()
    } catch (err) {
      console.error('Manual save failed:', err)
      toast.error('No changes to commit or save failed.')
    }
  }

  const handleDownloadFile = () => {
    if (!content) return
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = selectedFile.path.split('/').pop() || 'file'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Downloaded file locally.')
  }

  // Setup Ctrl+F, Ctrl+S, Ctrl+/ keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault()
        setShowSearch(prev => !prev)
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        handleManualSaveCommit()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault()
        setWordWrap(prev => !prev)
        toast.info('Word wrap toggled.')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProject, wordWrap])

  // Calculate search matching lines
  useEffect(() => {
    if (!searchQuery.trim() || !content) {
      setSearchResults([])
      setCurrentSearchIndex(-1)
      return
    }

    const query = searchQuery.toLowerCase()
    const lines = content.split('\n')
    const matches = []
    lines.forEach((line, idx) => {
      if (line.toLowerCase().includes(query)) {
        matches.push(idx + 1)
      }
    })
    setSearchResults(matches)
    setCurrentSearchIndex(matches.length > 0 ? 0 : -1)

    // Auto scroll to first match
    if (matches.length > 0) {
      scrollToLine(matches[0])
    }
  }, [searchQuery, content])

  const scrollToLine = (lineNum) => {
    const el = document.getElementById(`L-${lineNum}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  const handlePrevMatch = () => {
    if (searchResults.length === 0) return
    setCurrentSearchIndex(prev => {
      const next = prev <= 0 ? searchResults.length - 1 : prev - 1
      scrollToLine(searchResults[next])
      return next
    })
  }

  const handleNextMatch = () => {
    if (searchResults.length === 0) return
    setCurrentSearchIndex(prev => {
      const next = prev >= searchResults.length - 1 ? 0 : prev + 1
      scrollToLine(searchResults[next])
      return next
    })
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(content)
    setCopied(true)
    toast.success('Copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  if (!selectedFile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-650 bg-surface-1">
        <div className="w-16 h-16 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-400 glow-brand-sm mb-4">
          <FileCode2 size={28} />
        </div>
        <h3 className="text-slate-350 font-bold mb-1 text-sm">No Active File</h3>
        <p className="text-xs text-slate-550 max-w-xs leading-relaxed mb-6">
          Select a file from the explorer on the left to read its contents or request iterative updates in the chat.
        </p>
        <div className="glass rounded-xl p-3 w-64 text-left space-y-2 border-white/4">
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Keyboard Shortcuts</div>
          <div className="flex items-center justify-between text-xs gap-4">
            <span className="text-slate-500">Toggle Explorer</span>
            <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/8 rounded font-mono text-[10px] text-slate-400">Ctrl + \</kbd>
          </div>
          <div className="flex items-center justify-between text-xs gap-4">
            <span className="text-slate-500">Find in Code</span>
            <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/8 rounded font-mono text-[10px] text-slate-400">Ctrl + F</kbd>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-surface-0">
      <FileTabs tabs={openTabs} activeFile={selectedFile} onSelect={openFile} onClose={closeTab} />

      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-1.5 border-b border-white/6 bg-surface-2 shrink-0 select-none">
        <div className="flex items-center gap-2 truncate mr-2">
          <span className="text-xs text-slate-500 font-mono truncate">{selectedFile.path}</span>
          <span className="hidden sm:inline-flex items-center gap-1 text-[9px] bg-slate-800 text-slate-450 font-semibold px-1.5 py-0.5 rounded border border-white/5 uppercase tracking-wider scale-90 shrink-0">
            <Lock size={9} /> Read-only
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setShowSearch(s => !s)}
            className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${showSearch ? 'text-brand-400 bg-brand-500/10' : 'text-slate-500 hover:text-slate-300'}`}
            title="Search inside file (Ctrl + F)"
          >
            <Search size={13} />
          </button>
          <button
            onClick={() => setWordWrap(w => !w)}
            className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${wordWrap ? 'text-brand-400 bg-brand-500/10' : 'text-slate-500 hover:text-slate-300'}`}
            title="Toggle word wrap (Ctrl + /)"
          >
            <WrapText size={13} />
          </button>
          <button
            onClick={handleDownloadFile}
            className="p-1.5 rounded text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors cursor-pointer"
            title="Download file"
          >
            <Download size={13} />
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors cursor-pointer"
          >
            {copied ? <Check size={13} className="text-emerald-450" /> : <Copy size={13} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Code Search Drawer */}
      {showSearch && (
        <div className="flex items-center justify-between gap-3 px-4 py-1.5 border-b border-white/6 bg-surface-3 shrink-0">
          <div className="flex items-center gap-2 flex-1">
            <Search size={12} className="text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search in file..."
              className="bg-transparent text-xs text-slate-300 outline-none flex-1 max-w-sm"
              autoFocus
            />
            {searchResults.length > 0 && (
              <span className="text-[10px] text-slate-500 font-mono">
                {currentSearchIndex + 1} of {searchResults.length} matches
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrevMatch}
              disabled={searchResults.length === 0}
              className="px-2 py-0.5 rounded text-[10px] text-slate-400 hover:text-slate-200 hover:bg-white/5 disabled:opacity-30 cursor-pointer"
            >
              Previous
            </button>
            <button
              onClick={handleNextMatch}
              disabled={searchResults.length === 0}
              className="px-2 py-0.5 rounded text-[10px] text-slate-400 hover:text-slate-200 hover:bg-white/5 disabled:opacity-30 cursor-pointer"
            >
              Next
            </button>
            <button
              onClick={() => { setShowSearch(false); setSearchQuery('') }}
              className="p-1 rounded text-slate-500 hover:text-slate-350 cursor-pointer"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      )}

      {/* Code View */}
      <div className="flex-1 overflow-auto code-viewer">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 size={20} className="animate-spin text-slate-500" />
          </div>
        ) : (
          <SyntaxHighlighter
            language={language}
            style={vscDarkPlus}
            showLineNumbers
            wrapLines={wordWrap}
            wrapLongLines={wordWrap}
            lineProps={lineNumber => {
              const isCurrentSearchLine = searchResults[currentSearchIndex] === lineNumber
              return {
                id: `L-${lineNumber}`,
                style: { 
                  display: 'block',
                  backgroundColor: isCurrentSearchLine ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
                  transition: 'background-color 0.25s ease'
                }
              }
            }}
            customStyle={{
              margin: 0,
              padding: '16px',
              background: 'transparent',
              fontSize: '13px',
              lineHeight: '1.6',
              minHeight: '100%',
            }}
            lineNumberStyle={{ color: '#3f4451', minWidth: '2.5em' }}
          >
            {content}
          </SyntaxHighlighter>
        )}
      </div>
    </div>
  )
}
