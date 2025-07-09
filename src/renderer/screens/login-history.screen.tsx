import React, { useState, useEffect } from 'react'

interface LoginHistoryRecord {
  id: number
  username: string
  login_attempt_time: string
  login_status: 'SUCCESS' | 'FAILED' | 'LOCKED'
  failure_reason?: string
  ip_address?: string
  user_agent?: string
  session_id?: string
  created_at: string
  user_id?: number
}

interface LoginHistoryResult {
  success: boolean
  message?: string
  data?: LoginHistoryRecord[]
  total?: number
  limit?: number
  offset?: number
  error?: string
}

interface LoginStatistics {
  summary: Array<{
    login_status: string
    count: string
    unique_users: string
  }>
  daily: Array<{
    login_date: string
    login_status: string
    count: string
  }>
  activeUsers: Array<{
    username: string
    total_attempts: string
    successful_logins: string
    failed_logins: string
    last_login_attempt: string
  }>
  period: number
}

export default function LoginHistoryScreen() {
  const [loginHistory, setLoginHistory] = useState<LoginHistoryRecord[]>([])
  const [statistics, setStatistics] = useState<LoginStatistics | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const [recordsPerPage, setRecordsPerPage] = useState(50)
  const [activeTab, setActiveTab] = useState<'history' | 'statistics'>('history')

  const loadLoginHistory = async (username?: string, page: number = 1) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const offset = (page - 1) * recordsPerPage
      let result: LoginHistoryResult
      
      if (username && username.trim()) {
        result = await window.electronAPI.getUserLoginHistory(username.trim(), recordsPerPage)
        setTotalRecords(result.data?.length || 0)
      } else {
        result = await window.electronAPI.getAllLoginHistory(recordsPerPage, offset)
        setTotalRecords(result.total || 0)
      }
      
      if (result.success && result.data) {
        setLoginHistory(result.data)
      } else {
        setError(result.error || result.message || 'Failed to load login history')
        setLoginHistory([])
      }
    } catch (err) {
      setError('An unexpected error occurred while loading login history')
      setLoginHistory([])
    } finally {
      setIsLoading(false)
    }
  }

  const loadStatistics = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await window.electronAPI.getLoginStatistics(30)
      
      if (result.success && result.data) {
        setStatistics(result.data)
      } else {
        setError(result.error || result.message || 'Failed to load statistics')
      }
    } catch (err) {
      setError('An unexpected error occurred while loading statistics')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'history') {
      loadLoginHistory(selectedUser, currentPage)
    } else {
      loadStatistics()
    }
  }, [activeTab, selectedUser, currentPage, recordsPerPage])

  const handleUserSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    loadLoginHistory(selectedUser, 1)
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'FAILED':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'LOCKED':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const totalPages = Math.ceil(totalRecords / recordsPerPage)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Login History & Analytics</h1>
        <p className="text-gray-600">Monitor user login activities and security events</p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('history')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Login History
            </button>
            <button
              onClick={() => setActiveTab('statistics')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'statistics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Statistics
            </button>
          </nav>
        </div>
      </div>

      {activeTab === 'history' && (
        <div>
          {/* Search and Controls */}
          <div className="mb-6 bg-white p-4 rounded-lg shadow">
            <form onSubmit={handleUserSearch} className="flex gap-4 items-end">
              <div className="flex-1">
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by Username
                </label>
                <input
                  type="text"
                  id="username"
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  placeholder="Enter username (leave empty for all users)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="recordsPerPage" className="block text-sm font-medium text-gray-700 mb-1">
                  Records per page
                </label>
                <select
                  id="recordsPerPage"
                  value={recordsPerPage}
                  onChange={(e) => {
                    setRecordsPerPage(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={10}>10</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Loading...' : 'Search'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedUser('')
                  setCurrentPage(1)
                  loadLoginHistory('', 1)
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Clear
              </button>
            </form>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Login History Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Login History {selectedUser && `for ${selectedUser}`}
              </h3>
              <p className="text-sm text-gray-500">
                Showing {loginHistory.length} of {totalRecords} records
              </p>
            </div>

            {isLoading ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Loading login history...</p>
              </div>
            ) : loginHistory.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No login history records found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Username
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reason
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        IP Address
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Session ID
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loginHistory.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {record.username}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDateTime(record.login_attempt_time)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusBadgeClass(record.login_status)}`}>
                            {record.login_status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                          {record.failure_reason || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {record.ip_address || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                          {record.session_id || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {!selectedUser && totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'statistics' && (
        <div>
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading statistics...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
          ) : statistics ? (
            <div className="space-y-6">
              {/* Summary Statistics */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Login Summary (Last 30 Days)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {statistics.summary.map((stat) => (
                    <div key={stat.login_status} className="text-center p-4 border rounded-lg">
                      <div className={`text-2xl font-bold ${
                        stat.login_status === 'SUCCESS' ? 'text-green-600' :
                        stat.login_status === 'FAILED' ? 'text-red-600' : 'text-yellow-600'
                      }`}>
                        {stat.count}
                      </div>
                      <div className="text-sm text-gray-600">{stat.login_status} Logins</div>
                      <div className="text-xs text-gray-500">{stat.unique_users} unique users</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Most Active Users */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Most Active Users</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Attempts</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Successful</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Failed</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {statistics.activeUsers.map((user, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.username}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.total_attempts}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">{user.successful_logins}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">{user.failed_logins}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDateTime(user.last_login_attempt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
