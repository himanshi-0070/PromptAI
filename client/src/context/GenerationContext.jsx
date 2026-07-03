/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react'

export const STAGES = [
  'Understanding Project',
  'Analyzing Requirements',
  'Planning Architecture',
  'Generating Source Files',
  'Running Code Review Checks',
  'Writing Workspace Files',
  'Saving Version History',
  'Complete'
]

const GenerationContext = createContext(null)

export function GenerationProvider({ children }) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [stage, setStage] = useState(null)
  const [stageIndex, setStageIndex] = useState(0)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const startGeneration = () => {
    setIsGenerating(true)
    setError(null)
    setResult(null)
    setStageIndex(0)
    setStage(STAGES[0])
  }

  const advanceStage = () => {
    setStageIndex(i => {
      const next = Math.min(i + 1, STAGES.length - 1)
      setStage(STAGES[next])
      return next
    })
  }

  const setGenerationStage = (stageName, index) => {
    setStageIndex(index)
    setStage(stageName)
  }

  const finishGeneration = (data) => {
    setIsGenerating(false)
    setResult(data)
    setStage(null)
  }

  const failGeneration = (err) => {
    setIsGenerating(false)
    setError(err)
    setStage(null)
  }

  const reset = () => {
    setIsGenerating(false)
    setStage(null)
    setStageIndex(0)
    setError(null)
    setResult(null)
  }

  return (
    <GenerationContext.Provider value={{
      isGenerating, stage, stageIndex,
      error, result,
      startGeneration, advanceStage, setGenerationStage,
      finishGeneration, failGeneration, reset,
      totalStages: STAGES.length
    }}>
      {children}
    </GenerationContext.Provider>
  )
}

export const useGeneration = () => {
  const ctx = useContext(GenerationContext)
  if (!ctx) throw new Error('useGeneration must be used within GenerationProvider')
  return ctx
}
