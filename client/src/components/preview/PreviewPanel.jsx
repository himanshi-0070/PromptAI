import { useState, useEffect, useRef } from 'react'
import { Layers, Clock, Hash, Cpu, RefreshCw, Play, Info } from 'lucide-react'
import { workspaceService } from '@/services/workspace.service'
import { useProject } from '@/context/ProjectContext'

export default function PreviewPanel({ project }) {
  const [activeTab, setActiveTab] = useState('preview')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const { fileTreeTrigger } = useProject()
  const iframeRef = useRef(null)

  // Recursively flattens the file tree to find all files
  const flattenFiles = (nodes) => {
    let list = []
    if (!nodes) return list
    for (const node of nodes) {
      if (node.type === 'file') {
        list.push(node)
      } else if (node.type === 'directory' && node.children) {
        list.push(...flattenFiles(node.children))
      }
    }
    return list
  }

  const loadProjectFiles = async () => {
    if (!project?.projectId) return
    setLoading(true)
    setError(null)
    try {
      // 1. Get file tree
      const tree = await workspaceService.getFileTree(project.projectId)
      const allFiles = flattenFiles(tree)

      // 2. Filter files to load (frontend files)
      const frontendFiles = allFiles.filter(f => f.path.startsWith('frontend/'))

      if (frontendFiles.length === 0) {
        throw new Error('No frontend files found in this project.')
      }

      // 3. Load contents for each frontend file in chunks to avoid rate limiting
      const loaded = []
      const chunkSize = 5
      for (let i = 0; i < frontendFiles.length; i += chunkSize) {
        const chunk = frontendFiles.slice(i, i + chunkSize)
        const chunkPromises = chunk.map(async (file) => {
          const data = await workspaceService.getFileContent(project.projectId, file.path)
          return { path: file.path, content: data.content }
        })
        const results = await Promise.all(chunkPromises)
        loaded.push(...results)
      }

      // 4. Send files to iframe
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage({
          type: 'LOAD_PROJECT',
          files: loaded
        }, '*')
      }
    } catch (err) {
      setError(err.message || 'Failed to load preview files.')
    } finally {
      setLoading(false)
    }
  }

  // Load files when tab active, project changes, or refreshKey / fileTreeTrigger triggers
  useEffect(() => {
    if (activeTab === 'preview' && project?.projectId) {
      // Slight delay to ensure iframe is loaded and listening
      const timer = setTimeout(() => {
        loadProjectFiles()
      }, 500)
      return () => clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, project?.projectId, refreshKey, fileTreeTrigger])

  const handleRefresh = () => {
    setRefreshKey(k => k + 1)
  }

  if (!project) return null

  // Iframe template containing CDNs and runner logic
  const iframeSrcDoc = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <script src="https://cdn.tailwindcss.com"></script>
      <script src="https://cdn.jsdelivr.net/npm/react@18/umd/react.development.js" crossorigin="anonymous"></script>
      <script src="https://cdn.jsdelivr.net/npm/react-dom@18/umd/react-dom.development.js" crossorigin="anonymous"></script>
      <script src="https://cdn.jsdelivr.net/npm/react-router-dom@6.22.3/dist/umd/react-router-dom.production.min.js" crossorigin="anonymous"></script>
      <script>window.react = window.React;</script>
      <script src="https://cdn.jsdelivr.net/npm/lucide-react@0.359.0/dist/umd/lucide-react.min.js" crossorigin="anonymous"></script>
      <script src="https://cdn.jsdelivr.net/npm/axios@1.6.8/dist/axios.min.js" crossorigin="anonymous"></script>
      <script src="https://cdn.jsdelivr.net/npm/@babel/standalone@7.24.0/babel.min.js" crossorigin="anonymous"></script>
      <style>
        body {
          background-color: #0c0d12;
          color: #f1f5f9;
          font-family: system-ui, -apple-system, sans-serif;
          margin: 0;
          padding: 16px;
        }
        #error-overlay {
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 12px;
          padding: 20px;
          color: #f87171;
          font-family: ui-monospace, monospace;
          font-size: 13px;
          white-space: pre-wrap;
          margin: 16px;
        }
      </style>
    </head>
    <body>
      <div id="root"></div>
      <div id="error-display" style="display:none;"></div>
      
      <script>
        window.addEventListener('message', (e) => {
          if (e.data && e.data.type === 'LOAD_PROJECT') {
            runProject(e.data.files);
          }
        });

        const modules = {};
        const moduleCache = {};

        function runProject(files) {
          const errorDisplay = document.getElementById('error-display');
          const rootDiv = document.getElementById('root');
          errorDisplay.style.display = 'none';
          errorDisplay.innerHTML = '';
          rootDiv.innerHTML = '';

          try {
            // Step 1: Pre-process CSS files
            const cssFiles = files.filter(f => f.path.endsWith('.css'));
            cssFiles.forEach(css => {
              const style = document.createElement('style');
              style.innerHTML = css.content;
              document.head.appendChild(style);
            });

            // Step 2: Register UMD mock modules
            modules['react'] = () => window.React;
            modules['react-dom'] = () => window.ReactDOM;
            modules['react-dom/client'] = () => ({
              createRoot: (el) => window.ReactDOM.createRoot(el)
            });
            modules['react-router-dom'] = () => window.ReactRouterDOM;
            modules['lucide-react'] = () => window.LucideReact || {};
            modules['axios'] = () => window.Axios;
            
            // Mock Framer Motion
            modules['framer-motion'] = () => {
              const mockMotion = {};
              const tags = ['div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'button', 'a', 'section', 'article', 'nav', 'header', 'footer', 'img', 'svg', 'path'];
              tags.forEach(tag => {
                mockMotion[tag] = window.React.forwardRef((props, ref) => {
                  const { animate, initial, exit, transition, whileHover, whileTap, variants, ...cleanProps } = props;
                  return window.React.createElement(tag, { ...cleanProps, ref });
                });
              });
              return { motion: mockMotion, AnimatePresence: ({ children }) => children };
            };

            // Step 3: Register all code files
            files.forEach(file => {
              const normalizedPath = file.path.replace(/^frontend\\//, '').replace(/^src\\//, '');
              
              if (file.path.endsWith('.js') || file.path.endsWith('.jsx')) {
                try {
                  const compiled = Babel.transform(file.content, {
                    presets: ['react', ['env', { modules: 'commonjs' }]]
                  }).code;

                  modules[normalizedPath] = (exports, require, module) => {
                    const fn = new Function('exports', 'require', 'module', compiled);
                    fn(exports, require, module);
                  };
                } catch (err) {
                  throw new Error('Compilation error in ' + file.path + ':\\n' + err.message);
                }
              } else if (file.path.endsWith('.json')) {
                modules[normalizedPath] = (exports) => {
                  Object.assign(exports, JSON.parse(file.content));
                };
              }
            });

            // Step 4: Define custom require and path resolver
            function require(modulePath, currentFile = 'main.jsx') {
              if (modules[modulePath] && !modulePath.startsWith('.')) {
                return modules[modulePath]();
              }

              // Resolve path
              let resolved = modulePath.replace(/^@\\//, '');
              if (resolved.startsWith('.')) {
                const currentDir = currentFile.includes('/') ? currentFile.substring(0, currentFile.lastIndexOf('/')) : '';
                const combined = currentDir ? currentDir + '/' + resolved : resolved;
                
                const parts = combined.split('/');
                const stack = [];
                for (const part of parts) {
                  if (part === '.' || part === '') continue;
                  if (part === '..') stack.pop();
                  else stack.push(part);
                }
                resolved = stack.join('/');
              }

              const candidates = [
                resolved,
                resolved + '.jsx',
                resolved + '.js',
                resolved + '.json',
                resolved + '/index.jsx',
                resolved + '/index.js'
              ];

              let foundPath = null;
              for (const c of candidates) {
                if (modules[c]) { foundPath = c; break; }
              }

              if (!foundPath) {
                console.warn('Could not resolve import: ' + modulePath + ' (tried: ' + candidates.join(', ') + ')');
                return {};
              }

              if (moduleCache[foundPath]) {
                return moduleCache[foundPath].exports;
              }

              const module = { exports: {} };
              moduleCache[foundPath] = module;
              
              const customRequire = (p) => require(p, foundPath);
              modules[foundPath](module.exports, customRequire, module);

              return module.exports;
            }

            // Step 5: Execute entry point
            const entryCandidates = ['main.jsx', 'index.js', 'src/main.jsx', 'src/index.js'];
            let entryPath = null;
            for (const ec of entryCandidates) {
              if (modules[ec]) { entryPath = ec; break; }
            }

            if (entryPath) {
              require('./' + entryPath);
            } else {
              throw new Error('Entrypoint (main.jsx or index.js) not found in workspace.');
            }

          } catch (err) {
            showError(err.message);
          }
        }

        function showError(msg) {
          const errorDisplay = document.getElementById('error-display');
          errorDisplay.style.display = 'block';
          errorDisplay.innerHTML = '<div id="error-overlay"><h3>Preview Compilation Failed</h3>' + msg.replace(/\\n/g, '<br>') + '</div>';
        }

        window.onerror = function(message, source, lineno, colno, error) {
          showError(message + (source ? '\\nat ' + source + ':' + lineno : ''));
          return true;
        };
        window.onunhandledrejection = function(event) {
          showError('Unhandled Promise Rejection: ' + event.reason);
        };
      </script>
    </body>
    </html>
  `

  return (
    <div className="flex flex-col h-full w-full bg-surface-1 border-l border-white/6 overflow-hidden">
      {/* Header Tabs */}
      <div className="px-3 py-1.5 border-b border-white/6 flex items-center justify-between shrink-0 bg-surface-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
              activeTab === 'preview' ? 'text-brand-400 bg-brand-500/10' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Play size={11} />
            Preview
          </button>
          <button
            onClick={() => setActiveTab('info')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
              activeTab === 'info' ? 'text-brand-400 bg-brand-500/10' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Info size={11} />
            Details
          </button>
        </div>

        {activeTab === 'preview' && (
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-40"
            title="Refresh preview sandbox"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin text-brand-400' : ''} />
          </button>
        )}
      </div>

      {/* Main Body content */}
      <div className="flex-1 min-h-0 relative">
        {activeTab === 'preview' ? (
          <div className="absolute inset-0 flex flex-col">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl m-4 text-xs text-red-400 font-mono">
                <strong>Failed to initialize sandbox:</strong>
                <p className="mt-1">{error}</p>
              </div>
            )}
            
            <iframe
              key={`${project.projectId}-${refreshKey}`}
              ref={iframeRef}
              srcDoc={iframeSrcDoc}
              title="React Sandbox"
              sandbox="allow-scripts allow-same-origin"
              className="flex-1 w-full border-none bg-surface-0"
              onLoad={() => {
                if (project?.projectId && !error) {
                  loadProjectFiles()
                }
              }}
            />
          </div>
        ) : (
          <div className="absolute inset-0 overflow-y-auto p-4 space-y-4">
            <div>
              <div className="text-sm font-semibold text-slate-100 mb-1">{project.name}</div>
              <div className="text-xs text-slate-400 leading-relaxed">{project.description}</div>
            </div>

            {project.summary && (
              <div className="glass rounded-xl p-3">
                <div className="text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <Cpu size={11} /> AI Summary
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{project.summary}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <StatCard icon={<Layers size={12} />} label="Files" value={project.filesMeta?.length || 0} />
              <StatCard icon={<Hash size={12} />} label="Deps" value={project.dependencies?.length || 0} />
              <StatCard icon={<Clock size={12} />} label="Duration" value={`${((project.generationDurationMs || 0) / 1000).toFixed(1)}s`} />
              <StatCard icon={<Cpu size={12} />} label="Provider" value={project.aiProvider || 'gemini'} />
            </div>

            {project.dependencies?.length > 0 && (
              <div>
                <div className="text-xs font-medium text-slate-400 mb-2">Dependencies</div>
                <div className="flex flex-wrap gap-1.5">
                  {project.dependencies.map(dep => (
                    <span key={dep} className="px-2 py-0.5 bg-white/5 rounded-full text-xs text-slate-400 font-mono">
                      {dep}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon, label, value }) {
  return (
    <div className="glass rounded-xl p-3">
      <div className="flex items-center gap-1.5 text-slate-500 mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <div className="text-sm font-semibold text-slate-200">{value}</div>
    </div>
  )
}
