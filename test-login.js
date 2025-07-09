const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_ZECD6jcfR1IH@ep-cold-fog-a1hflkb0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: { rejectUnauthorized: false }
});

async function testLogin() {
  try {
    console.log('🔐 Testing login functionality...');
    const client = await pool.connect();
    
    // Test valid credentials
    console.log('\n✅ Testing valid credentials (admin/admin123):');
    const validResult = await client.query(
      'SELECT id, username, created_at FROM m_user WHERE username = $1 AND password = $2',
      ['admin', 'admin123']
    );
    
    if (validResult.rows.length > 0) {
      console.log('   ✅ Login successful!');
      console.log('   User:', validResult.rows[0]);
    } else {
      console.log('   ❌ Login failed - no user found');
    }
    
    // Test invalid credentials
    console.log('\n❌ Testing invalid credentials (admin/wrongpassword):');
    const invalidResult = await client.query(
      'SELECT id, username, created_at FROM m_user WHERE username = $1 AND password = $2',
      ['admin', 'wrongpassword']
    );
    
    if (invalidResult.rows.length > 0) {
      console.log('   ❌ This should not happen - invalid login succeeded!');
    } else {
      console.log('   ✅ Login correctly failed for invalid credentials');
    }
    
    // Test non-existent user
    console.log('\n❌ Testing non-existent user (nonexistent/password):');
    const nonExistentResult = await client.query(
      'SELECT id, username, created_at FROM m_user WHERE username = $1 AND password = $2',
      ['nonexistent', 'password']
    );
    
    if (nonExistentResult.rows.length > 0) {
      console.log('   ❌ This should not happen - non-existent user login succeeded!');
    } else {
      console.log('   ✅ Login correctly failed for non-existent user');
    }
    
    client.release();
    await pool.end();
    console.log('\n🎉 Login functionality test completed!');
    
  } catch (error) {
    console.error('❌ Error testing login:', error.message);
    await pool.end();
  }
}

testLogin();
