const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_ZECD6jcfR1IH@ep-cold-fog-a1hflkb0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: { rejectUnauthorized: false }
});

async function createLoginHistoryTable() {
  try {
    console.log('📋 Creating log_user_login table for login history tracking...');
    const client = await pool.connect();
    
    // Check if table already exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'log_user_login'
      );
    `);
    
    if (tableExists.rows[0].exists) {
      console.log('⚠️  log_user_login table already exists');
      
      // Show existing table structure
      console.log('\n📋 Existing table structure:');
      const structure = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'log_user_login' AND table_schema = 'public'
        ORDER BY ordinal_position
      `);
      
      structure.rows.forEach(row => {
        console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}) ${row.column_default ? `default: ${row.column_default}` : ''}`);
      });
      
    } else {
      // Create the log_user_login table
      await client.query(`
        CREATE TABLE log_user_login (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES m_user(id) ON DELETE CASCADE,
          username VARCHAR(255) NOT NULL,
          login_attempt_time TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
          login_status VARCHAR(20) NOT NULL CHECK (login_status IN ('SUCCESS', 'FAILED', 'LOCKED')),
          ip_address VARCHAR(45),
          user_agent TEXT,
          failure_reason VARCHAR(255),
          session_id VARCHAR(255),
          created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
        );
      `);
      
      console.log('✅ Created log_user_login table successfully!');
      
      // Create indexes for better performance
      await client.query(`
        CREATE INDEX idx_log_user_login_user_id ON log_user_login(user_id);
      `);
      
      await client.query(`
        CREATE INDEX idx_log_user_login_username ON log_user_login(username);
      `);
      
      await client.query(`
        CREATE INDEX idx_log_user_login_time ON log_user_login(login_attempt_time);
      `);
      
      await client.query(`
        CREATE INDEX idx_log_user_login_status ON log_user_login(login_status);
      `);
      
      console.log('✅ Created indexes for optimal performance');
      
      // Show the created table structure
      console.log('\n📋 Created table structure:');
      const structure = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'log_user_login' AND table_schema = 'public'
        ORDER BY ordinal_position
      `);
      
      structure.rows.forEach(row => {
        console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}) ${row.column_default ? `default: ${row.column_default}` : ''}`);
      });
    }
    
    // Insert some sample data to test the table
    console.log('\n🧪 Testing table with sample data...');
    
    // Get a test user
    const testUser = await client.query('SELECT id, username FROM m_user LIMIT 1');
    
    if (testUser.rows.length > 0) {
      const user = testUser.rows[0];
      
      // Insert a sample successful login
      await client.query(`
        INSERT INTO log_user_login (user_id, username, login_status, ip_address, user_agent, session_id)
        VALUES ($1, $2, 'SUCCESS', '127.0.0.1', 'Electron App', 'test-session-' || extract(epoch from now()))
      `, [user.id, user.username]);
      
      // Insert a sample failed login
      await client.query(`
        INSERT INTO log_user_login (user_id, username, login_status, failure_reason, ip_address, user_agent)
        VALUES ($1, $2, 'FAILED', 'Invalid password', '127.0.0.1', 'Electron App')
      `, [user.id, user.username]);
      
      console.log('✅ Sample data inserted successfully');
      
      // Show sample records
      const sampleData = await client.query(`
        SELECT id, username, login_attempt_time, login_status, failure_reason, ip_address
        FROM log_user_login 
        ORDER BY login_attempt_time DESC 
        LIMIT 5
      `);
      
      console.log('\n📊 Sample login history records:');
      sampleData.rows.forEach(record => {
        console.log(`  ID: ${record.id} | User: ${record.username} | Time: ${record.login_attempt_time.toISOString()} | Status: ${record.login_status} | Reason: ${record.failure_reason || 'N/A'}`);
      });
    }
    
    client.release();
    await pool.end();
    console.log('\n🎉 Login history table setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error creating login history table:', error.message);
    await pool.end();
  }
}

createLoginHistoryTable();
