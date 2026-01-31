# QuizSmash Architecture & Implementation Guide

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React/Vite)                    │
│              Running on http://localhost:5173                   │
├─────────────────────────────────────────────────────────────────┤
│  • React Components (Lobby, Game, Results)                      │
│  • Socket.IO Client (Real-time updates)                         │
│  • State Management (useState hooks)                            │
│  • TypeScript Typing                                            │
│  • Responsive CSS (Dark theme)                                  │
└────────────────┬────────────────────────────────────────────────┘
                 │
         WebSocket Connection
         (Socket.IO Protocol)
                 │
┌────────────────▼────────────────────────────────────────────────┐
│                   BACKEND (Node.js/Express)                     │
│              Running on http://localhost:5000                   │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐  │
│  │            Express Server (HTTP/REST)                    │  │
│  │  • GET /api/health - Server health check                │  │
│  │  • GET /api/rooms - Active rooms list                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │          Socket.IO Server (WebSockets)                   │  │
│  │  • Connection management                                 │  │
│  │  • Real-time event handling                             │  │
│  │  • Room/namespace support                               │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │            Game Logic Layer                              │  │
│  │  • Room creation & management                            │  │
│  │  • Player join/leave handling                            │  │
│  │  • Answer validation & scoring                           │  │
│  │  • Leaderboard calculation                               │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │          Database Layer (SQLite)                         │  │
│  │  • Persistent data storage                               │  │
│  │  • Query helpers (run, get, all)                        │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────┬────────────────────────────────────────────────┘
                 │
          HTTP Requests
                 │
┌────────────────▼────────────────────────────────────────────────┐
│                  EXTERNAL SERVICES                              │
├─────────────────────────────────────────────────────────────────┤
│  • OpenAI API (Quiz generation) - https://api.openai.com       │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Create Room Flow
```
User inputs username
        ↓
Click "Create room"
        ↓
Frontend: socket.emit("create-room", username)
        ↓
Backend: generateRoomCode() → saveRoomToDB() → savePlayers()
        ↓
Backend: socket.emit("room-created", {roomCode, playerId})
        ↓
Frontend: Update state, display room code, show lobby
```

### Join Room Flow
```
User enters room code & username
        ↓
Click "Join"
        ↓
Frontend: socket.emit("join-room", {roomCode, username})
        ↓
Backend: validateRoom() → checkCapacity() → addPlayer()
        ↓
Backend: 
  • socket.emit("room-joined", {...}) to joining player
  • socket.to(room).emit("player-joined", {...}) to others
        ↓
Frontend: Update players list, show lobby
```

### Start Game Flow
```
Host clicks "Start game" with topic/difficulty
        ↓
Frontend: socket.emit("start-game", {roomCode, topic, difficulty})
        ↓
Backend:
  1. updateRoomStatus("active")
  2. generateQuiz(topic, difficulty) via OpenAI
  3. saveQuestions()
  4. loadPlayers()
        ↓
Backend: socket.to(room).emit("game-started", {firstQuestion, ...})
        ↓
Frontend: Show first question, disable lobby controls
```

### Answer Submission Flow
```
Player selects answer option
        ↓
Frontend: socket.emit("submit-answer", {playerId, questionId, answerIndex})
        ↓
Backend:
  1. getQuestion()
  2. checkIfCorrect()
  3. updatePlayerScore()
  4. saveAnswer()
        ↓
Backend:
  • socket.emit("answer-feedback", {...}) to player
  • socket.to(room).emit("score-update", {...}) to all players
        ↓
Frontend:
  • Show feedback (correct/incorrect)
  • Update leaderboard
```

### Next Question Flow
```
Host clicks "Next question"
        ↓
Frontend: socket.emit("next-question", {roomCode, currentRound})
        ↓
Backend:
  • If more questions exist:
      - getNextQuestion()
      - socket.to(room).emit("next-question", {...})
  • If no more questions:
      - getLeaderboard()
      - updateRoomStatus("completed")
      - socket.to(room).emit("game-completed", {leaderboard})
        ↓
Frontend:
  • Show next question OR
  • Show final leaderboard
```

### Disconnect/Room Cleanup Flow
```
Player socket disconnects
        ↓
Backend: socket.on("disconnect", async () => {...})
        ↓
Backend:
  1. getPlayer(socketId)
  2. getRoom(playerId.roomId)
  3. deletePlayer()
  4. countPlayers()
        ↓
Backend:
  • If countPlayers === 0:
      - deleteRoom()
      - socket.to(room).emit("room-closed")
  • Else:
      - socket.to(room).emit("player-left", {players})
        ↓
Frontend:
  • Update players list OR
  • Return to home screen
```

## File Structure & Responsibilities

### Frontend (`frontend/src/`)

**App.tsx** - Main component
- Socket.IO connection setup
- State management for all game states
- Event listeners for server updates
- Rendering logic for all views (home, lobby, game, results)
- ~400 lines of React component

**App.css** - Game UI styles
- Hero section (home screen)
- Lobby layout
- Game controls & options
- Leaderboard & results
- Responsive grid layouts

**index.css** - Global styles
- Dark theme colors (slate/indigo)
- Typography
- Background gradient
- Utility classes

**main.tsx** - Entry point
- React DOM render
- App component initialization

### Backend (`backend/src/`)

**index.js** - Server setup
- Express app configuration
- CORS middleware
- Static routes (health check, rooms list)
- Socket.IO initialization
- Server listener on port 5000

**socket.js** - Game logic & WebSocket handlers
- `generateRoomCode()` - Create 6-char room codes
- `createRoom()` - DB transaction for room creation
- `joinRoom()` - Validate & add player to room
- `startGame()` - Generate questions, start game
- `submitAnswer()` - Process answer, update score
- Socket event handlers for all client actions
- Auto room deletion on empty

**database.js** - SQLite abstraction layer
- Database connection setup
- Promise-based query helpers: `run()`, `get()`, `all()`
- Schema initialization
- Foreign key constraints
- Auto-increment IDs

**openai.js** - AI integration
- `generateQuiz()` - Call OpenAI API
- Prompt engineering for quiz generation
- JSON parsing of responses
- Fallback questions if API fails

## Key Implementation Details

### WebSocket Connection
```javascript
// Frontend
const socket = io(SOCKET_URL, {
  transports: ["websocket"],
});

// Backend
const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    credentials: true
  },
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000
  }
});
```

### Database Queries (SQLite)
```javascript
// All queries use parameterized statements (? placeholders)
await run(
  "INSERT INTO rooms (code, host_socket_id) VALUES (?, ?)",
  [roomCode, hostSocketId]
);

// Prevents SQL injection
// Returns promises for async/await usage
```

### Score Calculation
```javascript
// 10 points per correct answer
if (isCorrect) {
  await run(
    "UPDATE players SET score = score + 10 WHERE id = ?",
    [playerId]
  );
}
```

### Room Auto-Cleanup
```javascript
// On disconnect:
const remaining = await get(
  "SELECT COUNT(*) as count FROM players WHERE room_id = ?",
  [playerId]
);

if (remaining.count === 0) {
  // Delete room - no players left
  await run("DELETE FROM rooms WHERE id = ?", [roomId]);
}
```

### Options Serialization
```javascript
// Store as JSON string in SQLite
options: JSON.stringify(["Option A", "Option B", "Option C", "Option D"])

// Retrieve and parse
const options = JSON.parse(question.options);
```

## State Management

### Frontend State
```typescript
// Game states
view: "home" | "lobby" | "game" | "results"
roomCode: string
playerId: number
players: Player[]
isHost: boolean

// Game data
currentQuestion: Question | null
currentRound: number
totalQuestions: number
selectedAnswer: number | null
feedback: Feedback | null
scores: Score[]
leaderboard: Score[]

// UI state
statusMessage: string
errorMessage: string
```

### Backend State (SQLite)
```
Rooms: code, status, topic, difficulty, created_at
Players: room_id, username, socket_id, score, is_ready
Questions: room_id, question_text, options, correct_index
Answers: player_id, question_id, selected_index, is_correct
```

## Error Handling

### Frontend
- Try-catch on API calls
- Socket.io error event listener
- User-friendly error messages
- Graceful disconnection handling

### Backend
- Transaction rollback on database errors
- Try-catch around async operations
- Error emission to specific socket
- Request validation before DB operations

## Performance Considerations

1. **Database**: SQLite single-file (sufficient for hackathon scale)
2. **Memory**: Socket.IO connection pooling
3. **Network**: Payload size ~1KB per message
4. **Scaling**: Can handle ~100 concurrent users on single server

## Security Best Practices Implemented

1. **SQL Injection**: Parameterized queries (?)
2. **CORS**: Origin whitelist
3. **Validation**: Room code, username, answer index checks
4. **Rate Limiting**: No per-player rate limits (add if needed)

## Testing Checklist

- [ ] Create room & receive code
- [ ] Join room with valid code
- [ ] Join room with invalid code (error)
- [ ] Join room with duplicate username (error)
- [ ] Host starts game with valid topic
- [ ] Submit valid answer
- [ ] Submit answer outside valid range (error)
- [ ] View feedback on answer
- [ ] Leaderboard updates correctly
- [ ] Host advances to next question
- [ ] Game completes after all questions
- [ ] Player disconnect cleans up room
- [ ] Empty room auto-deletes
- [ ] Multiple rooms exist independently

## Troubleshooting Guide

### WebSocket Connection Fails
- Check backend running on port 5000
- Check VITE_SOCKET_URL in frontend .env
- Check CORS origin in backend

### Player stuck in lobby
- Check host has started game
- Check browser console for errors
- Refresh page and rejoin

### Room not found error
- Verify room code spelling
- Check room hasn't expired (inactive >1 hour)
- Check room hasn't already started

### Score not updating
- Check database write permissions
- Check SQLite file not locked
- Check player ID is valid

### OpenAI errors
- Check API key valid
- Check API quota not exceeded
- Check internet connection
- Fallback questions used if API fails
