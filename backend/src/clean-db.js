// clean-db.js - Just drops and recreates without the setup-db complexity
const { resetDatabase } = require('./reset-db');

async function cleanDatabase() {
  console.log('🧹 Cleaning database...');
  
  try {
    await resetDatabase();
    console.log('✅ Database cleaned successfully');
  } catch (error) {
    console.error('❌ Clean failed:', error.message);
  }
}

cleanDatabase().then(() => {
  process.exit(0);
});