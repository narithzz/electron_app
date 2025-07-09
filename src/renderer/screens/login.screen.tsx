import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/button'
import logo from '../assets/E-POS-logo-1.png'

export function LoginScreen() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [lockoutInfo, setLockoutInfo] = useState<{isLocked: boolean, endTime?: string, remainingAttempts?: number} | null>(null)

  const { login, isAuthenticated, isLoading } = useAuth()

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  // Show loading spinner while checking auth status
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLockoutInfo(null)
    setIsSubmitting(true)

    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password')
      setIsSubmitting(false)
      return
    }

    try {
      const result = await login(username, password)
      if (!result.success) {
        if (result.isLocked) {
          setLockoutInfo({
            isLocked: true,
            endTime: result.lockoutEndTime
          })
          setError(result.message || 'Account is locked')
        } else if (result.remainingAttempts !== undefined) {
          setLockoutInfo({
            isLocked: false,
            remainingAttempts: result.remainingAttempts
          })
          setError(result.message || 'Login failed')
        } else {
          setError(result.message || 'Login failed')
        }
      }
      // If successful, the AuthContext will handle the redirect
    } catch (error) {
      setError('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="flex flex-col items-center">
          <img src={logo} alt="E-POS Service Logo" className="mx-auto mb-4 h-12" />
          <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your credentials to access the application
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Enter your username"
                disabled={isSubmitting}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Enter your password"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {error && (
            <div className={`border px-4 py-3 rounded-md text-sm ${
              lockoutInfo?.isLocked
                ? 'bg-red-50 border-red-200 text-red-700'
                : lockoutInfo?.remainingAttempts !== undefined
                ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {lockoutInfo?.isLocked ? (
                    <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  ) : lockoutInfo?.remainingAttempts !== undefined ? (
                    <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="ml-3">
                  <p className="font-medium">
                    {lockoutInfo?.isLocked ? 'Account Locked' :
                     lockoutInfo?.remainingAttempts !== undefined ? 'Login Failed' : 'Error'}
                  </p>
                  <p className="mt-1">{error}</p>
                  {lockoutInfo?.remainingAttempts !== undefined && (
                    <p className="mt-1 font-medium">
                      ⚠️ {lockoutInfo.remainingAttempts} attempt(s) remaining before lockout
                    </p>
                  )}
                  {lockoutInfo?.isLocked && lockoutInfo.endTime && (
                    <p className="mt-1 text-xs">
                      Account will be unlocked at: {new Date(lockoutInfo.endTime).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Demo credentials: <br />
              <span className="font-mono bg-gray-100 px-2 py-1 rounded">admin / admin123</span>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
