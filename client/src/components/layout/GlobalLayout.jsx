import { Toaster } from 'sonner'
import Navbar from './Navbar'

export default function GlobalLayout({ children }) {
  return (
    <div className="min-h-screen bg-surface-0 text-slate-200">
      <Navbar />
      <main className="pt-16">
        {children}
      </main>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#1a1a24',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#e2e8f0',
          },
        }}
      />
    </div>
  )
}
