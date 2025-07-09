import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'

interface User {
  id: number
  username: string
  created_at: string
}

interface AuthSession {
  user: User
  loginTime: number
  lastActivity: number
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  sessionTimeRemaining: number
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>
  logout: () => void
  refreshSession: () => void
}

// Session timeout: 2 hours in milliseconds
const SESSION_TIMEOUT = 2 * 60 * 60 * 1000 // 2 hours
const SESSION_WARNING_TIME = 5 * 60 * 1000 // 5 minutes before expiry
const INACTIVITY_TIMEOUT = 30 * 60 * 1000 // 30 minutes

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState(0)

  // Check if session is expired
  const isSessionExpired = useCallback((session: AuthSession): boolean => {
    const now = Date.now()
    const timeSinceLogin = now - session.loginTime
    const timeSinceActivity = now - session.lastActivity
    
    // Session expires after 2 hours from login OR 30 minutes of inactivity
    return timeSinceLogin > SESSION_TIMEOUT || timeSinceActivity > INACTIVITY_TIMEOUT
  }, [])

  // Update last activity time
  const updateLastActivity = useCallback(() => {
    const savedSession = localStorage.getItem('authSession')
    if (savedSession) {
      try {
        const session: AuthSession = JSON.parse(savedSession)
        session.lastActivity = Date.now()
        localStorage.setItem('authSession', JSON.stringify(session))
      } catch (error) {
        console.error('Error updating last activity:', error)
      }
    }
  }, [])

  // Logout function
  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem('authSession')
    localStorage.removeItem('user') // Keep for backward compatibility
    console.log('User logged out')
  }, [])

  // Refresh session (extend the session)
  const refreshSession = useCallback(() => {
    const savedSession = localStorage.getItem('authSession')
    if (savedSession && user) {
      try {
        const session: AuthSession = JSON.parse(savedSession)
        session.lastActivity = Date.now()
        localStorage.setItem('authSession', JSON.stringify(session))
        console.log('Session refreshed')
      } catch (error) {
        console.error('Error refreshing session:', error)
      }
    }
  }, [user])

  // Check if user is already logged in (from localStorage)
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const savedSession = localStorage.getItem('authSession')
        if (savedSession) {
          const session: AuthSession = JSON.parse(savedSession)
          
          // Check if session is expired
          if (isSessionExpired(session)) {
            console.log('Session expired, logging out')
            localStorage.removeItem('authSession')
            localStorage.removeItem('user')
            setIsLoading(false)
            return
          }

          // Verify user still exists in database
          const result = await window.electronAPI.getUserProfile(session.user.id)
          if (result.success && result.user) {
            setUser(result.user)
            // Update last activity
            session.lastActivity = Date.now()
            localStorage.setItem('authSession', JSON.stringify(session))
          } else {
            // User no longer exists, clear localStorage
            localStorage.removeItem('authSession')
            localStorage.removeItem('user')
          }
        } else {
          // Check old format for backward compatibility
          const savedUser = localStorage.getItem('user')
          if (savedUser) {
            localStorage.removeItem('user')
          }
        }
      } catch (error) {
        console.error('Error checking auth status:', error)
        localStorage.removeItem('authSession')
        localStorage.removeItem('user')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuthStatus()
  }, [isSessionExpired])

  // Session monitoring - check every minute
  useEffect(() => {
    if (!user) return

    const interval = setInterval(() => {
      const savedSession = localStorage.getItem('authSession')
      if (savedSession) {
        try {
          const session: AuthSession = JSON.parse(savedSession)
          
          if (isSessionExpired(session)) {
            console.log('Session expired during monitoring, logging out')
            logout()
            return
          }

          // Calculate remaining time
          const now = Date.now()
          const timeUntilExpiry = SESSION_TIMEOUT - (now - session.loginTime)
          const timeUntilInactivityExpiry = INACTIVITY_TIMEOUT - (now - session.lastActivity)
          const remaining = Math.min(timeUntilExpiry, timeUntilInactivityExpiry)
          
          setSessionTimeRemaining(Math.max(0, remaining))

          // Show warning when 5 minutes remaining
          if (remaining <= SESSION_WARNING_TIME && remaining > 0) {
            const minutesRemaining = Math.ceil(remaining / (60 * 1000))
            console.warn(`Session will expire in ${minutesRemaining} minutes`)
          }
        } catch (error) {
          console.error('Error monitoring session:', error)
          logout()
        }
      }
    }, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [user, isSessionExpired, logout])

  // Activity tracking - update last activity on user interaction
  useEffect(() => {
    if (!user) return

    const handleActivity = () => {
      updateLastActivity()
    }

    // Track various user activities
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true)
    })

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true)
      })
    }
  }, [user, updateLastActivity])

  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true)
      const result = await window.electronAPI.login(username, password)
      
      if (result.success && result.user) {
        const now = Date.now()
        const session: AuthSession = {
          user: result.user,
          loginTime: now,
          lastActivity: now
        }
        
        setUser(result.user)
        localStorage.setItem('authSession', JSON.stringify(session))
        localStorage.removeItem('user') // Remove old format
        
        console.log('User logged in successfully, session created')
        return { success: true, message: result.message }
      } else {
        return { success: false, message: result.message || 'Login failed' }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, message: 'An error occurred during login' }
    } finally {
      setIsLoading(false)
    }
  }

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    sessionTimeRemaining,
    login,
    logout,
    refreshSession
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
