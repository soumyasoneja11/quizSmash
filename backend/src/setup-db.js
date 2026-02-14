// setup-db.js - Run this once to setup the database
const { Pool } = require('pg');
require('dotenv').config();

const adminPool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: 'postgres', // Connect to default database
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function setupDatabase() {
  let client;
  try {
    console.log('🚀 Setting up QuizSmash PostgreSQL database...');
    
    client = await adminPool.connect();
    
    // Check if database exists
    const dbCheck = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [process.env.DB_NAME || 'quizsmash']
    );
    
    if (dbCheck.rows.length === 0) {
      // Create database
      console.log(`📁 Creating database: ${process.env.DB_NAME || 'quizsmash'}...`);
      await client.query(`CREATE DATABASE ${process.env.DB_NAME || 'quizsmash'}`);
      console.log('✅ Database created');
    } else {
      console.log('✅ Database already exists');
    }
    
    // Now connect to the new database and run initialization
    const appPool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'quizsmash',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    });
    
    const appClient = await appPool.connect();
    
    // Run initialization from database.js
    const { initializeDatabase } = require('./database');
    await initializeDatabase();
    
    appClient.release();
    console.log('🎉 Database setup complete!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    if (client) client.release();
    process.exit(0);
  }
}

setupDatabase();