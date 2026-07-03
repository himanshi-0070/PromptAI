import { useState, useEffect } from 'react'
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, Star } from 'lucide-react'

const FILE_ICONS = {
  jsx: '⚛️', tsx: '⚛️', js: '📜', ts: '📘',
  json: '📋', css: '🎨', html: '🌐',
  md: '📝', env: '🔐', sh: '💻',
}

function getIcon(name) {
  const ext = name.split('.').pop()?.toLowerCase()
  return FILE_ICONS[ext] || null
}

function TreeNode({ node, depth = 0, onFileClick, activeFile, projectId }) {
  const [expanded, setExpanded] = useState(depth < 2)
  const isDir = node.type === 'directory'
  const isActive = !isDir && activeFile?.path === node.path
  const icon = !isDir ? getIcon(node.name) : null
  const favKey = `fav_files_${projectId}`

  const [isFav, setIsFav] = useState(false)

  // Sync favorite state
  const checkFav = () => {
    if (!projectId) return
    try {
      const saved = localStorage.getItem(favKey)
      const list = saved ? JSON.parse(saved) : []
      setIsFav(list.some(f => f.path === node.path))
    } catch {
      setIsFav(false)
    }
  }

  useEffect(() => {
    checkFav()
    const handleUpdate = () => checkFav()
    window.addEventListener('fav_updated', handleUpdate)
    return () => window.removeEventListener('fav_updated', handleUpdate)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node.path, projectId])

  const toggleFav = (e) => {
    e.stopPropagation()
    e.preventDefault()
    try {
      const saved = localStorage.getItem(favKey)
      let list = saved ? JSON.parse(saved) : []
      if (isFav) {
        list = list.filter(f => f.path !== node.path)
        setIsFav(false)
      } else {
        list.push({
          path: node.path,
          name: node.name,
          type: 'file',
          language: node.language || 'plaintext'
        })
        setIsFav(true)
      }
      localStorage.setItem(favKey, JSON.stringify(list))
      window.dispatchEvent(new CustomEvent('fav_updated'))
    } catch (err) {
      console.error(err)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      const items = Array.from(document.querySelectorAll('.file-tree-item'))
      const activeIdx = items.indexOf(document.activeElement)
      if (e.key === 'ArrowDown') {
        const next = items[activeIdx + 1] || items[0]
        next?.focus()
      } else {
        const prev = items[activeIdx - 1] || items[items.length - 1]
        prev?.focus()
      }
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (isDir) {
        setExpanded(e => !e)
      } else {
        onFileClick(node)
      }
    }
  }

  return (
    <div className="relative group/tree-item">
      <button
        onClick={() => isDir ? setExpanded(e => !e) : onFileClick(node)}
        onKeyDown={handleKeyDown}
        className={`w-full flex items-center gap-1.5 px-3 py-1.5 pr-8 text-left text-sm transition-all duration-150 file-tree-item outline-none focus-visible:bg-white/5 ${
          isActive ? 'active text-brand-300 font-medium bg-brand-500/10' : 'text-slate-400 hover:text-slate-200'
        }`}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
      >
        {isDir ? (
          <>
            <span className="text-slate-500 shrink-0">
              {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </span>
            <span className="shrink-0">
              {expanded ? <FolderOpen size={14} className="text-brand-400/70" /> : <Folder size={14} className="text-slate-500" />}
            </span>
          </>
        ) : (
          <>
            <span className="w-3 shrink-0" />
            {icon ? (
              <span className="text-xs shrink-0">{icon}</span>
            ) : (
              <File size={13} className="text-slate-500 shrink-0" />
            )}
          </>
        )}
        <span className="truncate flex-1">{node.name}</span>
      </button>

      {!isDir && (
        <button
          onClick={toggleFav}
          className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-white/10 transition-all cursor-pointer ${
            isFav ? 'text-amber-400 opacity-100' : 'text-slate-500 opacity-0 group-hover/tree-item:opacity-100'
          }`}
          title={isFav ? "Remove from Favorites" : "Add to Favorites"}
        >
          <Star size={11} fill={isFav ? "currentColor" : "none"} />
        </button>
      )}

      {isDir && expanded && node.children?.map(child => (
        <TreeNode
          key={child.path}
          node={child}
          depth={depth + 1}
          onFileClick={onFileClick}
          activeFile={activeFile}
          projectId={projectId}
        />
      ))}
    </div>
  )
}

export default function FileTree({ tree, onFileClick, activeFile, projectId }) {
  if (!tree?.length) {
    return <div className="px-4 py-3 text-xs text-slate-600">No files found.</div>
  }
  return (
    <div className="py-2">
      {tree.map(node => (
        <TreeNode
          key={node.path}
          node={node}
          onFileClick={onFileClick}
          activeFile={activeFile}
          projectId={projectId}
        />
      ))}
    </div>
  )
}
