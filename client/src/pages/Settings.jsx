import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Settings as SettingsIcon, Trash2, Info, Server, Database, BrainCircuit, Globe } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import { toast } from 'sonner'
import api from '@/services/api'

function SettingsSection({ title, children }) {
  return (
    <div className="glass rounded-2xl p-6">
      <h2 className="text-sm font-semibold text-slate-350 mb-4">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

export default function Settings() {
  const { isDark, toggle } = useTheme()
  const [diagnostics, setDiagnostics] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchDiagnostics = async () => {
    setLoading(true)
    try {
      const res = await api.get('/status')
      setDiagnostics(res.data.data)
    } catch {
      toast.error('Failed to load system diagnostics.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDiagnostics()
  }, [])

  return (
    <div className="min-h-[calc(100vh-64px)] max-w-2xl mx-auto px-6 py-10 bg-surface-0">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-8">
          <SettingsIcon size={20} className="text-brand-400" />
          <h1 className="text-2xl font-bold text-slate-100 animate-pulse-glow">Settings</h1>
        </div>

        <div className="space-y-4">
          
          {/* Appearance settings */}
          <SettingsSection title="Appearance">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-slate-200">Theme Preference</div>
                <div className="text-xs text-slate-500 mt-0.5">Currently using {isDark ? 'dark' : 'light'} mode</div>
              </div>
              <button
                onClick={toggle}
                className={`relative w-12 h-6 rounded-full transition-colors duration-200 cursor-pointer ${isDark ? 'bg-brand-500' : 'bg-white/20'}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${isDark ? 'left-6' : 'left-0.5'}`} />
              </button>
            </div>
          </SettingsSection>

          {/* Connection Status & Diagnostics */}
          <SettingsSection title="System Diagnostics & Connection Status">
            {loading ? (
              <div className="flex items-center gap-2 text-xs text-slate-500 py-2">
                <LoaderIcon className="animate-spin text-brand-400" /> Diagnosing backend integrations...
              </div>
            ) : diagnostics ? (
              <div className="space-y-3 font-sans">
                {/* Server check */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/4 border border-white/6">
                  <div className="flex items-center gap-3">
                    <Server size={14} className="text-brand-400" />
                    <div>
                      <div className="text-xs font-semibold text-slate-200">Backend Server API</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Environment: {diagnostics.environment || 'N/A'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-[11px] text-emerald-400 font-semibold uppercase tracking-wider">Active</span>
                  </div>
                </div>

                {/* MongoDB check */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/4 border border-white/6">
                  <div className="flex items-center gap-3">
                    <Database size={14} className="text-brand-400" />
                    <div>
                      <div className="text-xs font-semibold text-slate-200">MongoDB Database Connection</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Status: {diagnostics.database?.status || 'N/A'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {diagnostics.database?.status === 'connected' ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        <span className="text-[11px] text-emerald-400 font-semibold uppercase tracking-wider">Connected</span>
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-[11px] text-red-400 font-semibold uppercase tracking-wider">Disconnected</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Gemini check */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/4 border border-white/6">
                  <div className="flex items-center gap-3">
                    <BrainCircuit size={14} className="text-brand-400" />
                    <div>
                      <div className="text-xs font-semibold text-slate-200">Google Gemini AI Engine</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Model: {diagnostics.ai?.model || 'N/A'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {diagnostics.ai?.configured ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        <span className="text-[11px] text-emerald-400 font-semibold uppercase tracking-wider">Configured</span>
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-[11px] text-red-400 font-semibold uppercase tracking-wider">Missing API Key</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-red-400 py-2 flex items-center gap-2">
                ⚠️ Unable to connect to diagnostics server API. Make sure the backend node process is running on port 5000.
              </div>
            )}
          </SettingsSection>

          {/* AI Providers (UI selection - future ready) */}
          <SettingsSection title="AI Engine Provider (Extensible Architecture)">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl border border-brand-500/30 bg-brand-500/10 flex flex-col justify-between h-24">
                <div className="flex justify-between items-start">
                  <BrainCircuit size={16} className="text-brand-300" />
                  <span className="text-[9px] bg-brand-500 text-white font-semibold uppercase px-1 rounded">Active</span>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-200">Google Gemini</div>
                  <div className="text-[9px] text-slate-500 mt-0.5">Primary generation LLM</div>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-white/6 bg-white/3 flex flex-col justify-between h-24 opacity-60">
                <div className="flex justify-between items-start">
                  <Globe size={16} className="text-slate-500" />
                  <span className="text-[9px] bg-white/10 text-slate-400 font-semibold uppercase px-1 rounded">Planned</span>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-300">Anthropic Claude</div>
                  <div className="text-[9px] text-slate-600 mt-0.5">Integrations scheduled</div>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-white/6 bg-white/3 flex flex-col justify-between h-24 opacity-60">
                <div className="flex justify-between items-start">
                  <Globe size={16} className="text-slate-500" />
                  <span className="text-[9px] bg-white/10 text-slate-400 font-semibold uppercase px-1 rounded">Planned</span>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-300">OpenAI GPT-4</div>
                  <div className="text-[9px] text-slate-600 mt-0.5">Integrations scheduled</div>
                </div>
              </div>
            </div>
          </SettingsSection>

          {/* Local storage cache clearing */}
          <SettingsSection title="Preferences Cache">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-slate-200">Clear Local Storage Cache</div>
                <div className="text-xs text-slate-500 mt-0.5">Wipes resizable panel dimensions and theme caches</div>
              </div>
              <button
                onClick={() => { localStorage.clear(); toast.success('Workspace dimension settings and cache cleared.') }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Trash2 size={12} /> Clear Cache
              </button>
            </div>
          </SettingsSection>

          {/* SaaS metadata details */}
          <SettingsSection title="About PromptAI Workspace">
            <div className="flex gap-3">
              <Info size={14} className="text-brand-400 shrink-0 mt-0.5" />
              <div className="text-sm text-slate-400 leading-relaxed">
                PromptAI is an AI-powered code builder dashboard that generates complete functional React + Express web apps.
                <div className="mt-2 text-xs text-slate-650 flex flex-col gap-1">
                  <span>Application Version: <strong>v1.0.0 (Core MVP)</strong></span>
                  <span>Developer Sandbox Engine: <strong>Babel Client Sandbox v1.0</strong></span>
                </div>
              </div>
            </div>
          </SettingsSection>
        </div>
      </motion.div>
    </div>
  )
}

function LoaderIcon(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}
