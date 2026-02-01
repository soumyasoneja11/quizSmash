// reset-db.js
const { pool } = require('./database');

async function resetDatabase() {
  console.log('⚠️  Resetting QuizSmash database...');
  
  // Disable foreign key checks temporarily
  await pool.query('SET session_replication_role = replica;');
  
  try {
    // Drop all tables in correct order (due to foreign keys)
    const tables = [
      'answers',
      'questions', 
      'players',
      'rooms',
      'categories',
      'users'
    ];
    
    for (const table of tables) {
      try {
        await pool.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
        console.log(`✅ Dropped table: ${table}`);
      } catch (error) {
        console.log(`⚠️  Could not drop ${table}: ${error.message}`);
      }
    }
    
    // Re-enable foreign key checks
    await pool.query('SET session_replication_role = DEFAULT;');
    
    console.log('✅ Database reset complete');
    console.log('🔄 Reinitializing database...');
    
    // Reinitialize
    const { initializeDatabase } = require('./database');
    await initializeDatabase();
    
    console.log('🎉 Database reset and reinitialized successfully!');
    
  } catch (error) {
    console.error('❌ Reset failed:', error.message);
    // Make sure to re-enable foreign key checks even on error
    await pool.query('SET session_replication_role = DEFAULT;').catch(() => {});
  }
}

// Run reset if called directly
if (require.main === module) {
  resetDatabase().then(() => {
    process.exit(0);
  }).catch(error => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = { resetDatabase };