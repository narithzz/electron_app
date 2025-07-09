const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_ZECD6jcfR1IH@ep-cold-fog-a1hflkb0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: { rejectUnauthorized: false }
});

async function addLockoutColumns() {
  try {
    console.log('🔒 Adding lockout columns to m_user table...');
    const client = await pool.connect();
    
    // Check if columns already exist
    const existingColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'm_user' AND table_schema = 'public'
      AND column_name IN ('failed_login_attempts', 'locked_until', 'last_failed_login')
    `);
    
    const existingColumnNames = existingColumns.rows.map(row => row.column_name);
    console.log('Existing lockout columns:', existingColumnNames);
    
    // Add failed_login_attempts column if it doesn't exist
    if (!existingColumnNames.includes('failed_login_attempts')) {
      await client.query(`
        ALTER TABLE m_user 
        ADD COLUMN failed_login_attempts INTEGER DEFAULT 0 NOT NULL
      `);
      console.log('✅ Added failed_login_attempts column');
    } else {
      console.log('⚠️  failed_login_attempts column already exists');
    }
    
    // Add locked_until column if it doesn't exist
    if (!existingColumnNames.includes('locked_until')) {
      await client.query(`
        ALTER TABLE m_user 
        ADD COLUMN locked_until TIMESTAMP WITHOUT TIME ZONE
      `);
      console.log('✅ Added locked_until column');
    } else {
      console.log('⚠️  locked_until column already exists');
    }
    
    // Add last_failed_login column if it doesn't exist
    if (!existingColumnNames.includes('last_failed_login')) {
      await client.query(`
        ALTER TABLE m_user 
        ADD COLUMN last_failed_login TIMESTAMP WITHOUT TIME ZONE
      `);
      console.log('✅ Added last_failed_login column');
    } else {
      console.log('⚠️  last_failed_login column already exists');
    }
    
    // Show updated table structure
    console.log('\n📋 Updated table structure:');
    const structure = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'm_user' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    structure.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}) ${row.column_default ? `default: ${row.column_default}` : ''}`);
    });
    
    // Show sample data with new columns
    console.log('\n📊 Sample data with new columns:');
    const data = await client.query('SELECT id, username, failed_login_attempts, locked_until, last_failed_login FROM m_user LIMIT 3');
    console.log(data.rows);
    
    client.release();
    await pool.end();
    console.log('\n🎉 Lockout columns added successfully!');
    
  } catch (error) {
    console.error('❌ Error adding lockout columns:', error.message);
    await pool.end();
  }
}

addLockoutColumns();
