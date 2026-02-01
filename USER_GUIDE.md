# 🎮 QuizSmash - User Guide & Feature Overview

## Quick Start

### For College Hackathon
1. Clone the project
2. Install dependencies: `npm install` (both backend & frontend)
3. Set up `.env` with OpenAI API key
4. Run backend: `npm start` (port 5000)
5. Run frontend: `npm run dev` (port 5173)
6. Open `http://localhost:5173` in browser
7. Start playing! 🎉

---

## 🏠 Home Screen

**What You See**:
- Large "QuizSmash" title with tagline
- Username input field
- "Create Room" button (primary action)
- Room code input field
- "Join" button
- "Refresh" button to see available rooms
- List of public rooms with player counts

**Actions**:
- Enter username → Click "Create Room" → Get room code
- Enter username → Paste code → Click "Join"
- Browse available rooms and click to select
- Share room code with friends

---

## 🎪 Lobby Screen

**What You See**:
- Room code (displayed prominently)
- "Share this code to invite friends" instruction
- Player list showing all joined players
- **Category Selection Grid** (Host Only)
  - 8 emoji-based categories
  - Click to select your quiz topic
  - Shows active selection
- **Game Setup Panel**
  - Category name (customizable)
  - Difficulty dropdown:
    - 🟢 Easy
    - 🟡 Medium
    - 🔴 Hard
  - "Start Game" button (host only)
  - "Ready" button (players)
- Status messages

**Features**:
- 👑 Host badge if you created room
- Player count indicator
- Current player highlighted
- Real-time player list updates

---

## 🎯 Game Screen

### Question Display
- **Round indicator**: "Round X of Y"
- **Question text**: Large, readable font
- **Timer visualization**: 
  - Circular SVG progress bar
  - Cyan color (normal) → Yellow → Red (warning)
  - Seconds displayed in center
  - Auto-submit at 0 seconds

### Answer Options
- **4 answer buttons** (A, B, C, D)
- **Hover effects**: Glow on hover
- **Click to select**: Button highlights in cyan
- **Instant feedback** after selection:
  - Correct answer shows in green
  - Your selection highlights appropriately
  - Wrong answer shows in red

### Live Scoreboard
- **Real-time ranking** (#1, #2, #3, #4)
- **Current points** displayed
- **First place highlighted** with special color
- **Updates instantly** as players answer

### Timeline
1. Question appears (timer starts)
2. Scoreboard shows live ranks
3. You click an answer
4. Feedback panel appears
5. Explanation displayed
6. Points awarded
7. Next question button appears
8. Repeat until all questions done

---

## 📋 Feedback Panel

**After Each Question**:

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 🎉 Correct!                  ┃  (or ❌ Incorrect)
┃                              ┃
┃ The correct answer was D     ┃
┃                              ┃
┃ 💡 Did you know?             ┃
┃ This answer is fascinating   ┃
┃ because... [explanation]     ┃
┃                              ┃
┃ Base points: +100            ┃
┃ Speed bonus: +50 ⭐          ┃  (if earned)
┃ ───────────────────────      ┃
┃ Total earned: +150           ┃
┃                              ┃
┃ [Next Question →]            ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

**Features**:
- ✅ Immediate feedback (correct/incorrect)
- 💡 Educational explanation
- 📊 Points breakdown
- ⚡ Speed bonus indicator
- ⏭️ Navigation buttons

---

## 🏆 Results Screen

**Final Leaderboard**:
- 🥇 First place with trophy emoji
- 2️⃣ Second place
- 3️⃣ Third place
- Others listed

**Shows**:
- Final scores for all players
- Ranking order
- Total points earned
- Game stats

**Actions**:
- "Back to Home" button
- Option to create new room or join another

---

## ⚙️ Settings & Customization

### Categories Available
| Emoji | Category | Best For |
|-------|----------|----------|
| 🔬 | Science | Physics, chemistry, biology experts |
| 📚 | History | History buffs and trivia masters |
| 🌍 | Geography | Travel enthusiasts |
| ⚽ | Sports | Sports fans and athletes |
| 🎬 | Movies | Film enthusiasts |
| 🎵 | Music | Music lovers |
| 💻 | Technology | Tech-savvy players |
| 🦁 | Animals | Nature and wildlife lovers |

### Difficulty Levels

**🟢 Easy**
- More time per question
- Simpler questions
- Good for beginners
- 1x point multiplier

**🟡 Medium** (Recommended)
- Standard timing
- Balanced difficulty
- Best for mixed groups
- 1.5x point multiplier

**🔴 Hard**
- Faster questions
- Challenging content
- For experienced players
- 2x point multiplier

---

## 📊 Scoring System

### Points Breakdown
- **Base points**: 100 for correct answer
- **Speed bonus**: +50 if answered >50% time remaining
- **Multiplier**: Varies by difficulty level

### Speed Bonus Explained
```
Question Time: 20 seconds
Speed Bonus Threshold: 10 seconds (50% time)

If you answer:
- In 15-20s → 50 bonus points
- In 10-15s → 25-50 bonus points
- In 5-10s  → 0 bonus (too slow)
- In 0-5s   → Timeout (auto-submit)
```

### Example Scoring
```
Scenario 1: Easy, Fast Answer
- Correct: Yes
- Time remaining: 15 seconds
- Base: +100
- Bonus: +50 (50 × 15/20)
- Total: 150 points

Scenario 2: Hard, Correct, Slow
- Correct: Yes
- Time remaining: 3 seconds
- Base: +100 (no bonus, too slow)
- Total: 100 points
```

---

## 🎮 Player Roles

### Host (Room Creator)
- ✅ Create the room
- ✅ Select category
- ✅ Choose difficulty
- ✅ Start the game
- ✅ Proceed to next question
- ✅ End the game
- ✅ See all players
- ✅ Manage room

### Players (Joined)
- ✅ Select answers
- ✅ Earn points
- ✅ See scoreboard
- ✅ Watch for next question
- ✅ See final results
- ⚠️ Cannot start game (wait for host)

---

## 🎯 Strategies to Win

### Speed Strategy
- Be ready to answer quickly
- The first 50% of time is critical
- Don't overthink - trust your instincts
- Maximize speed bonus opportunities

### Accuracy Strategy
- Take time to think carefully
- Focus on getting more correct
- Miss speed bonus but avoid wrong answers
- Quality over speed

### Balanced Strategy (Recommended)
- Answer within first 10 seconds if confident
- Take longer only when unsure
- Aim for 70%+ correct answers
- Balance speed and accuracy

---

## 🔧 Technical Features

### Real-Time Communication
- ✅ WebSocket (Socket.IO)
- ✅ Instant score updates
- ✅ Live player tracking
- ✅ Synchronized timers

### Intelligent Questions
- ✅ AI-generated by OpenAI
- ✅ Custom by category
- ✅ Difficulty-adjusted
- ✅ Educational explanations

### Responsive Design
- ✅ Desktop (full features)
- ✅ Tablet (optimized layout)
- ✅ Mobile (touch-friendly)
- ✅ All modern browsers

---

## 🐛 Troubleshooting

### Server Won't Start
```bash
# Check if ports are in use
# Kill process on port 5000 or 5173
# Try different ports
npm start -- --port 3000
```

### Can't Connect to Room
- Check room code spelling
- Room might be full (max 4 players)
- Room might have started
- Refresh and try again

### Timer Not Showing
- Clear browser cache
- Hard refresh (Ctrl+Shift+R)
- Check browser console for errors
- Try different browser

### Questions Not Loading
- Check OpenAI API key in .env
- API quota might be exceeded
- Network connection issue
- Check backend console logs

---

## 🎨 UI Elements Explained

### Colors Meaning
- 🔵 **Blue/Indigo**: Primary actions, important elements
- 🔷 **Cyan**: Active state, selected elements
- 🟢 **Green**: Correct answers, success
- 🟡 **Yellow**: Warning state (timer low)
- 🔴 **Red**: Wrong answers, danger
- ⚫ **Dark**: Background, cards, panels

### Icons
- 👑 Host badge - You're the room host
- 🎯 Active button - Ready to click
- ✅ Success indicator - Action completed
- ⏱️ Timer - Time remaining

---

## 💡 Tips & Tricks

1. **Share Room Code Quickly**
   - Copy-paste room code to friends
   - Faster than them searching

2. **Use Easy Mode First**
   - Get familiar with mechanics
   - Practice before Hard mode

3. **Watch Scoreboard**
   - See how others are doing
   - Adjust strategy mid-game

4. **Read Explanations**
   - Learn while playing
   - Great for study sessions

5. **Team Play**
   - Play with friends
   - Discuss answers before submitting
   - Have fun!

---

## 🎓 Educational Value

### Learn While Playing
- 💡 AI-generated educational explanations
- 📚 Covers 8 different topics
- 🧠 Reinforces knowledge through gameplay
- 🎯 Engaging format helps retention

### Best For
- College study groups
- Quiz preparation
- Friendly competition
- Knowledge sharing

---

## 🚀 Future Features Coming

- 🔊 Sound effects (correct/incorrect)
- 🎉 Victory animations
- 🏅 Achievement badges
- ⚡ Streak tracking
- 🎮 Different game modes
- 👥 Team play
- 💬 In-game chat

---

## 📞 Support

### Issues?
1. Check troubleshooting section
2. Review console errors (F12)
3. Check logs in terminal
4. Restart both servers

### Questions?
- Read ARCHITECTURE.md for technical details
- Check README.md for setup
- Review DEPLOYMENT.md for hosting

---

## 🎉 Ready to Play!

**Everything is set up and ready to go!**

1. Open `http://localhost:5173`
2. Enter your username
3. Create or join a room
4. Select category & difficulty
5. Start answering questions
6. Compete with friends
7. Have fun! 🎮

---

**Good luck! May the fastest and most knowledgeable player win!** 🏆
