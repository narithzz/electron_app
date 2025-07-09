const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_ZECD6jcfR1IH@ep-cold-fog-a1hflkb0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: { rejectUnauthorized: false }
});

async function checkUserTable() {
  try {
    console.log('Checking m_user table structure...');
    const client = await pool.connect();
    
    // Get table structure
    const structure = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'm_user' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Table structure:');
    structure.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Get sample data
    const data = await client.query('SELECT * FROM m_user LIMIT 3');
    console.log('\n📊 Sample data:');
    if (data.rows.length > 0) {
      console.log(data.rows);
    } else {
      console.log('  No data found in table');
    }
    
    // Count total records
    const count = await client.query('SELECT COUNT(*) as total FROM m_user');
    console.log(`\n📈 Total records: ${count.rows[0].total}`);
    
    client.release();
    await pool.end();
    console.log('\n✅ Check completed');
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
  }
}

checkUserTable();
