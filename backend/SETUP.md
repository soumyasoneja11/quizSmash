# Backend Configuration Guide

## Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
# Server Configuration
PORT=5000
FRONTEND_URL=http://localhost:5173

# Database Configuration
SQLITE_PATH=./data/quizsmash.sqlite

# OpenAI API Key (optional, for AI-generated quizzes)
OPENAI_API_KEY=sk_test_your_api_key_here
```

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Create `.env` file** with variables above

3. **Start Server**
   ```bash
   npm start
   ```

Server will run on `http://localhost:5000`

## Database

SQLite database is automatically initialized on first run. The database file is created at the path specified in `SQLITE_PATH`.

### Database Location

- **Development**: `./data/quizsmash.sqlite` (relative to backend root)
- **Production**: Set `SQLITE_PATH` to persistent storage location

### Database Tables

```sql
-- Rooms for multiplayer sessions
CREATE TABLE rooms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  host_socket_id TEXT,
  topic TEXT,
  difficulty TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'waiting',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Players in each room
CREATE TABLE players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  socket_id TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  is_ready INTEGER DEFAULT 0,
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(room_id, username)
);

-- Quiz questions for each room
CREATE TABLE questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  options TEXT NOT NULL, -- JSON stringified
  correct_index INTEGER NOT NULL,
  round_number INTEGER NOT NULL
);

-- Player answers for analytics
CREATE TABLE answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
  question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
  selected_index INTEGER,
  is_correct INTEGER,
  answered_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### Health Check
```http
GET /api/health
```
Response: `{ "status": "ok", "message": "QuizSmash Server Running" }`

### Get Active Rooms
```http
GET /api/rooms
```
Response: Array of room objects with player counts

```json
[
  {
    "id": 1,
    "code": "ABC123",
    "topic": "Science",
    "difficulty": "medium",
    "status": "waiting",
    "player_count": 2,
    "created_at": "2026-01-31T10:00:00Z"
  }
]
```

## WebSocket Events

### Emit (Client → Server)

**create-room**
```javascript
socket.emit("create-room", "username");
```

**join-room**
```javascript
socket.emit("join-room", {
  roomCode: "ABC123",
  username: "John"
});
```

**start-game**
```javascript
socket.emit("start-game", {
  roomCode: "ABC123",
  topic: "History",
  difficulty: "hard"
});
```

**submit-answer**
```javascript
socket.emit("submit-answer", {
  roomCode: "ABC123",
  playerId: 1,
  questionId: 5,
  answerIndex: 2
});
```

**next-question**
```javascript
socket.emit("next-question", {
  roomCode: "ABC123",
  currentRound: 1
});
```

**player-ready**
```javascript
socket.emit("player-ready", {
  roomCode: "ABC123",
  playerId: 1
});
```

### Listen (Server → Client)

**room-created**
```javascript
{
  roomCode: "ABC123",
  playerId: 1,
  isHost: true
}
```

**room-joined**
```javascript
{
  roomCode: "ABC123",
  playerId: 1,
  players: [...],
  isHost: false
}
```

**game-started**
```javascript
{
  topic: "Science",
  difficulty: "medium",
  totalQuestions: 3,
  firstQuestion: {
    id: 1,
    question: "What is the largest planet?",
    options: ["Earth", "Jupiter", "Saturn", "Venus"],
    round: 1
  },
  players: [...]
}
```

**answer-feedback**
```javascript
{
  isCorrect: true,
  correctAnswer: 1,
  playerScore: 10
}
```

**score-update**
```javascript
{
  scores: [
    { username: "Alice", score: 20 },
    { username: "Bob", score: 10 }
  ]
}
```

**game-completed**
```javascript
{
  leaderboard: [
    { username: "Alice", score: 30 },
    { username: "Bob", score: 20 }
  ]
}
```

**room-closed**
```javascript
{
  message: "Room closed due to inactivity"
}
```

**error**
```javascript
{
  message: "Error message here"
}
```

## Configuration Options

### Port Selection
Change `PORT` in `.env` to use different port (default: 5000)

### CORS Origins
Update `FRONTEND_URL` in `.env` to match frontend deployment URL

### Database Path
For production, ensure `SQLITE_PATH` points to persistent storage:
```env
# On Azure
SQLITE_PATH=/home/site/wwwroot/data/quizsmash.sqlite

# On local machine
SQLITE_PATH=./data/quizsmash.sqlite
```

### OpenAI Integration

#### Get API Key
1. Go to https://platform.openai.com/api-keys
2. Create new secret key
3. Add to `.env`: `OPENAI_API_KEY=sk_...`

#### Quiz Generation Settings
Edit `backend/src/openai.js`:
- Model: Change from `gpt-3.5-turbo` to `gpt-4` (costs more)
- Temperature: Adjust creativity (0-1, default 0.7)
- Max tokens: Adjust response length (default 1500)

#### Fallback Behavior
If OpenAI fails, generic questions are used automatically.

## Debugging

### Enable Logging
Current implementation logs to console:
- Server startup messages
- Socket connection events
- Database operations
- Errors

### Common Issues

**Port Already in Use**
```bash
# Find process using port 5000
lsof -i :5000
# Kill the process
kill -9 <PID>
```

**Database Locked**
- SQLite locks file during writes
- Usually resolves on server restart
- Ensure only one server instance running

**OpenAI Rate Limit**
- Add delays between quiz generations
- Check quota at https://platform.openai.com/account/usage/overview

**Socket Connection Issues**
- Check CORS origin in code matches FRONTEND_URL
- Verify both servers accessible from client network

## Performance Optimization

1. **Connection Pooling**: SQLite uses single connection (sufficient for small-medium scale)
2. **Caching**: Consider caching popular quiz topics
3. **Compression**: Socket.IO handles compression automatically
4. **Scalability**: For high load, migrate to PostgreSQL with connection pooling

## Security Considerations

1. **Input Validation**: Sanitize usernames and room codes
2. **Rate Limiting**: Add rate limits on quiz generation (high API cost)
3. **CORS**: Restrict to production domain only
4. **API Key**: Never commit `.env` to git, use `.gitignore`
5. **SQL Injection**: Using parameterized queries (safe from injection)

## Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong OpenAI API key (not test key)
- [ ] Update FRONTEND_URL to production domain
- [ ] Use persistent storage for SQLITE_PATH
- [ ] Set PORT=80 or use reverse proxy
- [ ] Enable HTTPS on frontend
- [ ] Backup database regularly
- [ ] Monitor error logs
- [ ] Set up automated restarts

### Docker Deployment

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --production
COPY backend/src ./src
EXPOSE 5000
CMD ["npm", "start"]
```

```bash
docker build -t quizsmash-backend .
docker run -p 5000:5000 -e OPENAI_API_KEY=$OPENAI_API_KEY quizsmash-backend
```

## Support

Issues? Check:
1. All dependencies installed (`npm install`)
2. `.env` file exists with required variables
3. Port 5000 available
4. Node.js version 18+
5. SQLite write permissions in `./data/` directory
