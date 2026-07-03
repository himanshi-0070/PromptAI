import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Clock, Loader2, Trash2, ExternalLink, Inbox, Download, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { historyService } from '@/services/history.service'
import { projectService } from '@/services/project.service'
import { toast } from 'sonner'

function ProjectCard({ project, onDelete, onDownload }) {
  const navigate = useNavigate()
  
  // Format creation date
  const date = new Date(project.createdAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  })

  // Basic dependency badges
  const inferredTech = []
  const promptLower = project.prompt?.toLowerCase() || ''
  if (promptLower.includes('react') || promptLower.includes('front')) inferredTech.push('React')
  if (promptLower.includes('express') || promptLower.includes('api') || promptLower.includes('node')) inferredTech.push('Express')
  if (promptLower.includes('mongo') || promptLower.includes('db')) inferredTech.push('MongoDB')
  if (promptLower.includes('tailwind') || promptLower.includes('css')) inferredTech.push('Tailwind')
  
  if (inferredTech.length === 0) {
    inferredTech.push('FullStack')
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="glass hover:border-brand-500/20 rounded-2xl p-5 flex flex-col gap-3 group transition-all duration-200 hover:bg-white/4 relative overflow-hidden"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-100 truncate text-sm">{project.name}</h3>
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1 leading-relaxed">{project.prompt}</p>
        </div>
        <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
          project.status === 'complete' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
          project.status === 'failed' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
          'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
        }`}>
          {project.status}
        </span>
      </div>

      {project.description ? (
        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed flex-1">{project.description}</p>
      ) : (
        <div className="flex-1" />
      )}

      {/* Technology Badges */}
      <div className="flex flex-wrap gap-1 mb-1">
        {inferredTech.map(tech => (
          <span key={tech} className="px-1.5 py-0.5 bg-white/5 rounded text-[9px] text-slate-550 font-mono">
            {tech}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-white/4">
        <div className="flex items-center gap-1.5 text-xs text-slate-650">
          <Clock size={11} />
          {date}
        </div>
        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onDownload(project.projectId, project.name) }}
            className="p-1.5 rounded-lg text-slate-500 hover:text-brand-300 hover:bg-brand-500/10 transition-colors cursor-pointer"
            title="Download ZIP"
          >
            <Download size={13} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(project.projectId) }}
            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
            title="Delete Project"
          >
            <Trash2 size={13} />
          </button>
          <button
            onClick={() => navigate(`/workspace/${project.projectId}`)}
            className="flex items-center gap-1 px-2.5 py-1 bg-brand-500/20 hover:bg-brand-500/30 text-brand-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            <ExternalLink size={10} />
            Open
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default function HistoryGrid() {
  const [projects, setProjects] = useState([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('newest') // 'newest' | 'oldest' | 'alphabetical' | 'duration'
  
  // Custom Delete Confirmation Modal state
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)

  const fetchProjects = async () => {
    setLoading(true)
    try {
      const data = await historyService.getHistory({ page, limit: 12, search })
      setProjects(data.projects || [])
      setTotalPages(data.totalPages || 1)
    } catch {
      toast.error('Failed to load history projects.')
    } finally {
      setLoading(false)
    }
  }

  // Reload projects whenever page or search changes
  useEffect(() => {
    fetchProjects()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search])

  // Reset page index on search query updates
  const handleSearchChange = (e) => {
    setSearch(e.target.value)
    setPage(1)
  }

  const handleDeleteClick = (projectId) => {
    setDeleteConfirmId(projectId)
  }

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return
    try {
      await projectService.deleteProject(deleteConfirmId)
      toast.success('Project deleted and filesystem cleaned up.')
      setDeleteConfirmId(null)
      fetchProjects()
    } catch {
      toast.error('Failed to delete project.')
    }
  }

  const handleDownloadZip = (projectId, _name) => {
    toast.info('Preparing zip download...')
    window.open(`/api/v1/download/${projectId}`, '_blank')
  }

  // Client-side sorting logic
  const sortedProjects = [...projects].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.createdAt) - new Date(a.createdAt)
    } else if (sortBy === 'oldest') {
      return new Date(a.createdAt) - new Date(b.createdAt)
    } else if (sortBy === 'alphabetical') {
      return a.name.localeCompare(b.name)
    } else if (sortBy === 'duration') {
      return (a.generationDurationMs || 0) - (b.generationDurationMs || 0)
    }
    return 0
  })

  return (
    <div className="p-6">
      {/* Search & Sort Panel */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-8 max-w-4xl justify-between">
        <div className="flex-1 flex items-center gap-2 glass rounded-xl px-3 py-2">
          <Search size={14} className="text-slate-500 shrink-0" />
          <input
            value={search}
            onChange={handleSearchChange}
            placeholder="Search projects..."
            className="bg-transparent text-sm text-slate-200 placeholder-slate-650 outline-none flex-1"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-550 font-medium whitespace-nowrap">Sort by:</span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="bg-surface-2 border border-white/8 rounded-xl px-3 py-2 text-xs text-slate-300 outline-none cursor-pointer focus:border-brand-500/50"
          >
            <option value="newest">Newest Created</option>
            <option value="oldest">Oldest Created</option>
            <option value="alphabetical">Name A-Z</option>
            <option value="duration">Generation speed</option>
          </select>
        </div>
      </div>

      {/* Main Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={24} className="animate-spin text-slate-500" />
        </div>
      ) : sortedProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-600">
          <Inbox size={40} className="mb-4 opacity-30" />
          <p className="font-medium text-slate-400 mb-1">No projects found</p>
          <p className="text-sm">Generate a new project from the home page.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sortedProjects.map(p => (
              <ProjectCard
                key={p.projectId}
                project={p}
                onDelete={handleDeleteClick}
                onDownload={handleDownloadZip}
              />
            ))}
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-10 pt-6 border-t border-white/5">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="flex items-center gap-1 px-3 py-1.5 bg-white/5 hover:bg-white/8 text-xs text-slate-350 font-semibold rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronLeft size={13} />
                Previous
              </button>
              
              <span className="text-xs text-slate-500 font-mono">
                Page {page} of {totalPages}
              </span>

              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="flex items-center gap-1 px-3 py-1.5 bg-white/5 hover:bg-white/8 text-xs text-slate-350 font-semibold rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                Next
                <ChevronRight size={13} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Modal Overlay */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-surface-0/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-strong border-red-500/20 max-w-md w-full rounded-2xl p-6 shadow-2xl relative overflow-hidden"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-500/10 rounded-full text-red-400 shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-100 mb-2">Delete Project?</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  This action is irreversible. It will permanently delete this project entry from the database and recursively wipe out the generated workspace folders from the filesystem disk.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 hover:bg-white/5 rounded-xl text-xs font-semibold text-slate-400 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-550 hover:bg-red-650 rounded-xl text-xs font-semibold text-white cursor-pointer transition-colors"
              >
                Delete Permanently
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
