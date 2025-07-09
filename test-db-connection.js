const { Pool } = require('pg');

console.log('Starting database connection test...');

// Database configuration
const dbConfig = {
  connectionString: 'postgresql://neondb_owner:npg_ZECD6jcfR1IH@ep-cold-fog-a1hflkb0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: {
    rejectUnauthorized: false
  }
};

console.log('Database config created');

// Create a connection pool
const pool = new Pool(dbConfig);

console.log('Pool created');

async function testConnection() {
  console.log('🔄 Testing database connection...');

  try {
    // Test connection
    console.log('Attempting to connect...');
    const client = await pool.connect();
    console.log('✅ Successfully connected to database!');

    // Test basic query
    console.log('Running test query...');
    const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
    console.log('📊 Query result:');
    console.log('   Current time:', result.rows[0].current_time);
    console.log('   PostgreSQL version:', result.rows[0].postgres_version.substring(0, 50) + '...');

    // Test getting tables
    console.log('Getting tables...');
    const tablesResult = await client.query(`
      SELECT table_name, table_schema
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('📋 Tables in public schema:');
    if (tablesResult.rows.length === 0) {
      console.log('   No tables found in public schema');
    } else {
      tablesResult.rows.forEach(row => {
        console.log(`   - ${row.table_name} (schema: ${row.table_schema})`);
      });
    }

    // Release the client
    client.release();
    console.log('Client released');

    console.log('🎉 Database connection test completed successfully!');

  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('   Error:', error.message);
    if (error.code) console.error('   Code:', error.code);
    if (error.detail) console.error('   Detail:', error.detail);
  } finally {
    // Close the pool
    console.log('Closing pool...');
    await pool.end();
    console.log('🔒 Database pool closed');
  }
}

console.log('About to run test...');
// Run the test
testConnection().then(() => {
  console.log('Test function completed');
}).catch(err => {
  console.error('Test function error:', err);
});
