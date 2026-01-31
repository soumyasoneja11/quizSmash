# QuizSmash - JKLM.fun Clone

A fast-paced multiplayer trivia game built for your college hackathon. Create rooms, invite friends, and compete on the leaderboard in real-time.

## Features

✨ **Real-time Multiplayer Gameplay** - WebSocket-powered instant updates
🎮 **Customizable Quizzes** - Choose topic and difficulty
🏆 **Live Leaderboard** - Real-time score tracking
👥 **Room-based System** - Create or join rooms with 6-character codes
🧹 **Auto Room Cleanup** - Empty rooms automatically disband
⚡ **Lightweight & Fast** - SQLite for instant setup, no database server needed

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite + Socket.IO-Client + Tailwind CSS
- **Backend**: Node.js + Express + Socket.IO
- **Database**: SQLite3
- **AI**: OpenAI API for quiz generation

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- OpenAI API key (optional, for AI-generated quizzes)

### Installation

1. **Clone and navigate**
   ```bash
   cd quizSmash
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   ```
   
   Create `.env` file in backend directory:
   ```env
   PORT=5000
   FRONTEND_URL=http://localhost:5173
   SQLITE_PATH=./data/quizsmash.sqlite
   OPENAI_API_KEY=sk_test_your_key_here
   ```

3. **Setup Frontend**
   ```bash
   cd ../frontend
   npm install
   ```
   
   Create `.env` file in frontend directory:
   ```env
   VITE_API_URL=http://localhost:5000
   VITE_SOCKET_URL=http://localhost:5000
   ```

### Running Locally

**Terminal 1 - Start Backend**
```bash
cd backend
npm start
```
Server runs on `http://localhost:5000`

**Terminal 2 - Start Frontend**
```bash
cd frontend
npm run dev
```
App runs on `http://localhost:5173`

Open http://localhost:5173 in your browser and start playing!

## How to Play

1. **Create/Join Room**
   - Enter username
   - Click "Create room" or join an existing room with a code

2. **Lobby**
   - Host sets topic and difficulty
   - Players ready up or wait for host to start
   - Host clicks "Start game"

3. **Play**
   - Each player selects an answer
   - Feedback shows correct/incorrect and score
   - Host advances to next question
   - After all questions, view final leaderboard

## Project Structure

```
quizSmash/
├── backend/
│   ├── src/
│   │   ├── index.js          # Express server & Socket.IO setup
│   │   ├── socket.js         # Game logic & WebSocket handlers
│   │   ├── database.js       # SQLite helpers
│   │   └── openai.js         # Quiz generation
│   ├── data/                 # SQLite database file
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── App.tsx           # Main game component
│   │   ├── App.css           # Game UI styles
│   │   ├── main.tsx          # React entry point
│   │   └── index.css         # Global styles
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── .env
└── README.md
```

## Key Features Explained

### WebSocket Events

**Client → Server**
- `create-room` - Create new room with username
- `join-room` - Join existing room with code
- `start-game` - Host starts game with topic/difficulty
- `submit-answer` - Player submits quiz answer
- `next-question` - Host advances to next question
- `player-ready` - Player marks themselves ready

**Server → Client**
- `room-created` - Room created, receive code and ID
- `room-joined` - Successfully joined, receive player list
- `player-joined` - Another player joined
- `game-started` - Game started, first question sent
- `next-question` - New question for current round
- `answer-feedback` - Correctness feedback and score update
- `score-update` - Leaderboard update for all players
- `game-completed` - Game ended, final leaderboard
- `room-closed` - Room was closed (no players left)
- `player-left` - Another player left the room

### Room Management

- Rooms are stored in SQLite with auto-generated 6-character codes
- Rooms have 4 player limit
- Empty rooms (0 players) are automatically deleted on disconnect
- Room status: `waiting` → `active` → `completed`

### Database Schema

**Rooms Table**
- `id` (PK), `code` (unique), `host_socket_id`, `topic`, `difficulty`, `status`, `created_at`, `expires_at`

**Players Table**
- `id` (PK), `room_id` (FK), `username`, `socket_id`, `score`, `is_ready`, `joined_at`

**Questions Table**
- `id` (PK), `room_id` (FK), `question_text`, `options`, `correct_index`, `round_number`

**Answers Table**
- `id` (PK), `player_id` (FK), `question_id` (FK), `selected_index`, `is_correct`, `answered_at`

## Deployment

### Deploy to Azure

1. **Create resources**
   - App Service (Node.js)
   - Azure SQL Database or Cosmos DB
   - Static Web App for frontend

2. **Update connection strings**
   - Set production database path
   - Update FRONTEND_URL and Socket.IO CORS origins

3. **Deploy**
   ```bash
   # Backend
   az webapp up --name quizsmash-api --runtime "node|20-lts"
   
   # Frontend
   npm run build
   # Deploy build/ to Static Web App
   ```

### Environment Variables for Production

**Backend .env**
```env
PORT=80
FRONTEND_URL=https://your-app.azurewebsites.net
SQLITE_PATH=/mnt/data/quizsmash.sqlite
OPENAI_API_KEY=your_api_key
```

**Frontend .env.production**
```env
VITE_API_URL=https://your-api.azurewebsites.net
VITE_SOCKET_URL=https://your-api.azurewebsites.net
```

## Troubleshooting

**"Room not found or already started"**
- Check room code spelling (case-insensitive, converted to uppercase)
- Room may have expired or game already started

**Socket connection failing**
- Verify both servers are running
- Check VITE_SOCKET_URL matches backend address
- Ensure CORS is properly configured

**OpenAI errors**
- Invalid API key - check .env file
- Rate limits exceeded - add delays between requests
- Fallback questions used automatically if API fails

**Empty room issue**
- All players disconnected, room auto-deleted
- Create a new room to play

## Development

### Adding Features

**New Quiz Topic**: Already dynamic via topic input in lobby

**New Difficulty Levels**: Easy/Medium/Hard configured in frontend, adjust OpenAI prompt in `backend/src/openai.js`

**Scoring System**: Modify points in `backend/src/socket.js` `submitAnswer()` function

**Custom Styling**: Update `frontend/src/App.css` and `frontend/src/index.css`

### Testing

Open browser DevTools Console:
```javascript
// Test Socket.IO connection
console.log(socket.connected); // should be true

// Listen for events
socket.on("room-created", (data) => console.log("Room:", data));
```

## License

MIT - Use for your hackathon!

## Support

Having issues? Check:
1. Both servers running (check terminal output)
2. .env files configured correctly
3. Network connectivity between frontend and backend
4. OpenAI API key valid (optional, has fallback)

Good luck with your hackathon! 🚀
