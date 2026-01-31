# QuizSmash - Developer Tips & Tricks

## 🔥 Quick Tips

### Testing Multi-Player Locally

**Method 1: Different Browsers**
```bash
# Terminal 1 & 2 keep running

# Browser 1: http://localhost:5173
# Browser 2: http://localhost:5173 (new tab)

# Play as different users simultaneously
```

**Method 2: DevTools Device Emulation**
```
Right-click → DevTools → Toggle Device Toolbar
Test mobile responsiveness while playing
```

**Method 3: One Desktop + One Phone**
```bash
# Find your machine's IP
ipconfig (Windows) or ifconfig (Mac/Linux)

# On phone, go to: http://YOUR_IP:5173
# Make sure phone on same WiFi
```

### Debugging WebSocket Events

**In Browser Console**
```javascript
// Listen to all socket events
socket.onAny((event, ...args) => {
  console.log(`Event: ${event}`, args);
});

// Check connection status
console.log(socket.connected);

// Check room code
console.log(roomCode);

// Manually emit event (for testing)
socket.emit("create-room", "TestUser");
```

### Checking Database

**SQLite Command Line**
```bash
# Navigate to backend
cd backend

# Open database
sqlite3 data/quizsmash.sqlite

# Useful commands
.tables                          # See all tables
SELECT * FROM rooms;             # View all rooms
SELECT * FROM players;           # View all players
SELECT * FROM questions;         # View all questions
DELETE FROM rooms;               # Clear all data
.exit                            # Exit sqlite3
```

**Python Script** (if sqlite3 CLI not available)
```python
import sqlite3

conn = sqlite3.connect('backend/data/quizsmash.sqlite')
cursor = conn.cursor()

# View rooms
cursor.execute('SELECT * FROM rooms')
print(cursor.fetchall())

# View players
cursor.execute('SELECT * FROM players')
print(cursor.fetchall())

conn.close()
```

### Performance Testing

**Load Testing with Artillery**
```bash
# Install globally
npm install -g artillery

# Create load-test.yml
cat > load-test.yml << 'EOF'
config:
  target: "http://localhost:5000"
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Ramp up to 10 req/s"

scenarios:
  - name: "Create Rooms"
    flow:
      - post:
          url: "/"
          json:
            action: "create_room"
            username: "User{{ $randomNumber(1, 100) }}"
EOF

# Run test
artillery run load-test.yml
```

### Browser DevTools Tricks

**Network Tab**
```
1. Open DevTools (F12)
2. Go to Network tab
3. Play the game
4. Filter by "WS" to see WebSocket messages
5. Click on socket.io message to inspect payload
```

**Console Logging**
```javascript
// Add to frontend to track state
console.log('Room:', roomCode);
console.log('Players:', players);
console.log('Current Question:', currentQuestion);
console.log('Scores:', scores);
```

**Storage Tab**
```
DevTools → Application → Local Storage
Can see socket.io connection info
```

## 🐛 Common Issues & Fixes

### Issue: "Cannot find module 'openai'"
**Fix**
```bash
cd backend
npm install openai
```

### Issue: Port 5000 already in use
**Windows**
```powershell
# Find what's using port 5000
netstat -ano | findstr :5000

# Kill the process
taskkill /PID <PID> /F
```

**Mac/Linux**
```bash
# Find process
lsof -i :5000

# Kill it
kill -9 <PID>

# Or just use different port (update .env)
PORT=5001
```

### Issue: Socket connection refused
**Checklist**
- [ ] Backend running? (check terminal for "Server running on port 5000")
- [ ] VITE_SOCKET_URL correct? (http://localhost:5000)
- [ ] Ports don't conflict? (5000 & 5173 both free)
- [ ] Check browser DevTools → Network → WS (WebSocket should be green)
- [ ] Check CORS error in console

**Fix**
```javascript
// Add logging to debug
console.log('Connecting to:', SOCKET_URL);
const socket = io(SOCKET_URL, {
  transports: ["websocket"],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5
});

socket.on("connect", () => console.log("Connected!"));
socket.on("connect_error", (error) => console.error("Connection error:", error));
```

### Issue: Database locked
**Symptom**: Random "database is locked" errors
**Fix**
```bash
# This usually means multiple instances writing
# 1. Kill all node processes
killall node

# 2. Delete database to start fresh
rm backend/data/quizsmash.sqlite

# 3. Restart backend
cd backend && npm start

# 4. Database will recreate automatically
```

### Issue: OpenAI quiz generation fails
**Symptoms**: 
- 401 error: Invalid API key
- 429 error: Rate limit exceeded
- 500 error: API error

**Fix**
```javascript
// The app already handles this!
// Check backend console: "OpenAI API error:"
// The system automatically uses fallback questions

// To test:
// 1. Don't set OPENAI_API_KEY in .env
// 2. Game will use fallback questions
```

### Issue: Styling not loading
**Fix**
```bash
# Hard refresh browser
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)

# Or clear cache
DevTools → Storage → Clear Site Data
```

## ⚡ Performance Tips

### Make Queries Faster
```javascript
// Add indexes to frequently queried columns
db.run(`CREATE INDEX IF NOT EXISTS idx_room_code ON rooms(code)`);
db.run(`CREATE INDEX IF NOT EXISTS idx_player_room ON players(room_id)`);
```

### Reduce Database Calls
```javascript
// Before: Multiple queries
const room = await get("SELECT * FROM rooms WHERE id = ?", [roomId]);
const players = await all("SELECT * FROM players WHERE room_id = ?", [roomId]);
const questions = await all("SELECT * FROM questions WHERE room_id = ?", [roomId]);

// After: Single join query (if possible)
// But note: SQLite doesn't support JSON output, so you might need multiple queries
```

### Optimize Frontend
```javascript
// Use useCallback to prevent unnecessary re-renders
const handleAnswer = useCallback((index) => {
  if (selectedAnswer !== null) return; // Don't allow double submission
  setSelectedAnswer(index);
  socket.emit("submit-answer", {...});
}, [selectedAnswer, socket]);

// Use memo for expensive components
const ScoreBoard = React.memo(({ scores }) => {
  return scores.map(score => <div key={score.username}>{score}</div>);
});
```

## 🎨 Customization Ideas

### Change Theme Colors
Edit `frontend/src/App.css`:
```css
/* Change primary color from indigo to your color */
button.primary {
  background: linear-gradient(120deg, #ff6b6b, #ffd93d); /* Red to yellow */
}
```

### Add Sound Effects
```javascript
const playSound = (soundName) => {
  const audio = new Audio(`/sounds/${soundName}.mp3`);
  audio.play();
};

// Use it
playSound("correct");
playSound("incorrect");
playSound("button-click");
```

### Add Animations
```css
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.question {
  animation: slideIn 0.3s ease-out;
}
```

### Change Quiz Settings
Edit `backend/src/openai.js`:
```javascript
// Change from 3 to 5 questions
async function generateQuiz(topic, difficulty = 'medium', numQuestions = 5) {

// Change creativity (0-1, higher = more creative)
temperature: 0.9,  // Was 0.7

// Longer responses
max_tokens: 2500,  // Was 1500
```

## 🔍 Monitoring & Logging

### Add Better Logging
```javascript
// Backend
const log = (level, message, data) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${level}: ${message}`, data || '');
};

// Use it
log('INFO', 'Room created', { code: roomCode, users: players.length });
log('ERROR', 'Database error', error.message);
```

### Check Server Health
```bash
# Terminal
curl http://localhost:5000/api/health

# Should return
{"status":"ok","message":"QuizSmash Server Running"}
```

### View Live Logs
```bash
# Follow backend logs
tail -f backend.log

# Or using npm with nodemon (install if needed)
npm install -g nodemon
nodemon src/index.js  # Auto-restarts on file change
```

## 📱 Mobile Testing

### Test Responsive Design
```bash
# Chrome DevTools
1. F12 → Toggle Device Toolbar (Ctrl+Shift+M)
2. Select device (iPhone 12, Pixel, etc.)
3. Play through entire game
4. Check buttons/text sizes are readable
```

### Test on Real Phone
```bash
# Find your PC/Mac IP
ipconfig (Windows) / ifconfig (Mac)
# Example: 192.168.1.100

# On phone on same WiFi
# Go to: http://192.168.1.100:5173
```

## 🚀 Deployment Testing

### Test Production Build Locally
```bash
# Frontend
cd frontend
npm run build         # Creates dist/ folder
npm run preview       # Serves optimized build

# Visit http://localhost:4173
```

### Simulate Production Errors
```bash
# Set NODE_ENV to production
export NODE_ENV=production

# Run backend
npm start

# Errors will be logged differently
```

## 🎯 Optimization Checklist

- [ ] SQLite indexes on commonly queried fields
- [ ] React.memo on expensive components
- [ ] useCallback on event handlers
- [ ] Lazy loading for heavy components
- [ ] Frontend build size optimized
- [ ] No console.log in production code
- [ ] Database connection pooling ready
- [ ] Error boundaries for crash recovery
- [ ] Network requests cached where possible
- [ ] Images compressed and optimized

## 📊 Useful Commands

```bash
# Check project size
du -sh quizSmash

# Count lines of code
find . -name "*.js" -o -name "*.tsx" | xargs wc -l

# Run tests (if added)
npm test

# Lint code
npm run lint

# Format code
npm run format

# Check for security issues
npm audit

# Update packages
npm update
```

## 🤝 Collaboration Tips

### If Working with Team

**Branching Strategy**
```bash
git checkout -b feature/my-feature
# Make changes
git add .
git commit -m "Add feature: my-feature"
git push origin feature/my-feature
# Create Pull Request on GitHub
```

**Before Merging**
- [ ] Code reviewed by team member
- [ ] Tests pass
- [ ] No conflicts with main
- [ ] Works locally
- [ ] Documentation updated

**Communication**
- Use GitHub issues for bugs/features
- Use PRs for code review
- Comment on complex code
- Update documentation

## 📖 Learning Resources

If you want to deepen your understanding:
- Socket.IO docs: https://socket.io/docs/
- React hooks: https://react.dev/reference/react/hooks
- SQLite: https://www.sqlite.org/docs.html
- Express: https://expressjs.com/
- TypeScript: https://www.typescriptlang.org/docs/

## 🎓 Interview Talking Points

Be ready to explain:
1. **Architecture**: How frontend and backend communicate
2. **WebSockets**: Why Socket.IO over HTTP polling
3. **Database Design**: Why SQLite vs PostgreSQL
4. **Scalability**: How to handle 10x more users
5. **Security**: SQL injection prevention, CORS
6. **Error Handling**: What happens when someone disconnects
7. **Performance**: How response times stay fast
8. **Deployment**: Steps to deploy to production

Good luck! 🚀
