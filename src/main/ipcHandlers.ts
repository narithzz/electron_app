import axios from 'axios';
import { ipcMain } from 'electron';
import { Pool } from 'pg';

interface Todo {
  userId: number;
  id: number;
  title: string;
  completed: boolean;
}

// Database configuration
const dbConfig = {
  connectionString: 'postgresql://neondb_owner:npg_ZECD6jcfR1IH@ep-cold-fog-a1hflkb0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: {
    rejectUnauthorized: false
  }
};

// Create a connection pool
const pool = new Pool(dbConfig);

export function setupIpcHandlers() {
  console.log('Setting up IPC handlers...');

  // Test database connection
  ipcMain.handle('test-db-connection', async () => {
    try {
      console.log('Testing database connection...');
      const client = await pool.connect();

      // Test with a simple query
      const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
      client.release();

      console.log('Database connection successful!');
      return {
        success: true,
        message: 'Database connection successful',
        data: result.rows[0]
      };
    } catch (error) {
      console.error('Database connection failed:', error);
      return {
        success: false,
        message: 'Database connection failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  // Execute custom SQL queries
  ipcMain.handle('execute-query', async (event, query: string, params: any[] = []) => {
    try {
      console.log('Executing query:', query);
      const client = await pool.connect();
      const result = await client.query(query, params);
      client.release();

      return {
        success: true,
        data: result.rows,
        rowCount: result.rowCount
      };
    } catch (error) {
      console.error('Query execution failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  // Get database tables
  ipcMain.handle('get-tables', async () => {
    try {
      console.log('Fetching database tables...');
      const client = await pool.connect();
      const result = await client.query(`
        SELECT table_name, table_schema
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name
      `);
      client.release();

      return {
        success: true,
        data: result.rows
      };
    } catch (error) {
      console.error('Failed to fetch tables:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  // Helper function to log login attempts
  const logLoginAttempt = async (client: any, userId: number | null, username: string, status: 'SUCCESS' | 'FAILED' | 'LOCKED', failureReason?: string, sessionId?: string) => {
    try {
      await client.query(`
        INSERT INTO log_user_login (user_id, username, login_status, failure_reason, ip_address, user_agent, session_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [userId, username, status, failureReason || null, '127.0.0.1', 'Electron Desktop App', sessionId || null]);
      console.log(`Login attempt logged: ${username} - ${status}`);
    } catch (logError) {
      console.error('Failed to log login attempt:', logError);
      // Don't throw error here to avoid breaking the login flow
    }
  };

  // User authentication with lockout protection
  ipcMain.handle('login', async (event, username: string, password: string) => {
    try {
      console.log('Login attempt for username:', username);
      const client = await pool.connect();

      // First, check if user exists and get lockout status
      const userCheck = await client.query(
        'SELECT id, username, password, created_at, failed_login_attempts, locked_until, last_failed_login FROM m_user WHERE username = $1',
        [username]
      );

      if (userCheck.rows.length === 0) {
        // Log failed login attempt for non-existent user
        await logLoginAttempt(client, null, username, 'FAILED', 'User not found');
        client.release();
        console.log('Login failed: User not found');
        return {
          success: false,
          message: 'Invalid username or password'
        };
      }

      const user = userCheck.rows[0];
      const now = new Date();

      // Check if account is currently locked
      if (user.locked_until && new Date(user.locked_until) > now) {
        const lockoutEndTime = new Date(user.locked_until);
        const remainingMinutes = Math.ceil((lockoutEndTime.getTime() - now.getTime()) / (60 * 1000));

        // Log locked account login attempt
        await logLoginAttempt(client, user.id, username, 'LOCKED', `Account locked until ${lockoutEndTime.toISOString()}`);

        client.release();
        console.log(`Login failed: Account locked for user ${username}. Unlocks in ${remainingMinutes} minutes`);
        return {
          success: false,
          message: `Account is locked due to multiple failed login attempts. Please try again in ${remainingMinutes} minute(s).`,
          isLocked: true,
          lockoutEndTime: lockoutEndTime.toISOString()
        };
      }

      // Check password
      if (user.password === password) {
        // Generate session ID for successful login
        const sessionId = `session_${user.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Successful login - reset failed attempts
        await client.query(
          'UPDATE m_user SET failed_login_attempts = 0, locked_until = NULL, last_failed_login = NULL WHERE id = $1',
          [user.id]
        );

        // Log successful login
        await logLoginAttempt(client, user.id, username, 'SUCCESS', null, sessionId);

        client.release();
        console.log('Login successful for user:', user.username);
        return {
          success: true,
          message: 'Login successful',
          user: {
            id: user.id,
            username: user.username,
            created_at: user.created_at
          }
        };
      } else {
        // Failed login - increment failed attempts
        const newFailedAttempts = user.failed_login_attempts + 1;
        const maxAttempts = 3;
        const lockoutDurationMinutes = 15; // 15 minutes lockout

        if (newFailedAttempts >= maxAttempts) {
          // Lock the account
          const lockoutEndTime = new Date(now.getTime() + (lockoutDurationMinutes * 60 * 1000));

          await client.query(
            'UPDATE m_user SET failed_login_attempts = $1, locked_until = $2, last_failed_login = $3 WHERE id = $4',
            [newFailedAttempts, lockoutEndTime, now, user.id]
          );

          // Log failed login that resulted in account lockout
          await logLoginAttempt(client, user.id, username, 'FAILED', `Invalid password - Account locked after ${maxAttempts} failed attempts`);

          client.release();
          console.log(`Account locked for user ${username} after ${maxAttempts} failed attempts`);
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

          // Log failed login attempt
          const remainingAttempts = maxAttempts - newFailedAttempts;
          await logLoginAttempt(client, user.id, username, 'FAILED', `Invalid password - ${remainingAttempts} attempts remaining`);

          client.release();
          console.log(`Login failed for user ${username}. ${newFailedAttempts}/${maxAttempts} failed attempts. ${remainingAttempts} attempts remaining.`);
          return {
            success: false,
            message: `Invalid username or password. ${remainingAttempts} attempt(s) remaining before account lockout.`,
            failedAttempts: newFailedAttempts,
            remainingAttempts: remainingAttempts
          };
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Login failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  // Get user profile
  ipcMain.handle('get-user-profile', async (event, userId: number) => {
    try {
      console.log('Fetching user profile for ID:', userId);
      const client = await pool.connect();

      const result = await client.query(
        'SELECT id, username, created_at FROM m_user WHERE id = $1',
        [userId]
      );

      client.release();

      if (result.rows.length > 0) {
        return {
          success: true,
          user: result.rows[0]
        };
      } else {
        return {
          success: false,
          message: 'User not found'
        };
      }
    } catch (error) {
      console.error('Get user profile error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  // Check account lockout status
  ipcMain.handle('check-account-status', async (event, username: string) => {
    try {
      console.log('Checking account status for username:', username);
      const client = await pool.connect();

      const result = await client.query(
        'SELECT username, failed_login_attempts, locked_until, last_failed_login FROM m_user WHERE username = $1',
        [username]
      );

      client.release();

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
        return {
          success: false,
          message: 'User not found'
        };
      }
    } catch (error) {
      console.error('Check account status error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  // Unlock user account (admin function)
  ipcMain.handle('unlock-account', async (event, username: string) => {
    try {
      console.log('Unlocking account for username:', username);
      const client = await pool.connect();

      const result = await client.query(
        'UPDATE m_user SET failed_login_attempts = 0, locked_until = NULL, last_failed_login = NULL WHERE username = $1 RETURNING username',
        [username]
      );

      client.release();

      if (result.rows.length > 0) {
        console.log(`Account unlocked for user: ${username}`);
        return {
          success: true,
          message: `Account unlocked successfully for user: ${username}`
        };
      } else {
        return {
          success: false,
          message: 'User not found'
        };
      }
    } catch (error) {
      console.error('Unlock account error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  // Get login history for a specific user
  ipcMain.handle('get-user-login-history', async (event, username: string, limit: number = 50) => {
    try {
      console.log('Getting login history for username:', username);
      const client = await pool.connect();

      const result = await client.query(`
        SELECT
          id,
          username,
          login_attempt_time,
          login_status,
          failure_reason,
          ip_address,
          user_agent,
          session_id,
          created_at
        FROM log_user_login
        WHERE username = $1
        ORDER BY login_attempt_time DESC
        LIMIT $2
      `, [username, limit]);

      client.release();

      return {
        success: true,
        data: result.rows,
        message: `Found ${result.rows.length} login history records for user: ${username}`
      };
    } catch (error) {
      console.error('Get login history error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  // Get all login history (admin function)
  ipcMain.handle('get-all-login-history', async (event, limit: number = 100, offset: number = 0) => {
    try {
      console.log('Getting all login history, limit:', limit, 'offset:', offset);
      const client = await pool.connect();

      const result = await client.query(`
        SELECT
          l.id,
          l.username,
          l.login_attempt_time,
          l.login_status,
          l.failure_reason,
          l.ip_address,
          l.user_agent,
          l.session_id,
          l.created_at,
          u.id as user_id
        FROM log_user_login l
        LEFT JOIN m_user u ON l.username = u.username
        ORDER BY l.login_attempt_time DESC
        LIMIT $1 OFFSET $2
      `, [limit, offset]);

      // Get total count for pagination
      const countResult = await client.query('SELECT COUNT(*) as total FROM log_user_login');

      client.release();

      return {
        success: true,
        data: result.rows,
        total: parseInt(countResult.rows[0].total),
        limit: limit,
        offset: offset,
        message: `Retrieved ${result.rows.length} login history records`
      };
    } catch (error) {
      console.error('Get all login history error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  // Get login statistics
  ipcMain.handle('get-login-statistics', async (event, days: number = 30) => {
    try {
      console.log('Getting login statistics for last', days, 'days');
      const client = await pool.connect();

      // Get statistics for the specified period
      const statsResult = await client.query(`
        SELECT
          login_status,
          COUNT(*) as count,
          COUNT(DISTINCT username) as unique_users
        FROM log_user_login
        WHERE login_attempt_time >= NOW() - INTERVAL '${days} days'
        GROUP BY login_status
        ORDER BY login_status
      `);

      // Get daily login counts
      const dailyResult = await client.query(`
        SELECT
          DATE(login_attempt_time) as login_date,
          login_status,
          COUNT(*) as count
        FROM log_user_login
        WHERE login_attempt_time >= NOW() - INTERVAL '${days} days'
        GROUP BY DATE(login_attempt_time), login_status
        ORDER BY login_date DESC, login_status
      `);

      // Get most active users
      const activeUsersResult = await client.query(`
        SELECT
          username,
          COUNT(*) as total_attempts,
          COUNT(CASE WHEN login_status = 'SUCCESS' THEN 1 END) as successful_logins,
          COUNT(CASE WHEN login_status = 'FAILED' THEN 1 END) as failed_logins,
          MAX(login_attempt_time) as last_login_attempt
        FROM log_user_login
        WHERE login_attempt_time >= NOW() - INTERVAL '${days} days'
        GROUP BY username
        ORDER BY total_attempts DESC
        LIMIT 10
      `);

      client.release();

      return {
        success: true,
        data: {
          summary: statsResult.rows,
          daily: dailyResult.rows,
          activeUsers: activeUsersResult.rows,
          period: days
        },
        message: `Login statistics for the last ${days} days`
      };
    } catch (error) {
      console.error('Get login statistics error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  ipcMain.handle('fetch-data', async () => {
    try {
      console.log('fetch-data handler called');
      const response = await axios.get<Todo[]>('https://jsonplaceholder.typicode.com/todos');
      console.log('API response received, data length:', response.data.length);
      return response.data;
    } catch (error) {
      console.error('Error fetching todos:', error);
      throw error;
    }
  });

  console.log('IPC handlers setup complete');
}

// Cleanup function to close database connections
export async function cleanupDatabase() {
  try {
    await pool.end();
    console.log('Database pool closed successfully');
  } catch (error) {
    console.error('Error closing database pool:', error);
  }
}