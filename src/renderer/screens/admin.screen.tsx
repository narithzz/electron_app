import { useState } from 'react'
import { Button } from '../components/button'

interface AccountStatus {
  username: string
  failedAttempts: number
  isLocked: boolean
  lockedUntil: string | null
  lastFailedLogin: string | null
  remainingLockoutTime: number
}

export function AdminScreen() {
  const [username, setUsername] = useState('')
  const [accountStatus, setAccountStatus] = useState<AccountStatus | null>(null)
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const checkAccountStatus = async () => {
    if (!username.trim()) {
      setMessage('Please enter a username')
      return
    }

    setIsLoading(true)
    setMessage('')
    
    try {
      const result = await window.electronAPI.checkAccountStatus(username)
      if (result.success && result.accountStatus) {
        setAccountStatus(result.accountStatus)
        setMessage('')
      } else {
        setAccountStatus(null)
        setMessage(result.message || 'User not found')
      }
    } catch (error) {
      setAccountStatus(null)
      setMessage('Error checking account status')
    } finally {
      setIsLoading(false)
    }
  }

  const unlockAccount = async () => {
    if (!username.trim()) {
      setMessage('Please enter a username')
      return
    }

    setIsLoading(true)
    
    try {
      const result = await window.electronAPI.unlockAccount(username)
      if (result.success) {
        setMessage('Account unlocked successfully')
        // Refresh account status
        await checkAccountStatus()
      } else {
        setMessage(result.message || 'Failed to unlock account')
      }
    } catch (error) {
      setMessage('Error unlocking account')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Panel - Account Management</h1>
      
      <div className="space-y-6">
        {/* Account Lookup */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Account Status Lookup</h2>
          
          <div className="flex space-x-4 mb-4">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username to check"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            />
            <Button
              onClick={checkAccountStatus}
              disabled={isLoading || !username.trim()}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {isLoading ? 'Checking...' : 'Check Status'}
            </Button>
          </div>

          {message && (
            <div className={`p-3 rounded-md text-sm mb-4 ${
              message.includes('successfully') || message.includes('unlocked')
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {message}
            </div>
          )}

          {accountStatus && (
            <div className="bg-gray-50 border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Account Status for: {accountStatus.username}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Failed Login Attempts</label>
                  <p className={`text-lg font-semibold ${
                    accountStatus.failedAttempts >= 3 ? 'text-red-600' : 
                    accountStatus.failedAttempts >= 2 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {accountStatus.failedAttempts} / 3
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Account Status</label>
                  <p className={`text-lg font-semibold ${
                    accountStatus.isLocked ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {accountStatus.isLocked ? '🔒 LOCKED' : '🔓 UNLOCKED'}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Locked Until</label>
                  <p className="text-sm text-gray-900">
                    {formatDateTime(accountStatus.lockedUntil)}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Failed Login</label>
                  <p className="text-sm text-gray-900">
                    {formatDateTime(accountStatus.lastFailedLogin)}
                  </p>
                </div>
                
                {accountStatus.isLocked && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Remaining Lockout Time</label>
                    <p className="text-lg font-semibold text-red-600">
                      {accountStatus.remainingLockoutTime} minute(s)
                    </p>
                  </div>
                )}
              </div>

              {accountStatus.isLocked && (
                <div className="mt-4 pt-4 border-t">
                  <Button
                    onClick={unlockAccount}
                    disabled={isLoading}
                    className="bg-red-600 text-white hover:bg-red-700"
                  >
                    {isLoading ? 'Unlocking...' : 'Unlock Account'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Information Panel */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-800">Account Lockout Policy</h2>
          
          <div className="space-y-3 text-blue-700">
            <div className="flex items-start">
              <span className="font-medium mr-2">•</span>
              <span>Accounts are locked after <strong>3 consecutive failed login attempts</strong></span>
            </div>
            <div className="flex items-start">
              <span className="font-medium mr-2">•</span>
              <span>Lockout duration is <strong>15 minutes</strong> from the time of lockout</span>
            </div>
            <div className="flex items-start">
              <span className="font-medium mr-2">•</span>
              <span>Successful login resets the failed attempt counter to zero</span>
            </div>
            <div className="flex items-start">
              <span className="font-medium mr-2">•</span>
              <span>Locked accounts cannot login even with correct credentials</span>
            </div>
            <div className="flex items-start">
              <span className="font-medium mr-2">•</span>
              <span>Administrators can manually unlock accounts using this panel</span>
            </div>
            <div className="flex items-start">
              <span className="font-medium mr-2">•</span>
              <span>Manual unlock immediately resets failed attempts and removes lockout</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Test Users</h3>
              <p className="text-sm text-gray-600 mb-3">Available test accounts for testing lockout</p>
              <div className="text-xs space-y-1">
                <div>admin / admin123</div>
                <div>demo / demo123</div>
                <div>user1 / password123</div>
                <div>test / test123</div>
              </div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Security Features</h3>
              <p className="text-sm text-gray-600 mb-3">Active security measures</p>
              <div className="text-xs space-y-1">
                <div>✅ Failed attempt tracking</div>
                <div>✅ Automatic lockout</div>
                <div>✅ Time-based unlock</div>
                <div>✅ Admin override</div>
              </div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Monitoring</h3>
              <p className="text-sm text-gray-600 mb-3">System monitoring capabilities</p>
              <div className="text-xs space-y-1">
                <div>📊 Real-time status check</div>
                <div>🕒 Lockout time tracking</div>
                <div>📝 Failed attempt logging</div>
                <div>🔓 Manual unlock capability</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
