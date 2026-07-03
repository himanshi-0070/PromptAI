import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * cn — Merges Tailwind class names safely.
 * Resolves conflicts using tailwind-merge and
 * conditionals using clsx.
 *
 * @param {...import('clsx').ClassValue} inputs
 * @returns {string}
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
