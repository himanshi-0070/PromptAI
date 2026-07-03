import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './context/AuthContext.jsx'
import { TaskProvider } from './context/TaskContext.jsx'
import { ProjectProvider } from './context/ProjectContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ProjectProvider>
          <TaskProvider>
            <App />
          </TaskProvider>
        </ProjectProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
