const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_ZECD6jcfR1IH@ep-cold-fog-a1hflkb0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: { rejectUnauthorized: false }
});

async function unlockAdmin() {
  try {
    console.log('🔓 Unlocking admin account...');
    const client = await pool.connect();
    
    // Unlock admin account
    const result = await client.query(
      'UPDATE m_user SET failed_login_attempts = 0, locked_until = NULL, last_failed_login = NULL WHERE username = $1 RETURNING username, failed_login_attempts, locked_until',
      ['admin']
    );
    
    if (result.rows.length > 0) {
      console.log('✅ Admin account unlocked successfully!');
      console.log('Account status:', result.rows[0]);
    } else {
      console.log('❌ Admin account not found');
    }
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.error('❌ Error unlocking admin account:', error.message);
    await pool.end();
  }
}

unlockAdmin();
