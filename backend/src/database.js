// database.js
const { Pool } = require('pg');
require('dotenv').config();

// PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'quizsmash',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ PostgreSQL connection error:', err.message);
  } else {
    console.log('✅ Connected to PostgreSQL database');
    release();
  }
});

// Helper functions
async function query(sql, params = []) {
  try {
    const result = await pool.query(sql, params);
    return result;
  } catch (error) {
    // Don't log "already exists" errors for table creation
    if (!error.message.includes('already exists') && 
        !error.message.includes('duplicate key')) {
      console.error('Database query error:', error.message);
    }
    throw error;
  }
}

async function run(sql, params = []) {
  const result = await query(sql, params);
  return { 
    lastID: result.rows[0]?.id || 0, 
    changes: result.rowCount 
  };
}

async function get(sql, params = []) {
  const result = await query(sql, params);
  return result.rows[0] || null;
}

async function all(sql, params = []) {
  const result = await query(sql, params);
  return result.rows;
}

// Initialize database with all tables (idempotent)
async function initializeDatabase() {
  try {
    console.log('🔄 Initializing PostgreSQL database...');
    
    // Create tables with IF NOT EXISTS
    const tablesSQL = `
      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE,
        password_hash VARCHAR(255),
        avatar_url TEXT,
        total_score INTEGER DEFAULT 0,
        games_played INTEGER DEFAULT 0,
        games_won INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Rooms table
      CREATE TABLE IF NOT EXISTS rooms (
        id SERIAL PRIMARY KEY,
        code VARCHAR(6) UNIQUE NOT NULL,
        host_socket_id TEXT NOT NULL,
        name VARCHAR(100) DEFAULT 'Quiz Room',
        topic VARCHAR(100),
        category VARCHAR(50) DEFAULT 'general',
        difficulty VARCHAR(20) DEFAULT 'medium',
        max_players INTEGER DEFAULT 4,
        current_players INTEGER DEFAULT 1,
        status VARCHAR(20) DEFAULT 'waiting',
        round_duration INTEGER DEFAULT 20,
        total_rounds INTEGER DEFAULT 3,
        current_round INTEGER DEFAULT 0,
        is_private BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        started_at TIMESTAMP,
        ended_at TIMESTAMP,
        expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '1 hour')
      );

      -- Players table
      CREATE TABLE IF NOT EXISTS players (
        id SERIAL PRIMARY KEY,
        room_id INTEGER NOT NULL,
        socket_id TEXT NOT NULL,
        username VARCHAR(50) NOT NULL,
        avatar_url TEXT,
        score INTEGER DEFAULT 0,
        is_ready BOOLEAN DEFAULT false,
        is_online BOOLEAN DEFAULT true,
        current_streak INTEGER DEFAULT 0,
        highest_streak INTEGER DEFAULT 0,
        correct_answers INTEGER DEFAULT 0,
        total_answers INTEGER DEFAULT 0,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(room_id, socket_id)
      );

      -- Questions table
      CREATE TABLE IF NOT EXISTS questions (
        id SERIAL PRIMARY KEY,
        room_id INTEGER NOT NULL,
        category VARCHAR(50),
        difficulty VARCHAR(20),
        question_text TEXT NOT NULL,
        options JSONB NOT NULL,
        correct_index INTEGER NOT NULL,
        explanation TEXT,
        image_url TEXT,
        round_number INTEGER NOT NULL,
        time_limit INTEGER DEFAULT 20,
        points_base INTEGER DEFAULT 100,
        points_bonus INTEGER DEFAULT 50,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        displayed_at TIMESTAMP
      );

      -- Answers table
      CREATE TABLE IF NOT EXISTS answers (
        id SERIAL PRIMARY KEY,
        player_id INTEGER NOT NULL,
        question_id INTEGER NOT NULL,
        room_id INTEGER NOT NULL,
        selected_index INTEGER,
        is_correct BOOLEAN,
        time_taken DECIMAL(5,2),
        points_earned INTEGER DEFAULT 0,
        speed_bonus BOOLEAN DEFAULT false,
        streak_bonus BOOLEAN DEFAULT false,
        answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Categories table
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        emoji VARCHAR(10),
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Split and execute each table creation separately
    const tableStatements = tablesSQL.split(';').filter(stmt => stmt.trim());
    
    for (const statement of tableStatements) {
      if (statement.trim()) {
        try {
          await query(statement + ';');
        } catch (error) {
          // Ignore "already exists" errors
          if (!error.message.includes('already exists')) {
            console.error('Table creation error:', error.message);
          }
        }
      }
    }

    console.log('✅ Tables created/verified');

    // Add foreign key constraints (if not exists)
    console.log('🔗 Adding foreign key constraints...');
    const fkSQL = `
      DO $$ 
      BEGIN
        -- Check if constraint exists before adding
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_players_room') THEN
          ALTER TABLE players 
          ADD CONSTRAINT fk_players_room 
          FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_questions_room') THEN
          ALTER TABLE questions 
          ADD CONSTRAINT fk_questions_room 
          FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_answers_player') THEN
          ALTER TABLE answers 
          ADD CONSTRAINT fk_answers_player 
          FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_answers_question') THEN
          ALTER TABLE answers 
          ADD CONSTRAINT fk_answers_question 
          FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_answers_room') THEN
          ALTER TABLE answers 
          ADD CONSTRAINT fk_answers_room 
          FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE;
        END IF;
      END $$;
    `;

    try {
      await query(fkSQL);
      console.log('✅ Foreign keys verified');
    } catch (error) {
      console.log('⚠️  Foreign key setup:', error.message);
    }

    // Create indexes
    console.log('📊 Creating indexes...');
    const indexesSQL = `
      -- Rooms indexes
      CREATE INDEX IF NOT EXISTS idx_rooms_code ON rooms(code);
      CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);
      CREATE INDEX IF NOT EXISTS idx_rooms_expires ON rooms(expires_at);
      
      -- Players indexes
      CREATE INDEX IF NOT EXISTS idx_players_room_id ON players(room_id);
      CREATE INDEX IF NOT EXISTS idx_players_socket_id ON players(socket_id);
      CREATE INDEX IF NOT EXISTS idx_players_ready ON players(room_id, is_ready);
      
      -- Questions indexes
      CREATE INDEX IF NOT EXISTS idx_questions_room_id ON questions(room_id);
      CREATE INDEX IF NOT EXISTS idx_questions_round ON questions(room_id, round_number);
      
      -- Answers indexes
      CREATE INDEX IF NOT EXISTS idx_answers_player_id ON answers(player_id);
      CREATE INDEX IF NOT EXISTS idx_answers_question_id ON answers(question_id);
      CREATE INDEX IF NOT EXISTS idx_answers_room_id ON answers(room_id);
    `;

    const indexStatements = indexesSQL.split(';').filter(stmt => stmt.trim());
    for (const statement of indexStatements) {
      if (statement.trim()) {
        try {
          await query(statement + ';');
        } catch (error) {
          // Ignore index creation errors
        }
      }
    }
    console.log('✅ Indexes created/verified');

    // Insert default categories
    await seedDefaultCategories();

    console.log('✅ PostgreSQL database schema initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization error:', error.message);
    // Don't throw error, just log it
  }
}

// Seed default categories
async function seedDefaultCategories() {
  try {
    const defaultCategories = [
      { name: 'General Knowledge', emoji: '🧠', description: 'Random facts and trivia' },
      { name: 'Science', emoji: '🔬', description: 'Physics, chemistry, biology' },
      { name: 'History', emoji: '📚', description: 'Historical events and figures' },
      { name: 'Geography', emoji: '🌍', description: 'Countries, capitals, landmarks' },
      { name: 'Sports', emoji: '⚽', description: 'Teams, players, leagues' },
      { name: 'Movies', emoji: '🎬', description: 'Films, actors, directors' },
      { name: 'Music', emoji: '🎵', description: 'Artists, songs, genres' },
      { name: 'Technology', emoji: '💻', description: 'Tech companies, innovations' },
      { name: 'Animals', emoji: '🦁', description: 'Wildlife and pets' },
      { name: 'Food & Drink', emoji: '🍕', description: 'Cuisines, recipes, beverages' },
    ];

    for (const category of defaultCategories) {
      await query(`
        INSERT INTO categories (name, emoji, description, is_active) 
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (name) DO UPDATE SET
          emoji = EXCLUDED.emoji,
          description = EXCLUDED.description
      `, [category.name, category.emoji, category.description, true]);
    }
    console.log('✅ Default categories inserted/updated');
  } catch (error) {
    console.log('⚠️  Category seeding:', error.message);
  }
}

// Cleanup old rooms and inactive players
async function cleanupDatabase() {
  try {
    // Delete rooms older than 24 hours
    await query(`
      DELETE FROM rooms 
      WHERE expires_at < NOW() 
         OR (created_at < NOW() - INTERVAL '24 hours' AND status != 'active')
    `);

    // Mark players as offline who haven't been active in 5 minutes
    await query(`
      UPDATE players 
      SET is_online = false 
      WHERE last_active < NOW() - INTERVAL '5 minutes'
    `);

    console.log('✅ Database cleanup completed');
  } catch (error) {
    console.error('❌ Cleanup error:', error.message);
  }
}

// Start initialization and cleanup
initializeDatabase().then(() => {
  cleanupDatabase();
  console.log('✅ Database setup complete');
});

// Schedule cleanup every 30 minutes
setInterval(cleanupDatabase, 30 * 60 * 1000);

// Export everything
module.exports = {
  pool,
  query,
  run,
  get,
  all,
  initializeDatabase,
  cleanupDatabase
};