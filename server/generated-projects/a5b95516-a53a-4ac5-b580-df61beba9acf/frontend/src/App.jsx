import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Dashboard from './pages/Dashboard'
import BoardView from './pages/BoardView'
import ListView from './pages/ListView'
import TaskDetail from './pages/TaskDetail'
import Settings from './pages/Settings'
import Login from './pages/Login'
import Register from './pages/Register'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuth } from './hooks/useAuth'
import { useEffect } from 'react'

function App() {
  const location = useLocation()
  const { isAuthenticated, checkAuthStatus } = useAuth()

  useEffect(() => {
    checkAuthStatus()
  }, [checkAuthStatus])

  return (
    <div className="flex min-h-screen bg-darkbg text-darktext font-sans">
      {isAuthenticated && <Sidebar />}
      <div className={`flex-1 flex flex-col ${isAuthenticated ? 'md:ml-64' : ''}`}>
        {isAuthenticated && <Navbar />}
        <main className="flex-1 p-4 md:p-6">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login />} />
              <Route path="/register" element={isAuthenticated ? <Navigate to="/" /> : <Register />} />
              
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/board" element={<BoardView />} />
                <Route path="/list" element={<ListView />} />
                <Route path="/task/:id" element={<TaskDetail />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
              
              <Route path="*" element={<Navigate to={isAuthenticated ? '/' : '/login'} />} />
            </Routes>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}

export default App
