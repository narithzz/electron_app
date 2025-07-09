/// <reference types="vite/client" />

interface DatabaseResult {
  success: boolean
  message?: string
  data?: any
  error?: string
  rowCount?: number
}

interface User {
  id: number
  username: string
  created_at: string
}

interface LoginResult {
  success: boolean
  message?: string
  user?: User
  error?: string
  isLocked?: boolean
  lockoutEndTime?: string
  failedAttempts?: number
  remainingAttempts?: number
}

interface AccountStatus {
  username: string
  failedAttempts: number
  isLocked: boolean
  lockedUntil: string | null
  lastFailedLogin: string | null
  remainingLockoutTime: number
}

interface AccountStatusResult {
  success: boolean
  message?: string
  accountStatus?: AccountStatus
  error?: string
}

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

interface LoginStatisticsResult {
  success: boolean
  message?: string
  data?: LoginStatistics
  error?: string
}

interface ElectronAPI {
  testDbConnection(): Promise<DatabaseResult>
  getTables(): Promise<DatabaseResult>
  executeQuery(query: string, params?: any[]): Promise<DatabaseResult>
  fetchData(): Promise<any>
  login(username: string, password: string): Promise<LoginResult>
  getUserProfile(userId: number): Promise<LoginResult>
  checkAccountStatus(username: string): Promise<AccountStatusResult>
  unlockAccount(username: string): Promise<DatabaseResult>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
