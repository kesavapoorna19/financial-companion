import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Merge Tailwind class strings safely (handles duplicates/conflicts). */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
