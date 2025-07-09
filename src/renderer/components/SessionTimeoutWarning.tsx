import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Button } from './button'

export function SessionTimeoutWarning() {
  const { sessionTimeRemaining, refreshSession, logout } = useAuth()
  const [showWarning, setShowWarning] = useState(false)

  // Show warning when 5 minutes or less remaining
  useEffect(() => {
    const fiveMinutes = 5 * 60 * 1000 // 5 minutes in milliseconds
    setShowWarning(sessionTimeRemaining > 0 && sessionTimeRemaining <= fiveMinutes)
  }, [sessionTimeRemaining])

  const formatTimeRemaining = (milliseconds: number): string => {
    const minutes = Math.floor(milliseconds / (60 * 1000))
    const seconds = Math.floor((milliseconds % (60 * 1000)) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handleExtendSession = () => {
    refreshSession()
    setShowWarning(false)
  }

  const handleLogout = () => {
    logout()
  }

  if (!showWarning) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-white p-4 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <p className="font-medium">Session Expiring Soon</p>
            <p className="text-sm">
              Your session will expire in {formatTimeRemaining(sessionTimeRemaining)}. 
              Extend your session or you'll be automatically logged out.
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            onClick={handleExtendSession}
            size="sm"
            className="bg-white text-yellow-600 hover:bg-gray-100"
          >
            Extend Session
          </Button>
          <Button
            onClick={handleLogout}
            size="sm"
            variant="secondary"
            className="bg-yellow-600 text-white hover:bg-yellow-700 border-yellow-600"
          >
            Logout Now
          </Button>
          <button
            onClick={() => setShowWarning(false)}
            className="text-white hover:text-gray-200"
            aria-label="Dismiss warning"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
