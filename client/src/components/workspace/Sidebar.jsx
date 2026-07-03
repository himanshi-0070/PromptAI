import { useState, useEffect } from 'react'
import { Search, ChevronLeft, ChevronRight, Loader2, FolderOpen, Clock, Star } from 'lucide-react'
import { workspaceService } from '@/services/workspace.service'
import { useProject } from '@/context/ProjectContext'
import FileTree from './FileTree'

export default function Sidebar({ projectId, collapsed, onToggle }) {
  const { currentProject, openFile, selectedFile, fileTreeTrigger } = useProject()
  const [tree, setTree] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeSidebarTab, setActiveSidebarTab] = useState('explorer') // 'explorer' | 'recent' | 'favorites'
  
  const [recents, setRecents] = useState([])
  const [favorites, setFavorites] = useState([])

  // Load tree files
  useEffect(() => {
    if (!projectId) return
    setLoading(true)
    workspaceService.getFileTree(projectId)
      .then(setTree)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [projectId, fileTreeTrigger])

  // Load recents & favorites
  const loadRecentsAndFavs = () => {
    if (!projectId) return
    try {
      const recentsSaved = localStorage.getItem(`recent_files_${projectId}`)
      setRecents(recentsSaved ? JSON.parse(recentsSaved) : [])

      const favSaved = localStorage.getItem(`fav_files_${projectId}`)
      setFavorites(favSaved ? JSON.parse(favSaved) : [])
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadRecentsAndFavs()
    
    // Listen for star updates from FileTree
    window.addEventListener('fav_updated', loadRecentsAndFavs)
    return () => window.removeEventListener('fav_updated', loadRecentsAndFavs)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, selectedFile]) // reload when selectedFile updates (opens recents)

  const filterTree = (nodes, q) => {
    if (!q) return nodes
    return nodes.reduce((acc, n) => {
      if (n.type === 'directory') {
        const filtered = filterTree(n.children, q)
        if (filtered.length) acc.push({ ...n, children: filtered })
      } else if (n.name.toLowerCase().includes(q.toLowerCase())) {
        acc.push(n)
      }
      return acc
    }, [])
  }

  const displayTree = filterTree(tree, search)
  const filteredRecents = recents.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))
  const filteredFavs = favorites.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className={`flex flex-col border-r border-white/6 bg-surface-1 h-full transition-all duration-300 ${
      collapsed ? 'w-0 overflow-hidden' : 'w-full'
    }`}>
      {/* Header */}
      <div className="p-3 border-b border-white/6 flex items-center justify-between shrink-0">
        <span className="text-xs font-semibold text-slate-300 truncate max-w-[140px]">
          {currentProject?.name || 'Explorer'}
        </span>
        <button onClick={onToggle} className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer">
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Tab selectors */}
      <div className="flex border-b border-white/6 bg-surface-2 p-1 gap-1 shrink-0">
        <button
          onClick={() => setActiveSidebarTab('explorer')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1 px-2 rounded text-xs font-medium cursor-pointer transition-colors ${
            activeSidebarTab === 'explorer' ? 'bg-white/5 text-brand-300' : 'text-slate-500 hover:text-slate-350 hover:bg-white/4'
          }`}
          title="File Explorer"
        >
          <FolderOpen size={13} />
          <span className="hidden sm:inline">Files</span>
        </button>
        <button
          onClick={() => setActiveSidebarTab('recent')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1 px-2 rounded text-xs font-medium cursor-pointer transition-colors ${
            activeSidebarTab === 'recent' ? 'bg-white/5 text-brand-300' : 'text-slate-500 hover:text-slate-350 hover:bg-white/4'
          }`}
          title="Recently Opened"
        >
          <Clock size={13} />
          <span className="hidden sm:inline">Recents</span>
        </button>
        <button
          onClick={() => setActiveSidebarTab('favorites')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1 px-2 rounded text-xs font-medium cursor-pointer transition-colors ${
            activeSidebarTab === 'favorites' ? 'bg-white/5 text-brand-300' : 'text-slate-500 hover:text-slate-350 hover:bg-white/4'
          }`}
          title="Favorites"
        >
          <Star size={13} />
          <span className="hidden sm:inline">Pinned</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="px-3 py-2 border-b border-white/6 bg-surface-1">
        <div className="flex items-center gap-2 bg-white/5 rounded-lg px-2.5 py-1.5">
          <Search size={12} className="text-slate-500 shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search files..."
            className="bg-transparent text-xs text-slate-300 placeholder-slate-600 outline-none flex-1"
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto bg-surface-1">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={16} className="animate-spin text-slate-500" />
          </div>
        ) : (
          <>
            {activeSidebarTab === 'explorer' && (
              <FileTree
                tree={displayTree}
                onFileClick={openFile}
                activeFile={selectedFile}
                projectId={projectId}
              />
            )}

            {activeSidebarTab === 'recent' && (
              <div className="py-2 px-1">
                {filteredRecents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-slate-600 text-center">
                    <Clock size={20} className="mb-2 opacity-35" />
                    <p className="text-xs">No recent files</p>
                  </div>
                ) : (
                  filteredRecents.map(file => (
                    <button
                      key={file.path}
                      onClick={() => openFile(file)}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs rounded transition-colors file-tree-item ${
                        selectedFile?.path === file.path ? 'bg-brand-500/10 text-brand-300 active' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Clock size={11} className="text-slate-500 shrink-0" />
                      <span className="truncate flex-1 font-mono">{file.path}</span>
                    </button>
                  ))
                )}
              </div>
            )}

            {activeSidebarTab === 'favorites' && (
              <div className="py-2 px-1">
                {filteredFavs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-slate-600 text-center">
                    <Star size={20} className="mb-2 opacity-35" />
                    <p className="text-xs">No favorites pinned</p>
                  </div>
                ) : (
                  filteredFavs.map(file => (
                    <button
                      key={file.path}
                      onClick={() => openFile(file)}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs rounded transition-colors file-tree-item ${
                        selectedFile?.path === file.path ? 'bg-brand-500/10 text-brand-300 active' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Star size={11} className="text-amber-400 shrink-0" fill="currentColor" />
                      <span className="truncate flex-1 font-mono">{file.path}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
