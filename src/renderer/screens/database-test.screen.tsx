import { useState } from 'react'
import { Button } from '../components/button'

interface DatabaseResult {
  success: boolean
  message?: string
  data?: any
  error?: string
  rowCount?: number
}

export function DatabaseTestScreen() {
  const [connectionResult, setConnectionResult] = useState<DatabaseResult | null>(null)
  const [tablesResult, setTablesResult] = useState<DatabaseResult | null>(null)
  const [queryResult, setQueryResult] = useState<DatabaseResult | null>(null)
  const [customQuery, setCustomQuery] = useState('SELECT NOW() as current_time')
  const [isLoading, setIsLoading] = useState(false)

  const testConnection = async () => {
    setIsLoading(true)
    try {
      const result = await window.electronAPI.testDbConnection()
      setConnectionResult(result)
    } catch (error) {
      setConnectionResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getTables = async () => {
    setIsLoading(true)
    try {
      const result = await window.electronAPI.getTables()
      setTablesResult(result)
    } catch (error) {
      setTablesResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const executeQuery = async () => {
    if (!customQuery.trim()) return
    
    setIsLoading(true)
    try {
      const result = await window.electronAPI.executeQuery(customQuery)
      setQueryResult(result)
    } catch (error) {
      setQueryResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const renderResult = (result: DatabaseResult | null, title: string) => {
    if (!result) return null

    return (
      <div className="mt-4 p-4 border rounded-lg">
        <h3 className="font-semibold mb-2">{title}</h3>
        {result.success ? (
          <div className="text-green-600">
            <p className="font-medium">✅ Success</p>
            {result.message && <p className="text-sm mt-1">{result.message}</p>}
            {result.data && (
              <div className="mt-2">
                <p className="text-sm font-medium">Data:</p>
                <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto max-h-40">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </div>
            )}
            {result.rowCount !== undefined && (
              <p className="text-sm mt-1">Rows affected: {result.rowCount}</p>
            )}
          </div>
        ) : (
          <div className="text-red-600">
            <p className="font-medium">❌ Failed</p>
            {result.error && <p className="text-sm mt-1">{result.error}</p>}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Database Connection Test</h1>
      
      <div className="space-y-6">
        {/* Connection Test */}
        <div className="border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">Connection Test</h2>
          <p className="text-gray-600 mb-4">
            Test the connection to your PostgreSQL database on Neon.
          </p>
          <Button 
            onClick={testConnection} 
            disabled={isLoading}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            {isLoading ? 'Testing...' : 'Test Connection'}
          </Button>
          {renderResult(connectionResult, 'Connection Test Result')}
        </div>

        {/* Tables List */}
        <div className="border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">Database Tables</h2>
          <p className="text-gray-600 mb-4">
            Fetch all tables in the public schema.
          </p>
          <Button 
            onClick={getTables} 
            disabled={isLoading}
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            {isLoading ? 'Loading...' : 'Get Tables'}
          </Button>
          {renderResult(tablesResult, 'Tables List')}
        </div>

        {/* Custom Query */}
        <div className="border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">Custom Query</h2>
          <p className="text-gray-600 mb-4">
            Execute a custom SQL query. Be careful with destructive operations!
          </p>
          <div className="space-y-4">
            <textarea
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              placeholder="Enter your SQL query here..."
              className="w-full h-32 p-3 border rounded-lg font-mono text-sm"
            />
            <Button 
              onClick={executeQuery} 
              disabled={isLoading || !customQuery.trim()}
              className="bg-purple-500 hover:bg-purple-600 text-white"
            >
              {isLoading ? 'Executing...' : 'Execute Query'}
            </Button>
          </div>
          {renderResult(queryResult, 'Query Result')}
        </div>

        {/* Database Info */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <h2 className="text-xl font-semibold mb-4">Database Information</h2>
          <div className="text-sm space-y-2">
            <p><strong>Host:</strong> ep-cold-fog-a1hflkb0-pooler.ap-southeast-1.aws.neon.tech</p>
            <p><strong>Database:</strong> neondb</p>
            <p><strong>SSL:</strong> Required</p>
            <p><strong>Region:</strong> ap-southeast-1 (Singapore)</p>
          </div>
        </div>
      </div>
    </div>
  )
}
