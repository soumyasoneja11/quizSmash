// test-db.js
const { pool } = require('./database');

async function testDatabase() {
  try {
    console.log('🧪 Testing database connection and tables...');
    
    // Test connection
    const result = await pool.query('SELECT NOW() as time');
    console.log('✅ Connection successful:', result.rows[0].time);
    
    // List all tables
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('📋 Available tables:');
    tables.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    if (tables.rows.length === 0) {
      console.log('⚠️  No tables found. Running initialization...');
      const { initializeDatabase } = require('./database');
      await initializeDatabase();
    }
    
    console.log('✅ Database test complete');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  } finally {
    process.exit(0);
  }
}

testDatabase();