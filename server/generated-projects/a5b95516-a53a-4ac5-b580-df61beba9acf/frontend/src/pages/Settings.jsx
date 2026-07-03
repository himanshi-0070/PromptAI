import { motion } from 'framer-motion'
import { Settings as SettingsIcon, PlusCircle, Trash2, Edit, Save, XCircle, Loader2 } from 'lucide-react'
import { useState, useCallback, useMemo } from 'react'
import { useProjects } from '../hooks/useProjects'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorDisplay from '../components/ErrorDisplay'

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 }
}

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.5
}

function Settings() {
  const { projects, createProject, updateProject, deleteProject, loading, error } = useProjects()
  const [newProjectName, setNewProjectName] = useState('')
  const [editingProjectId, setEditingProjectId] = useState(null)
  const [editingProjectName, setEditingProjectName] = useState('')
  const [formError, setFormError] = useState(null)
  const [isSaving, setIsSaving] = useState(false)

  const handleCreateProject = useCallback(async (e) => {
    e.preventDefault()
    setFormError(null)
    if (!newProjectName.trim()) {
      setFormError('Project name cannot be empty.')
      return
    }
    setIsSaving(true)
    try {
      await createProject({ name: newProjectName })
      setNewProjectName('')
    } catch (err) {
      setFormError(err.message || 'Failed to create project.')
    } finally {
      setIsSaving(false)
    }
  }, [newProjectName, createProject])

  const handleEditProject = useCallback((project) => {
    setEditingProjectId(project._id)
    setEditingProjectName(project.name)
    setFormError(null)
  }, [])

  const handleUpdateProject = useCallback(async (e) => {
    e.preventDefault()
    setFormError(null)
    if (!editingProjectName.trim()) {
      setFormError('Project name cannot be empty.')
      return
    }
    setIsSaving(true)
    try {
      await updateProject(editingProjectId, { name: editingProjectName })
      setEditingProjectId(null)
      setEditingProjectName('')
    } catch (err) {
      setFormError(err.message || 'Failed to update project.')
    } finally {
      setIsSaving(false)
    }
  }, [editingProjectId, editingProjectName, updateProject])

  const handleDeleteProject = useCallback(async (projectId) => {
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      try {
        await deleteProject(projectId)
      } catch (err) {
        setFormError(err.message || 'Failed to delete project.')
      }
    }
  }, [deleteProject])

  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => a.name.localeCompare(b.name))
  }, [projects])

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorDisplay message={error.message || 'Failed to load settings data.'} />

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="container mx-auto py-8"
    >
      <h1 className="text-4xl font-bold mb-8 text-darktext flex items-center gap-3">
        <SettingsIcon className="w-10 h-10 text-primary-400" />
        Settings
      </h1>

      <div className="bg-darkcard p-8 rounded-lg shadow-lg border border-darkborder mb-8">
        <h2 className="text-2xl font-semibold text-darktext mb-6">Manage Projects</h2>
        {formError && <ErrorDisplay message={formError} className="mb-4" />}

        <form onSubmit={handleCreateProject} className="flex gap-4 mb-8">
          <input
            type="text"
            placeholder="New project name"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            className="flex-1 p-3 bg-darkbg border border-darkborder rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-darktext"
          />
          <motion.button
            type="submit"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlusCircle className="w-5 h-5" />}
            Add Project
          </motion.button>
        </form>

        {sortedProjects.length === 0 ? (
          <p className="text-darktextsecondary text-center py-4">No projects created yet.</p>
        ) : (
          <ul className="space-y-4">
            {sortedProjects.map(project => (
              <motion.li
                key={project._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-between bg-darkbg p-4 rounded-md border border-darkborder"
              >
                {editingProjectId === project._id ? (
                  <form onSubmit={handleUpdateProject} className="flex-1 flex gap-3 items-center">
                    <input
                      type="text"
                      value={editingProjectName}
                      onChange={(e) => setEditingProjectName(e.target.value)}
                      className="flex-1 p-2 bg-darkcard border border-darkborder rounded-md focus:outline-none focus:ring-1 focus:ring-secondary-500 text-darktext"
                    />
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      disabled={isSaving}
                      className="p-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    </motion.button>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setEditingProjectId(null)}
                      className="p-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors duration-200"
                    >
                      <XCircle className="w-5 h-5" />
                    </motion.button>
                  </form>
                ) : (
                  <span className="text-darktext text-lg font-medium">{project.name}</span>
                )}
                <div className="flex gap-2 ml-4">
                  {editingProjectId !== project._id && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleEditProject(project)}
                      className="p-2 text-secondary-400 hover:text-secondary-500 transition-colors duration-200"
                    >
                      <Edit className="w-5 h-5" />
                    </motion.button>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleDeleteProject(project._id)}
                    className="p-2 text-red-400 hover:text-red-500 transition-colors duration-200"
                  >
                    <Trash2 className="w-5 h-5" />
                  </motion.button>
                </div>
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </motion.div>
  )
}

export default Settings
