const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_ZECD6jcfR1IH@ep-cold-fog-a1hflkb0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: { rejectUnauthorized: false }
});

async function testLoginHistory() {
  try {
    console.log('🧪 Testing login history functionality...');
    const client = await pool.connect();
    
    // Check if log_user_login table exists and has data
    console.log('\n📋 Checking log_user_login table...');
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'log_user_login'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ log_user_login table does not exist!');
      client.release();
      await pool.end();
      return;
    }
    
    console.log('✅ log_user_login table exists');
    
    // Get table structure
    console.log('\n📋 Table structure:');
    const structure = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'log_user_login' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    structure.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Count total records
    const countResult = await client.query('SELECT COUNT(*) as total FROM log_user_login');
    console.log(`\n📊 Total login history records: ${countResult.rows[0].total}`);
    
    // Show recent login attempts
    console.log('\n📈 Recent login attempts:');
    const recentLogins = await client.query(`
      SELECT 
        id,
        username,
        login_attempt_time,
        login_status,
        failure_reason,
        ip_address,
        session_id
      FROM log_user_login 
      ORDER BY login_attempt_time DESC 
      LIMIT 10
    `);
    
    if (recentLogins.rows.length === 0) {
      console.log('  No login history records found');
    } else {
      recentLogins.rows.forEach(record => {
        const time = new Date(record.login_attempt_time).toLocaleString();
        console.log(`  ${record.id}: ${record.username} | ${time} | ${record.login_status} | ${record.failure_reason || 'N/A'}`);
      });
    }
    
    // Show login statistics
    console.log('\n📊 Login statistics:');
    const stats = await client.query(`
      SELECT 
        login_status,
        COUNT(*) as count,
        COUNT(DISTINCT username) as unique_users
      FROM log_user_login 
      GROUP BY login_status
      ORDER BY login_status
    `);
    
    if (stats.rows.length === 0) {
      console.log('  No statistics available');
    } else {
      stats.rows.forEach(stat => {
        console.log(`  ${stat.login_status}: ${stat.count} attempts (${stat.unique_users} unique users)`);
      });
    }
    
    // Test inserting a new login record
    console.log('\n🧪 Testing login history insertion...');
    const testUser = await client.query('SELECT id, username FROM m_user LIMIT 1');
    
    if (testUser.rows.length > 0) {
      const user = testUser.rows[0];
      const sessionId = `test_session_${Date.now()}`;
      
      // Insert a test successful login
      await client.query(`
        INSERT INTO log_user_login (user_id, username, login_status, ip_address, user_agent, session_id)
        VALUES ($1, $2, 'SUCCESS', '127.0.0.1', 'Test Script', $3)
      `, [user.id, user.username, sessionId]);
      
      console.log(`✅ Successfully inserted test login record for user: ${user.username}`);
      
      // Verify the insertion
      const verifyResult = await client.query(`
        SELECT * FROM log_user_login 
        WHERE session_id = $1
      `, [sessionId]);
      
      if (verifyResult.rows.length > 0) {
        console.log('✅ Test record verified in database');
        const record = verifyResult.rows[0];
        console.log(`   ID: ${record.id}, User: ${record.username}, Status: ${record.login_status}, Time: ${record.login_attempt_time}`);
      } else {
        console.log('❌ Test record not found in database');
      }
    } else {
      console.log('⚠️  No users found in m_user table for testing');
    }
    
    // Test the new IPC handler functions (simulate what the app would do)
    console.log('\n🔧 Testing login history queries...');
    
    // Test getting login history for a specific user
    const userHistory = await client.query(`
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
      LIMIT 5
    `, ['admin']);
    
    console.log(`📋 Login history for 'admin' user (${userHistory.rows.length} records):`);
    userHistory.rows.forEach(record => {
      const time = new Date(record.login_attempt_time).toLocaleString();
      console.log(`  ${record.login_status} | ${time} | ${record.failure_reason || 'N/A'}`);
    });
    
    // Test getting all login history with pagination
    const allHistory = await client.query(`
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
      LIMIT 5 OFFSET 0
    `);
    
    console.log(`\n📋 All login history (first 5 records):`);
    allHistory.rows.forEach(record => {
      const time = new Date(record.login_attempt_time).toLocaleString();
      console.log(`  ${record.username} | ${record.login_status} | ${time}`);
    });
    
    // Test getting login statistics
    const loginStats = await client.query(`
      SELECT 
        login_status,
        COUNT(*) as count,
        COUNT(DISTINCT username) as unique_users
      FROM log_user_login 
      WHERE login_attempt_time >= NOW() - INTERVAL '30 days'
      GROUP BY login_status
      ORDER BY login_status
    `);
    
    console.log(`\n📊 Login statistics (last 30 days):`);
    loginStats.rows.forEach(stat => {
      console.log(`  ${stat.login_status}: ${stat.count} attempts, ${stat.unique_users} unique users`);
    });
    
    client.release();
    await pool.end();
    console.log('\n🎉 Login history testing completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing login history:', error.message);
    await pool.end();
  }
}

testLoginHistory();
