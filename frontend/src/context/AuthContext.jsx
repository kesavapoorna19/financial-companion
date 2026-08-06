import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import authService from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('fc_user')
      return raw ? JSON.parse(raw) : null
    } catch { return null }
  })

  const [token, setToken] = useState(() => localStorage.getItem('fc_token'))
  const isAuthenticated = Boolean(user && token)

  // On mount, if we have a token but no user cached, fetch from the API.
  useEffect(() => {
    if (token && !user) {
      authService.getMe()
        .then((u) => {
          setUser(u)
          localStorage.setItem('fc_user', JSON.stringify(u))
        })
        .catch(() => {
          // Token invalid or expired — clear everything.
          setToken(null)
          setUser(null)
          localStorage.removeItem('fc_token')
          localStorage.removeItem('fc_user')
        })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

 const login = useCallback(async ({ email, password }) => {
  const data = await authService.login(email, password)

  // Save token first
  setToken(data.access_token)
  localStorage.setItem('fc_token', data.access_token)

  // Now call /me with token attached
  const me = await authService.getMe()

  setUser(me)
  localStorage.setItem('fc_user', JSON.stringify(me))

  return me
}, [])

const register = useCallback(async (payload) => {
  const data = await authService.register(payload)

  setToken(data.access_token)
  localStorage.setItem('fc_token', data.access_token)

  const me = await authService.getMe()

  setUser(me)
  localStorage.setItem('fc_user', JSON.stringify(me))

  return me
}, [])

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('fc_user')
    localStorage.removeItem('fc_token')
  }, [])

  const refreshUser = useCallback(async () => {
    const me = await authService.getMe()
    setUser(me)
    localStorage.setItem('fc_user', JSON.stringify(me))
    return me
  }, [])

  const value = useMemo(
    () => ({ user, token, isAuthenticated, login, register, logout, refreshUser }),
    [user, token, isAuthenticated, login, register, logout, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
