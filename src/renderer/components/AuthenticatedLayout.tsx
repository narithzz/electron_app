import { NavLink, Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Button } from './button'
import { Separator } from './ui/separator'
import { SessionTimeoutWarning } from './SessionTimeoutWarning'
import logo from '../assets/E-POS-logo-1.png'

export function AuthenticatedLayout() {
  const { user, logout, sessionTimeRemaining: initialTimeRemaining, refreshSession } = useAuth()
  const [displayTimeRemaining, setDisplayTimeRemaining] = useState(initialTimeRemaining)
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now())

  useEffect(() => {
    // Update the display time whenever the sessionTimeRemaining changes significantly
    // (e.g., after a refresh or when receiving updates from the server)
    setDisplayTimeRemaining(initialTimeRemaining)
    setLastUpdateTime(Date.now())
  }, [initialTimeRemaining])

  useEffect(() => {
    // Set up an interval to update the display time every second
    const timer = setInterval(() => {
      const now = Date.now()
      const timeElapsed = now - lastUpdateTime
      setDisplayTimeRemaining(prev => {
        const newTime = Math.max(0, (prev || 0) - timeElapsed)
        return newTime
      })
      setLastUpdateTime(now)
    }, 1000)

    // Clean up the interval when the component unmounts
    return () => clearInterval(timer)
  }, [lastUpdateTime])

  const handleLogout = () => {
    logout()
  }

  const formatTimeRemaining = (milliseconds: number): string => {
    if (milliseconds <= 0) return '0:00'
    const hours = Math.floor(milliseconds / (60 * 60 * 1000))
    const minutes = Math.floor((milliseconds % (60 * 60 * 1000)) / (60 * 1000))
    const seconds = Math.floor((milliseconds % (60 * 1000)) / 1000)

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const getSessionStatusColor = (milliseconds: number): string => {
    const fiveMinutes = 5 * 60 * 1000
    const tenMinutes = 10 * 60 * 1000

    if (milliseconds <= fiveMinutes) return 'text-red-600'
    if (milliseconds <= tenMinutes) return 'text-yellow-600'
    return 'text-green-600'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Session Timeout Warning */}
      <SessionTimeoutWarning />

      {/* Header */}
      <header className="bg-white shadow sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <img src={logo} alt="E-POS Service Logo" className="h-10 mr-2" />
              <Separator orientation="vertical" className="h-6" />
              <nav className="flex space-x-4">
                <NavLink 
                  to="/dashboard" 
                  className={({ isActive }) => 
                    `px-3 py-2 rounded-md text-sm font-medium ${
                      isActive 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  Dashboard
                </NavLink>
                
                {/* <NavLink 
                  to="/database-test" 
                  className={({ isActive }) => 
                    `px-3 py-2 rounded-md text-sm font-medium ${
                      isActive 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  Database Test
                </NavLink> */}
                
                <NavLink 
                  to="/csv-upload" 
                  className={({ isActive }) => 
                    `px-3 py-2 rounded-md text-sm font-medium ${
                      isActive 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  CSV Upload
                </NavLink>
                
                <NavLink 
                  to="/example-usage" 
                  className={({ isActive }) => 
                    `px-3 py-2 rounded-md text-sm font-medium ${
                      isActive 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  PDF Example
                </NavLink>
                
                <NavLink 
                  to="/todos" 
                  className={({ isActive }) => 
                    `px-3 py-2 rounded-md text-sm font-medium ${
                      isActive 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  Todos
                </NavLink>
                
                <NavLink
                  to="/about"
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-sm font-medium ${
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  About
                </NavLink>

                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-sm font-medium ${
                      isActive
                        ? 'bg-red-100 text-red-700'
                        : 'text-red-500 hover:text-red-700 hover:bg-red-100'
                    }`
                  }
                >
                  Admin
                </NavLink>

                <NavLink
                  to="/login-history"
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-sm font-medium ${
                      isActive
                        ? 'bg-purple-100 text-purple-700'
                        : 'text-purple-500 hover:text-purple-700 hover:bg-purple-100'
                    }`
                  }
                >
                  Login History
                </NavLink>
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-700">
                <div>Welcome, <span className="font-medium">{user?.username}</span></div>
                <div className={`text-xs ${getSessionStatusColor(displayTimeRemaining)}`}>
                  Session: {formatTimeRemaining(displayTimeRemaining)}
                </div>
              </div>
              <Button
                onClick={refreshSession}
                size="sm"
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                Extend
              </Button>
              <Button
                onClick={handleLogout}
                size="sm"
                className="bg-red-600 text-white hover:bg-red-700"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Outlet />
        </div>
      </main>
    </div>
  )
}