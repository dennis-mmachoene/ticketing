import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('tv_token')
    if (!token) { setLoading(false); return }
    try {
      const res = await authAPI.me()
      setUser(res.data.user)
    } catch {
      localStorage.removeItem('tv_token')
      localStorage.removeItem('tv_user')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadUser() }, [loadUser])

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password })
    const { token, user } = res.data
    localStorage.setItem('tv_token', token)
    localStorage.setItem('tv_user', JSON.stringify(user))
    setUser(user)
    return user
  }

  const register = async (data) => {
    const res = await authAPI.register(data)
    const { token, user } = res.data
    localStorage.setItem('tv_token', token)
    setUser(user)
    return user
  }

  const logout = () => {
    localStorage.removeItem('tv_token')
    localStorage.removeItem('tv_user')
    setUser(null)
  }

  const updateUser = (updates) => {
    setUser(prev => ({ ...prev, ...updates }))
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, loadUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export default AuthContext
