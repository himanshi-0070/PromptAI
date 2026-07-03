import { useState, useCallback } from 'react'

/**
 * usePromptInput — Manages the prompt textarea state.
 * Provides a clean API for reading, setting, and resetting the prompt value.
 *
 * @param {string} [initial='']
 * @returns {{ value: string, setValue: Function, reset: Function }}
 */
export function usePromptInput(initial = '') {
  const [value, setValue] = useState(initial)

  const reset = useCallback(() => setValue(''), [])

  return { value, setValue, reset }
}
