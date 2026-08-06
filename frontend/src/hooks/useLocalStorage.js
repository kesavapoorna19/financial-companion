import { useState, useEffect } from 'react'

/**
 * React state that persists to localStorage.
 * Value is JSON-serialized on write and parsed on read.
 */
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key)
      return stored !== null ? JSON.parse(stored) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Storage full or private browsing — fail silently.
    }
  }, [key, value])

  return [value, setValue]
}
