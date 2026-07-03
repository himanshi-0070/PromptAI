import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import GlobalLayout from '@/components/layout/GlobalLayout'
import { ThemeProvider } from '@/context/ThemeContext'
import { ProjectProvider } from '@/context/ProjectContext'
import { GenerationProvider } from '@/context/GenerationContext'
import { AuthProvider, useAuth } from '@/context/AuthContext'

// Eager load Landing (entry point) and Login
import Landing from '@/pages/Landing'
import Login from '@/pages/Login'

// Lazy load non-critical pages
const Workspace = lazy(() => import('@/pages/Workspace'))
const History = lazy(() => import('@/pages/History'))
const Settings = lazy(() => import('@/pages/Settings'))
const NotFound = lazy(() => import('@/pages/NotFound'))

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950">
      <div className="w-6 h-6 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
    </div>
  )
}

function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return <PageLoader />
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}

function PublicRoute() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return <PageLoader />
  }

  return isAuthenticated ? <Navigate to="/" replace /> : <Outlet />
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ProjectProvider>
          <GenerationProvider>
            <BrowserRouter>
              <GlobalLayout>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    {/* Public Auth Routes */}
                    <Route element={<PublicRoute />}>
                      <Route path="/login" element={<Login />} />
                    </Route>

                    {/* Protected SaaS Routes */}
                    <Route element={<ProtectedRoute />}>
                      <Route path="/" element={<Landing />} />
                      <Route path="/workspace/:projectId" element={<Workspace />} />
                      <Route path="/history" element={<History />} />
                      <Route path="/settings" element={<Settings />} />
                    </Route>

                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </GlobalLayout>
            </BrowserRouter>
          </GenerationProvider>
        </ProjectProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}
