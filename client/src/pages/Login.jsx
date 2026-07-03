import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Bot, Shield, Code2, Users, Keyboard } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
export default function Login() {
  const { login } = useAuth()
  const [mockEmail, setMockEmail] = useState('dev@promptai.dev')
  const [showDeveloperAccess, setShowDeveloperAccess] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)

  // Handle Google OAuth Callback
  const handleGoogleCallback = async (response) => {
    try {
      setAuthLoading(true)
      await login(response.credential)
    } catch (err) {
      console.error(err)
    } finally {
      setAuthLoading(false)
    }
  }

  useEffect(() => {
    // Check if google library is loaded on mount
    const initGoogleGSI = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          // Load Client ID from Vite environment, with a default fallback
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || 'google-auth-client-id-placeholder.apps.googleusercontent.com',
          callback: handleGoogleCallback,
        })
        window.google.accounts.id.renderButton(
          document.getElementById('google-signin-btn'),
          {
            theme: 'filled_blue',
            size: 'large',
            text: 'signin_with',
            shape: 'pill',
            width: 280,
          }
        )
      } else {
        // Retry shortly after GSI script fetches
        setTimeout(initGoogleGSI, 500)
      }
    }
    initGoogleGSI()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Trigger quick developer access for local/dev environments
  const handleDevLogin = async (e) => {
    e.preventDefault()
    if (!mockEmail.trim()) return
    try {
      setAuthLoading(true)
      const mockToken = `mock_${mockEmail.trim().toLowerCase()}`
      await login(mockToken)
    } catch (err) {
      console.error(err)
    } finally {
      setAuthLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row relative overflow-hidden font-sans">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-violet-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Left side: branding/intro */}
      <div className="flex-1 flex flex-col justify-between p-8 md:p-16 z-10 select-none">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center">
            <Bot size={16} className="text-brand-400" />
          </div>
          <span className="font-bold text-slate-100 tracking-tight">PromptAI</span>
        </div>

        <div className="my-auto max-w-lg space-y-6">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-extrabold text-slate-100 tracking-tight leading-[1.1]"
          >
            Deploy Full-Stack Apps <br />
            <span className="bg-gradient-to-r from-brand-400 to-violet-400 bg-clip-text text-transparent">
              In a Single Prompt.
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-slate-400 text-sm leading-relaxed"
          >
            PromptAI transforms natural language specifications into complete production-ready full-stack software. Refine, search, build, and deploy all from one unified AI developer workspace.
          </motion.p>

          {/* SaaS Keypoints */}
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-white/5 rounded-lg border border-white/10 text-brand-400 shrink-0">
                <Shield size={14} />
              </div>
              <span className="text-xs font-medium text-slate-350">Secure JWT Auth</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-white/5 rounded-lg border border-white/10 text-brand-400 shrink-0">
                <Code2 size={14} />
              </div>
              <span className="text-xs font-medium text-slate-350">Iterative Editing</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-white/5 rounded-lg border border-white/10 text-brand-400 shrink-0">
                <Users size={14} />
              </div>
              <span className="text-xs font-medium text-slate-350">Multi-User SaaS</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-white/5 rounded-lg border border-white/10 text-brand-400 shrink-0">
                <Keyboard size={14} />
              </div>
              <span className="text-xs font-medium text-slate-350">Vite Standalone IFrame</span>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-500">
          © {new Date().getFullYear()} PromptAI Inc. All rights reserved.
        </div>
      </div>

      {/* Right side: Login forms */}
      <div className="w-full md:w-[450px] bg-slate-900/60 backdrop-blur-md border-l border-white/5 flex items-center justify-center p-8 z-10 shrink-0 relative">
        <div className="w-full max-w-sm flex flex-col items-center">
          <div className="text-center space-y-2 mb-8">
            <h2 className="text-xl font-bold text-slate-100">Welcome to PromptAI</h2>
            <p className="text-xs text-slate-500">Sign in to access your projects and workspace</p>
          </div>

          {/* Social Google Login button */}
          <div className="min-h-[50px] flex items-center justify-center mb-6">
            {authLoading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-5 h-5 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
                <span className="text-[10px] text-slate-500 font-medium">Authorizing secure session...</span>
              </div>
            ) : (
              <div id="google-signin-btn" className="hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200" />
            )}
          </div>

          {/* Or Divider */}
          <div className="w-full flex items-center gap-3 my-4">
            <div className="h-[1px] bg-white/5 flex-1" />
            <span className="text-[10px] text-slate-650 font-bold uppercase tracking-wider">OR</span>
            <div className="h-[1px] bg-white/5 flex-1" />
          </div>

          {/* Developer Quick Access Mode (For Sandbox & Local Setup) */}
          <div className="w-full flex flex-col items-center">
            {!showDeveloperAccess ? (
              <button
                onClick={() => setShowDeveloperAccess(true)}
                className="text-xs text-slate-500 hover:text-brand-400 transition-colors flex items-center gap-1.5"
              >
                Developer Quick Access (Local Dev)
              </button>
            ) : (
              <form onSubmit={handleDevLogin} className="w-full space-y-3 p-3.5 glass rounded-xl border border-white/5">
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Mock Email Address</label>
                  <input
                    type="email"
                    value={mockEmail}
                    onChange={e => setMockEmail(e.target.value)}
                    required
                    placeholder="dev@promptai.dev"
                    className="w-full bg-slate-950/80 border border-white/5 text-xs text-slate-200 rounded-lg p-2 outline-none focus:border-brand-500/40"
                  />
                </div>
                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-2 bg-brand-500 hover:bg-brand-650 text-xs font-semibold text-white rounded-lg transition-colors cursor-pointer disabled:opacity-40"
                >
                  Quick Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeveloperAccess(false)}
                  className="w-full text-[10px] text-slate-600 hover:text-slate-400 text-center"
                >
                  Cancel
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
