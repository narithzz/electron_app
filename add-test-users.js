const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_ZECD6jcfR1IH@ep-cold-fog-a1hflkb0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: { rejectUnauthorized: false }
});

async function addTestUsers() {
  try {
    console.log('👥 Adding test users to the database...');
    const client = await pool.connect();
    
    // Test users to add
    const testUsers = [
      { username: 'user1', password: 'password123' },
      { username: 'demo', password: 'demo123' },
      { username: 'test', password: 'test123' }
    ];
    
    for (const user of testUsers) {
      try {
        // Check if user already exists
        const existingUser = await client.query(
          'SELECT username FROM m_user WHERE username = $1',
          [user.username]
        );
        
        if (existingUser.rows.length > 0) {
          console.log(`   ⚠️  User '${user.username}' already exists, skipping...`);
          continue;
        }
        
        // Insert new user
        const result = await client.query(
          'INSERT INTO m_user (username, password, created_at) VALUES ($1, $2, NOW()) RETURNING id, username, created_at',
          [user.username, user.password]
        );
        
        console.log(`   ✅ Added user '${user.username}' with ID ${result.rows[0].id}`);
        
      } catch (error) {
        console.error(`   ❌ Failed to add user '${user.username}':`, error.message);
      }
    }
    
    // Show all users
    console.log('\n📋 All users in the database:');
    const allUsers = await client.query('SELECT id, username, created_at FROM m_user ORDER BY id');
    allUsers.rows.forEach(user => {
      console.log(`   ID: ${user.id}, Username: ${user.username}, Created: ${user.created_at.toISOString().split('T')[0]}`);
    });
    
    client.release();
    await pool.end();
    console.log('\n🎉 Test users setup completed!');
    
  } catch (error) {
    console.error('❌ Error adding test users:', error.message);
    await pool.end();
  }
}

addTestUsers();
