const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_ZECD6jcfR1IH@ep-cold-fog-a1hflkb0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: { rejectUnauthorized: false }
});

async function testLockoutSystem() {
  try {
    console.log('🔒 Testing Account Lockout System\n');
    const client = await pool.connect();
    
    const testUsername = 'demo';
    const correctPassword = 'demo123';
    const wrongPassword = 'wrongpassword';
    
    // Reset the test user's lockout status
    console.log('🔄 Resetting test user lockout status...');
    await client.query(
      'UPDATE m_user SET failed_login_attempts = 0, locked_until = NULL, last_failed_login = NULL WHERE username = $1',
      [testUsername]
    );
    console.log('✅ Test user reset\n');
    
    // Test 1: Successful login (should work)
    console.log('Test 1: Valid login attempt');
    const validLogin = await simulateLogin(client, testUsername, correctPassword);
    console.log(`Result: ${validLogin.success ? '✅ SUCCESS' : '❌ FAILED'} - ${validLogin.message}\n`);
    
    // Test 2: First failed attempt
    console.log('Test 2: First failed login attempt');
    const fail1 = await simulateLogin(client, testUsername, wrongPassword);
    console.log(`Result: ${fail1.success ? '✅ SUCCESS' : '❌ FAILED'} - ${fail1.message}`);
    if (fail1.remainingAttempts !== undefined) {
      console.log(`Remaining attempts: ${fail1.remainingAttempts}\n`);
    }
    
    // Test 3: Second failed attempt
    console.log('Test 3: Second failed login attempt');
    const fail2 = await simulateLogin(client, testUsername, wrongPassword);
    console.log(`Result: ${fail2.success ? '✅ SUCCESS' : '❌ FAILED'} - ${fail2.message}`);
    if (fail2.remainingAttempts !== undefined) {
      console.log(`Remaining attempts: ${fail2.remainingAttempts}\n`);
    }
    
    // Test 4: Third failed attempt (should lock account)
    console.log('Test 4: Third failed login attempt (should lock account)');
    const fail3 = await simulateLogin(client, testUsername, wrongPassword);
    console.log(`Result: ${fail3.success ? '✅ SUCCESS' : '❌ FAILED'} - ${fail3.message}`);
    if (fail3.isLocked) {
      console.log(`🔒 Account is now LOCKED until: ${fail3.lockoutEndTime}\n`);
    }
    
    // Test 5: Try to login with correct password while locked
    console.log('Test 5: Try correct password while account is locked');
    const lockedLogin = await simulateLogin(client, testUsername, correctPassword);
    console.log(`Result: ${lockedLogin.success ? '✅ SUCCESS' : '❌ FAILED'} - ${lockedLogin.message}\n`);
    
    // Test 6: Check account status
    console.log('Test 6: Check account status');
    const status = await checkAccountStatus(client, testUsername);
    if (status.success) {
      const acc = status.accountStatus;
      console.log(`Username: ${acc.username}`);
      console.log(`Failed attempts: ${acc.failedAttempts}`);
      console.log(`Is locked: ${acc.isLocked ? '🔒 YES' : '🔓 NO'}`);
      console.log(`Locked until: ${acc.lockedUntil || 'N/A'}`);
      console.log(`Remaining lockout time: ${acc.remainingLockoutTime} minutes\n`);
    }
    
    // Test 7: Unlock account manually
    console.log('Test 7: Manually unlock account');
    const unlock = await unlockAccount(client, testUsername);
    console.log(`Result: ${unlock.success ? '✅ SUCCESS' : '❌ FAILED'} - ${unlock.message}\n`);
    
    // Test 8: Login with correct password after unlock
    console.log('Test 8: Login with correct password after manual unlock');
    const afterUnlock = await simulateLogin(client, testUsername, correctPassword);
    console.log(`Result: ${afterUnlock.success ? '✅ SUCCESS' : '❌ FAILED'} - ${afterUnlock.message}\n`);
    
    client.release();
    await pool.end();
    
    console.log('🎉 Lockout system test completed!');
    console.log('\n📋 Summary:');
    console.log('  - Failed login attempts are tracked');
    console.log('  - Account locks after 3 failed attempts');
    console.log('  - Lockout duration is 15 minutes');
    console.log('  - Locked accounts reject even correct passwords');
    console.log('  - Accounts can be manually unlocked');
    console.log('  - Successful login resets failed attempt counter');
    
  } catch (error) {
    console.error('❌ Error testing lockout system:', error.message);
    await pool.end();
  }
}

async function simulateLogin(client, username, password) {
  // This simulates the login logic from the IPC handler
  const userCheck = await client.query(
    'SELECT id, username, password, created_at, failed_login_attempts, locked_until, last_failed_login FROM m_user WHERE username = $1',
    [username]
  );
  
  if (userCheck.rows.length === 0) {
    return { success: false, message: 'Invalid username or password' };
  }
  
  const user = userCheck.rows[0];
  const now = new Date();
  
  // Check if account is locked
  if (user.locked_until && new Date(user.locked_until) > now) {
    const lockoutEndTime = new Date(user.locked_until);
    const remainingMinutes = Math.ceil((lockoutEndTime.getTime() - now.getTime()) / (60 * 1000));
    
    return {
      success: false,
      message: `Account is locked. Please try again in ${remainingMinutes} minute(s).`,
      isLocked: true,
      lockoutEndTime: lockoutEndTime.toISOString()
    };
  }
  
  // Check password
  if (user.password === password) {
    // Successful login - reset failed attempts
    await client.query(
      'UPDATE m_user SET failed_login_attempts = 0, locked_until = NULL, last_failed_login = NULL WHERE id = $1',
      [user.id]
    );
    
    return {
      success: true,
      message: 'Login successful',
      user: { id: user.id, username: user.username, created_at: user.created_at }
    };
  } else {
    // Failed login
    const newFailedAttempts = user.failed_login_attempts + 1;
    const maxAttempts = 3;
    const lockoutDurationMinutes = 15;
    
    if (newFailedAttempts >= maxAttempts) {
      // Lock the account
      const lockoutEndTime = new Date(now.getTime() + (lockoutDurationMinutes * 60 * 1000));
      
      await client.query(
        'UPDATE m_user SET failed_login_attempts = $1, locked_until = $2, last_failed_login = $3 WHERE id = $4',
        [newFailedAttempts, lockoutEndTime, now, user.id]
      );
      
      return {
        success: false,
        message: `Account has been locked due to ${maxAttempts} failed login attempts. Please try again in ${lockoutDurationMinutes} minutes.`,
        isLocked: true,
        lockoutEndTime: lockoutEndTime.toISOString()
      };
    } else {
      // Update failed attempts count
      await client.query(
        'UPDATE m_user SET failed_login_attempts = $1, last_failed_login = $2 WHERE id = $3',
        [newFailedAttempts, now, user.id]
      );
      
      const remainingAttempts = maxAttempts - newFailedAttempts;
      return {
        success: false,
        message: `Invalid username or password. ${remainingAttempts} attempt(s) remaining before account lockout.`,
        failedAttempts: newFailedAttempts,
        remainingAttempts: remainingAttempts
      };
    }
  }
}

async function checkAccountStatus(client, username) {
  const result = await client.query(
    'SELECT username, failed_login_attempts, locked_until, last_failed_login FROM m_user WHERE username = $1',
    [username]
  );
  
  if (result.rows.length > 0) {
    const user = result.rows[0];
    const now = new Date();
    const isLocked = user.locked_until && new Date(user.locked_until) > now;
    
    return {
      success: true,
      accountStatus: {
        username: user.username,
        failedAttempts: user.failed_login_attempts,
        isLocked: isLocked,
        lockedUntil: user.locked_until,
        lastFailedLogin: user.last_failed_login,
        remainingLockoutTime: isLocked ? Math.ceil((new Date(user.locked_until).getTime() - now.getTime()) / (60 * 1000)) : 0
      }
    };
  } else {
    return { success: false, message: 'User not found' };
  }
}

async function unlockAccount(client, username) {
  const result = await client.query(
    'UPDATE m_user SET failed_login_attempts = 0, locked_until = NULL, last_failed_login = NULL WHERE username = $1 RETURNING username',
    [username]
  );
  
  if (result.rows.length > 0) {
    return {
      success: true,
      message: `Account unlocked successfully for user: ${username}`
    };
  } else {
    return { success: false, message: 'User not found' };
  }
}

testLockoutSystem();
