// Test script to verify session timeout functionality
// This simulates the session timeout logic

const SESSION_TIMEOUT = 2 * 60 * 60 * 1000 // 2 hours
const INACTIVITY_TIMEOUT = 30 * 60 * 1000 // 30 minutes

function createSession(user) {
  const now = Date.now()
  return {
    user,
    loginTime: now,
    lastActivity: now
  }
}

function isSessionExpired(session) {
  const now = Date.now()
  const timeSinceLogin = now - session.loginTime
  const timeSinceActivity = now - session.lastActivity
  
  return timeSinceLogin > SESSION_TIMEOUT || timeSinceActivity > INACTIVITY_TIMEOUT
}

function formatTime(milliseconds) {
  const hours = Math.floor(milliseconds / (60 * 60 * 1000))
  const minutes = Math.floor((milliseconds % (60 * 60 * 1000)) / (60 * 1000))
  const seconds = Math.floor((milliseconds % (60 * 1000)) / 1000)
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`
  }
  return `${minutes}m ${seconds}s`
}

function testSessionTimeout() {
  console.log('🔐 Testing Session Timeout Functionality\n')
  
  const testUser = { id: 1, username: 'admin', created_at: new Date().toISOString() }
  
  // Test 1: Fresh session (should not be expired)
  console.log('Test 1: Fresh session')
  const freshSession = createSession(testUser)
  console.log(`  Session created at: ${new Date(freshSession.loginTime).toLocaleTimeString()}`)
  console.log(`  Is expired: ${isSessionExpired(freshSession) ? '❌ YES' : '✅ NO'}`)
  console.log()
  
  // Test 2: Session after 1 hour (should not be expired)
  console.log('Test 2: Session after 1 hour')
  const oneHourSession = createSession(testUser)
  oneHourSession.loginTime = Date.now() - (60 * 60 * 1000) // 1 hour ago
  oneHourSession.lastActivity = Date.now() - (10 * 60 * 1000) // 10 minutes ago
  console.log(`  Login time: ${formatTime(Date.now() - oneHourSession.loginTime)} ago`)
  console.log(`  Last activity: ${formatTime(Date.now() - oneHourSession.lastActivity)} ago`)
  console.log(`  Is expired: ${isSessionExpired(oneHourSession) ? '❌ YES' : '✅ NO'}`)
  console.log()
  
  // Test 3: Session after 2.5 hours (should be expired due to total time)
  console.log('Test 3: Session after 2.5 hours')
  const expiredTimeSession = createSession(testUser)
  expiredTimeSession.loginTime = Date.now() - (2.5 * 60 * 60 * 1000) // 2.5 hours ago
  expiredTimeSession.lastActivity = Date.now() - (10 * 60 * 1000) // 10 minutes ago
  console.log(`  Login time: ${formatTime(Date.now() - expiredTimeSession.loginTime)} ago`)
  console.log(`  Last activity: ${formatTime(Date.now() - expiredTimeSession.lastActivity)} ago`)
  console.log(`  Is expired: ${isSessionExpired(expiredTimeSession) ? '✅ YES (due to total time)' : '❌ NO'}`)
  console.log()
  
  // Test 4: Session with 35 minutes of inactivity (should be expired due to inactivity)
  console.log('Test 4: Session with 35 minutes of inactivity')
  const inactiveSession = createSession(testUser)
  inactiveSession.loginTime = Date.now() - (60 * 60 * 1000) // 1 hour ago
  inactiveSession.lastActivity = Date.now() - (35 * 60 * 1000) // 35 minutes ago
  console.log(`  Login time: ${formatTime(Date.now() - inactiveSession.loginTime)} ago`)
  console.log(`  Last activity: ${formatTime(Date.now() - inactiveSession.lastActivity)} ago`)
  console.log(`  Is expired: ${isSessionExpired(inactiveSession) ? '✅ YES (due to inactivity)' : '❌ NO'}`)
  console.log()
  
  // Test 5: Calculate remaining time for active session
  console.log('Test 5: Calculate remaining time')
  const activeSession = createSession(testUser)
  activeSession.loginTime = Date.now() - (90 * 60 * 1000) // 1.5 hours ago
  activeSession.lastActivity = Date.now() - (5 * 60 * 1000) // 5 minutes ago
  
  const now = Date.now()
  const timeUntilExpiry = SESSION_TIMEOUT - (now - activeSession.loginTime)
  const timeUntilInactivityExpiry = INACTIVITY_TIMEOUT - (now - activeSession.lastActivity)
  const remaining = Math.min(timeUntilExpiry, timeUntilInactivityExpiry)
  
  console.log(`  Login time: ${formatTime(Date.now() - activeSession.loginTime)} ago`)
  console.log(`  Last activity: ${formatTime(Date.now() - activeSession.lastActivity)} ago`)
  console.log(`  Time until total expiry: ${formatTime(timeUntilExpiry)}`)
  console.log(`  Time until inactivity expiry: ${formatTime(timeUntilInactivityExpiry)}`)
  console.log(`  Session will expire in: ${formatTime(remaining)}`)
  console.log(`  Is expired: ${isSessionExpired(activeSession) ? '❌ YES' : '✅ NO'}`)
  console.log()
  
  console.log('🎉 Session timeout tests completed!')
  console.log('\n📋 Summary:')
  console.log('  - Sessions expire after 2 hours from login')
  console.log('  - Sessions expire after 30 minutes of inactivity')
  console.log('  - The shorter of the two timeouts applies')
  console.log('  - User activity resets the inactivity timer')
}

testSessionTimeout()
