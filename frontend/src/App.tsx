import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import "./App.css";
import { audioManager } from "./audio";
import { particleSystem, celebrationCSS } from "./animations";

type Room = {
  id: number;
  code: string;
  topic: string | null;
  difficulty: string | null;
  status: string;
  player_count: number;
  created_at: string;
};

type Player = {
  id: number;
  username: string;
  score: number;
  is_ready?: number;
  streak?: number;
};

type Question = {
  id: number;
  question: string;
  options: string[];
  round: number;
  explanation?: string;
};

type Score = {
  username: string;
  score: number;
  streak?: number;
};

type GameCategory = {
  id: string;
  name: string;
  emoji: string;
  description: string;
};

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const GAME_CATEGORIES: GameCategory[] = [
  { id: "science", name: "Science", emoji: "🔬", description: "Physics, chemistry, biology" },
  { id: "history", name: "History", emoji: "📚", description: "Historical events and figures" },
  { id: "geography", name: "Geography", emoji: "🌍", description: "Countries, capitals, landmarks" },
  { id: "sports", name: "Sports", emoji: "⚽", description: "Teams, players, leagues" },
  { id: "movies", name: "Movies", emoji: "🎬", description: "Films, actors, directors" },
  { id: "music", name: "Music", emoji: "🎵", description: "Artists, songs, genres" },
  { id: "technology", name: "Technology", emoji: "💻", description: "Tech companies, innovations" },
  { id: "animals", name: "Animals", emoji: "🦁", description: "Wildlife and pets" },
];

const QUESTION_TIME = 20; // seconds per question

function App() {
  const socketRef = useRef<Socket | null>(null);

  const [view, setView] = useState<"home" | "categories" | "lobby" | "game" | "results" | "answer-reveal">(
    "home",
  );
  const [username, setUsername] = useState("");
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [playerId, setPlayerId] = useState<number | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("General Knowledge");
  const [difficulty, setDifficulty] = useState("medium");
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [currentRound, setCurrentRound] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [scores, setScores] = useState<Score[]>([]);
  const [leaderboard, setLeaderboard] = useState<Score[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{
    isCorrect: boolean;
    correctAnswer: number;
    playerScore: number;
    pointsEarned: number;
    speedBonus: boolean;
  } | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);

  // Initialize celebration CSS and audio on mount
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = celebrationCSS;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
    });
    socketRef.current = socket;

    socket.on("room-created", ({ roomCode, playerId }) => {
      setRoomCode(roomCode);
      setPlayerId(playerId);
      setIsHost(true);
      setPlayers([{ id: playerId, username, score: 0, is_ready: 1 }]);
      setView("lobby");
      setErrorMessage("");
    });

    socket.on("room-joined", ({ roomCode, playerId, players }) => {
      setRoomCode(roomCode);
      setPlayerId(playerId);
      setPlayers(players);
      setIsHost(false);
      setView("lobby");
      setErrorMessage("");
      // Play join sound
      audioManager.playSound('join');
    });

    socket.on("player-joined", ({ players }) => {
      setPlayers(players);
      // Play join sound for others joining
      audioManager.playSound('join');
    });

    socket.on("player-left", ({ players }) => {
      setPlayers(players);
    });

    socket.on("game-started", ({ firstQuestion, totalQuestions, players }) => {
      setPlayers(players);
      setCurrentQuestion(firstQuestion);
      setTotalQuestions(totalQuestions);
      setCurrentRound(1);
      setSelectedAnswer(null);
      setFeedback(null);
      setScores([]);
      setView("game");
      // Play game start sound
      audioManager.playSound('round-start');
      // Initialize particle system for the game container
      particleSystem.init('root');
    });

    socket.on("next-question", (question) => {
      setCurrentQuestion(question);
      setCurrentRound(question.round);
      setSelectedAnswer(null);
      setFeedback(null);
    });

    socket.on("answer-feedback", (payload) => {
      setFeedback(payload);
    });

    socket.on("score-update", ({ scores }) => {
      setScores(scores);
    });

    socket.on("all-players-ready", () => {
      setStatusMessage("Everyone is ready! Host can start the game.");
    });

    socket.on("game-completed", ({ leaderboard }) => {
      setLeaderboard(leaderboard);
      setView("results");
    });

    socket.on("room-closed", ({ message }) => {
      setErrorMessage(message || "Room closed.");
      resetToHome();
    });

    socket.on("error", ({ message }) => {
      setErrorMessage(message || "Something went wrong.");
    });

    return () => {
      socket.disconnect();
    };
  }, [username]);

  // Timer countdown effect
  useEffect(() => {
    if (view !== "game" || !currentQuestion || selectedAnswer !== null) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = prev - 1;
        
        // Play timer warning sounds
        if (newTime === 5) {
          audioManager.playSound('timer-warn');
        } else if (newTime === 0) {
          audioManager.playSound('timer-end');
          clearInterval(timer);
          handleAnswer(null);
        }
        
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [view, currentQuestion, selectedAnswer]);

  // Reset timer when new question arrives
  useEffect(() => {
    if (currentQuestion && view === "game") {
      setTimeLeft(QUESTION_TIME);
      setSelectedAnswer(null);
      setFeedback(null);
      // Play round start sound
      audioManager.playSound('round-start');
    }
  }, [currentQuestion, view]);

  // Play audio and celebration effects when feedback is received
  useEffect(() => {
    if (!feedback) return;

    const triggerEffects = async () => {
      const rect = document.querySelector('.feedback-box')?.getBoundingClientRect();
      const x = rect?.left ?? window.innerWidth / 2;
      const y = rect?.top ?? window.innerHeight / 2;

      if (feedback.isCorrect) {
        // Play correct sound
        await audioManager.playSound('correct');
        
        // Create celebration effects
        if (feedback.speedBonus) {
          // Extra celebration for speed bonus
          particleSystem.createConfetti(x, y, 40);
          particleSystem.createSparkles(x - 100, y - 50, 20);
          particleSystem.createFloatingText(x, y - 80, '⚡ SPEED BONUS!', '#FFD700');
          await audioManager.playSound('victory');
        } else {
          // Standard correct answer celebration
          particleSystem.createConfetti(x, y, 25);
          particleSystem.createFloatingText(x, y - 80, `+${feedback.pointsEarned}`, '#00FF00');
        }
        
        // Bounce effect on feedback box
        const feedbackBox = document.querySelector('.feedback-box');
        if (feedbackBox) {
          feedbackBox.classList.add('celebration-active');
          setTimeout(() => feedbackBox.classList.remove('celebration-active'), 600);
        }
      } else {
        // Play incorrect sound
        await audioManager.playSound('incorrect');
      }
    };

    triggerEffects();
  }, [feedback]);

  useEffect(() => {
    if (view === "home") {
      fetchRooms();
    }
  }, [view]);

  const fetchRooms = async () => {
    try {
      const response = await fetch(`${API_URL}/api/rooms`);
      const data = await response.json();
      setRooms(data);
    } catch (error) {
      setRooms([]);
    }
  };

  const resetToHome = () => {
    setView("home");
    setRoomCode("");
    setPlayerId(null);
    setPlayers([]);
    setIsHost(false);
    setCurrentQuestion(null);
    setCurrentRound(1);
    setTotalQuestions(0);
    setScores([]);
    setLeaderboard([]);
    setSelectedAnswer(null);
    setFeedback(null);
    setStatusMessage("");
  };

  const handleCreateRoom = () => {
    if (!username.trim()) {
      setErrorMessage("Enter a username first.");
      return;
    }
    socketRef.current?.emit("create-room", username.trim());
  };

  const handleJoinRoom = () => {
    if (!username.trim()) {
      setErrorMessage("Enter a username first.");
      return;
    }
    if (!roomCodeInput.trim()) {
      setErrorMessage("Enter a room code.");
      return;
    }
    socketRef.current?.emit("join-room", {
      roomCode: roomCodeInput.trim().toUpperCase(),
      username: username.trim(),
    });
  };

  const handleStartGame = () => {
    socketRef.current?.emit("start-game", {
      roomCode,
      topic: selectedCategory,
      difficulty,
    });
  };

  const handleReady = () => {
    if (!playerId) return;
    socketRef.current?.emit("player-ready", {
      roomCode,
      playerId,
    });
    setStatusMessage("Ready! Waiting for others...");
  };

  const handleAnswer = (answerIndex: number | null) => {
    if (!currentQuestion || !playerId || selectedAnswer !== null) return;
    setSelectedAnswer(answerIndex ?? -1);
    
    // Calculate speed bonus
    const speedFactor = timeLeft / QUESTION_TIME;
    const hasSpeedBonus = speedFactor > 0.5; // Bonus if answered in first 10 seconds
    
    socketRef.current?.emit("submit-answer", {
      roomCode,
      playerId,
      questionId: currentQuestion.id,
      answerIndex,
      timeRemaining: timeLeft,
      speedBonus: hasSpeedBonus,
    });
  };

  const handleNextQuestion = () => {
    socketRef.current?.emit("next-question", {
      roomCode,
      currentRound,
    });
  };

  const renderHome = () => (
    <div className="home">
      {/* Hero Banner */}
      <div className="hero-banner">
        <svg viewBox="0 0 1200 300" preserveAspectRatio="xMidYMid slice" className="carnival-bg">
          {/* Sky gradient background */}
          <defs>
            <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{stopColor: '#87CEEB', stopOpacity: 1}} />
              <stop offset="100%" style={{stopColor: '#E0F6FF', stopOpacity: 1}} />
            </linearGradient>
          </defs>
          <rect width="1200" height="300" fill="url(#skyGradient)" />
          
          {/* Clouds */}
          <circle cx="200" cy="50" r="30" fill="white" opacity="0.8" />
          <circle cx="220" cy="55" r="25" fill="white" opacity="0.7" />
          <circle cx="800" cy="80" r="35" fill="white" opacity="0.8" />
          <circle cx="830" cy="90" r="28" fill="white" opacity="0.7" />
          
          {/* Bunting lines */}
          <line x1="100" y1="80" x2="300" y2="100" stroke="#FFD700" strokeWidth="3" />
          <line x1="400" y1="70" x2="600" y2="85" stroke="#FF69B4" strokeWidth="3" />
          <line x1="700" y1="90" x2="900" y2="75" stroke="#00CED1" strokeWidth="3" />
          <line x1="1000" y1="80" x2="1150" y2="95" stroke="#32CD32" strokeWidth="3" />
          
          {/* Central Tent */}
          <polygon points="600,80 650,150 550,150" fill="#C084FC" />
          <polygon points="650,150 700,150 650,150 600,80" fill="#7C3AED" opacity="0.8" />
          <polygon points="550,150 600,80 550,150" fill="#9333EA" opacity="0.8" />
          
          {/* Tent entrance */}
          <ellipse cx="600" cy="150" rx="30" ry="15" fill="#2D1B69" />
          
          {/* Ground */}
          <rect y="165" width="1200" height="135" fill="#90EE90" />
          
          {/* Trees */}
          <g>
            <rect x="100" y="140" width="20" height="40" fill="#8B4513" />
            <polygon points="110,140 90,120 130,120" fill="#228B22" />
            <polygon points="110,130 85,110 135,110" fill="#32CD32" />
          </g>
          <g>
            <rect x="1050" y="135" width="25" height="45" fill="#8B4513" />
            <polygon points="1062,135 1035,110 1090,110" fill="#228B22" />
            <polygon points="1062,123 1030,98 1095,98" fill="#32CD32" />
          </g>
        </svg>
      </div>

      {/* Main Content */}
      <div className="home-content">
        {/* Left Panel - Create Room */}
        <div className="home-panel create-room-panel">
          <h2>START A NEW ROOM</h2>
          
          {/* Game Mode Cards */}
          <div className="game-modes">
            <div className="game-mode-card">
              <div className="game-mode-icon">🎮</div>
              <h3>Game Selector</h3>
              <p>Vote on what to play</p>
            </div>
            <div className="game-mode-card">
              <div className="game-mode-icon">💣</div>
              <h3>BombParty</h3>
              <p>Explosive word game</p>
            </div>
            <div className="game-mode-card">
              <div className="game-mode-icon">🥤</div>
              <h3>PopSauce</h3>
              <p>Blind test for your eyes</p>
            </div>
          </div>

          {/* Room Creation Form */}
          <div className="room-creation">
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder={username || `${username || "Guest" + Math.floor(Math.random() * 10000)}'s room`}
              className="room-name-input"
            />
            <div className="button-group">
              <div className="button-pair">
                <button className="secondary">🌐 Public</button>
                <button className="secondary">🔒 Private</button>
              </div>
              <button className="primary" onClick={handleCreateRoom}>
                Play
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel - Join Room */}
        <div className="home-panel join-room-panel">
          <h2>JOIN A PRIVATE ROOM</h2>
          
          <div className="join-form">
            <div className="form-row">
              <label>Username:</label>
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Enter your name..."
                className="username-input"
              />
            </div>
            <div className="form-row">
              <label>Code:</label>
              <div className="join-input-group">
                <input
                  value={roomCodeInput}
                  onChange={(event) =>
                    setRoomCodeInput(event.target.value.toUpperCase())
                  }
                  placeholder="Enter code..."
                  maxLength={6}
                />
                <button className="primary-icon" onClick={handleJoinRoom}>
                  Join
                </button>
              </div>
            </div>
          </div>

          {errorMessage && <p className="error">{errorMessage}</p>}
        </div>
      </div>

      {/* Room Stats Section */}
      <section className="room-stats">
        <div className="stats-header">
          <p className="stats-text">
            Play with {rooms.length} players in {Math.ceil(rooms.length / 4)} public rooms and {Math.floor(rooms.length / 2)} private rooms
          </p>
          <div className="stats-actions">
            <input type="text" placeholder="Filter..." className="filter-input" />
            <button className="refresh-btn" onClick={fetchRooms}>Refresh</button>
          </div>
        </div>

        {/* Active Rooms Grid */}
        {rooms.length === 0 ? (
          <p className="empty">No rooms yet. Create one!</p>
        ) : (
          <div className="room-grid">
            {rooms.map((room) => (
              <button
                className="room-card"
                key={room.code}
                onClick={() => setRoomCodeInput(room.code)}
              >
                <div>
                  <h3>{room.code}</h3>
                  <p>
                    {room.topic || "Custom"} • {room.difficulty || "medium"}
                  </p>
                </div>
                <span className="player-count">{room.player_count} players</span>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );

  const renderLobby = () => (
    <div className="lobby">
      <div className="lobby-header">
        <div>
          <p className="eyebrow">Room code</p>
          <h2>{roomCode}</h2>
          <p className="muted">Share this code to invite friends ({players.length}/4 players)</p>
        </div>
        <div className="lobby-actions">
          {isHost && <span className="host-badge">👑 Host</span>}
          <button onClick={resetToHome} className="ghost">
            Leave lobby
          </button>
        </div>
      </div>

      <div className="lobby-content">
        <div className="panel">
          <h3>🎮 Players</h3>
          <ul className="player-list">
            {players.map((player) => (
              <li key={player.id} className={playerId === player.id ? "self" : ""}>
                <span>{player.username}</span>
                <span className="pill">
                  {player.score} pts
                </span>
              </li>
            ))}
          </ul>
        </div>

        {isHost && (
          <div className="panel">
            <h3>🏆 Categories</h3>
            <div className="category-grid">
              {GAME_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  className={`category-btn ${selectedCategory === cat.name ? "selected" : ""}`}
                  onClick={() => setSelectedCategory(cat.name)}
                  disabled={!isHost}
                  title={cat.description}
                >
                  <span className="category-emoji">{cat.emoji}</span>
                  <span className="category-name">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="panel">
          <h3>⚙️ Game setup</h3>
          <label>
            Category
            <input
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
              disabled={!isHost}
              placeholder="Choose a category or enter custom"
            />
          </label>
          <label>
            Difficulty
            <select
              value={difficulty}
              onChange={(event) => setDifficulty(event.target.value)}
              disabled={!isHost}
            >
              <option value="easy">🟢 Easy - More time, easier questions</option>
              <option value="medium">🟡 Medium - Standard difficulty</option>
              <option value="hard">🔴 Hard - Less time, tricky questions</option>
            </select>
          </label>
          <div className="setup-actions">
            {isHost ? (
              <>
                <button className="primary" onClick={handleStartGame}>
                  🚀 Start Game
                </button>
                <p className="muted">Ready to begin? Click start!</p>
              </>
            ) : (
              <>
                <button className="primary" onClick={handleReady}>
                  ✓ Ready
                </button>
                <p className="muted">Waiting for host to start...</p>
              </>
            )}
          </div>
          {statusMessage && <p className="success-msg">{statusMessage}</p>}
          {errorMessage && <p className="error">{errorMessage}</p>}
        </div>
      </div>
    </div>
  );

  const renderGame = () => (
    <div className="game">
      <header className="game-header">
        <div className="question-info">
          <p className="eyebrow">Round {currentRound} of {totalQuestions}</p>
          <h2>{currentQuestion?.question}</h2>
        </div>
        
        <div className="game-stats">
          <div className={`timer ${timeLeft <= 5 ? "warning" : ""}`}>
            <svg className="timer-circle" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" className="timer-bg" />
              <circle 
                cx="50" 
                cy="50" 
                r="45" 
                className="timer-fill"
                style={{
                  strokeDasharray: `${(timeLeft / QUESTION_TIME) * 283} 283`,
                }}
              />
            </svg>
            <div className="timer-text">
              <span>{timeLeft}s</span>
            </div>
          </div>
          
          <div className="scoreboard">
            {scores.length === 0 ? (
              <p className="muted">No scores yet</p>
            ) : (
              scores.map((score, idx) => (
                <div key={score.username} className={`score-entry ${idx === 0 ? "first" : ""}`}>
                  <span className="rank">#{idx + 1}</span>
                  <span className="name">{score.username}</span>
                  <strong className="points">{score.score}</strong>
                </div>
              ))
            )}
          </div>
        </div>
      </header>

      <div className="options">
        {currentQuestion?.options.map((option, index) => (
          <button
            key={option}
            className={`option ${
              selectedAnswer === index ? "selected" : ""
            } ${
              feedback && index === feedback.correctAnswer ? "correct" : ""
            } ${
              feedback && selectedAnswer === index && !feedback.isCorrect ? "incorrect" : ""
            }`}
            onClick={() => handleAnswer(index)}
            disabled={selectedAnswer !== null}
          >
            <span className="option-letter">{String.fromCharCode(65 + index)}</span>
            <span className="option-text">{option}</span>
          </button>
        ))}
      </div>

      <div className="game-footer">
        {feedback && (
          <div className={`feedback-panel ${feedback.isCorrect ? "success" : "failure"}`}>
            <div className="feedback-content">
              <h3>{feedback.isCorrect ? "🎉 Correct!" : "❌ Incorrect"}</h3>
              <p className="feedback-detail">
                {feedback.isCorrect 
                  ? `The correct answer was ${String.fromCharCode(65 + feedback.correctAnswer)}`
                  : `The correct answer was ${String.fromCharCode(65 + feedback.correctAnswer)}`
                }
              </p>
              {currentQuestion?.explanation && (
                <div className="explanation-box">
                  <p className="explanation-title">💡 Did you know?</p>
                  <p className="explanation-text">{currentQuestion.explanation}</p>
                </div>
              )}
              <div className="points-breakdown">
                <span>Base points: <strong>+100</strong></span>
                {feedback.speedBonus && <span className="bonus">Speed bonus: <strong>+50</strong></span>}
                <span className="total">Total earned: <strong>+{feedback.pointsEarned}</strong></span>
              </div>
            </div>
            {isHost && currentRound < totalQuestions && (
              <button className="primary" onClick={handleNextQuestion}>
                Next question →
              </button>
            )}
            {isHost && currentRound >= totalQuestions && (
              <button className="primary" onClick={() => setView("results")}>
                View results
              </button>
            )}
          </div>
        )}
        {!feedback && (
          <p className="submitted-message">
            {selectedAnswer !== null 
              ? "Waiting for answers..."
              : "Select an answer quickly!"}
          </p>
        )}
      </div>
    </div>
  );

  const renderResults = () => (
    <div className="results">
      <div className="panel">
        <h1>🎉 Game Over! 🎉</h1>
        <p className="subtext" style={{marginTop: '1rem', marginBottom: '2rem'}}>
          Great job everyone! Check out the final standings below.
        </p>
        
        <div className="final-leaderboard">
          {leaderboard.length > 0 && (
            <div className="podium">
              {leaderboard.slice(0, 3).map((entry, idx) => (
                <div key={entry.username} className="podium-place">
                  <div className="podium-medal">
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                  </div>
                  <div className="podium-rank">
                    {idx === 0 ? '1st Place' : idx === 1 ? '2nd Place' : '3rd Place'}
                  </div>
                  <div className="name">{entry.username}</div>
                  <div className="points" style={{fontSize: '1.5rem', marginTop: '0.5rem', color: 'var(--success)'}}>
                    {entry.score} pts
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {leaderboard.length > 3 && (
            <div style={{marginTop: '2rem', textAlign: 'left'}}>
              <h3>Other Players:</h3>
              <ol style={{paddingLeft: '2rem'}}>
                {leaderboard.slice(3).map((entry, idx) => (
                  <li key={entry.username} style={{marginBottom: '0.5rem'}}>
                    <span>#{idx + 4} - {entry.username}</span>
                    <strong style={{marginLeft: '1rem'}}>{entry.score} pts</strong>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        <div style={{display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem'}}>
          <button className="primary" onClick={resetToHome} style={{flex: 1, maxWidth: '200px'}}>
            🏠 Back to home
          </button>
          <button 
            className="secondary" 
            onClick={() => {
              setPlayers([]);
              handleCreateRoom();
            }}
            style={{flex: 1, maxWidth: '200px'}}
          >
            🔄 Play Again
          </button>
        </div>
      </div>
    </div>
  );

  // Audio Control Component
  const renderAudioControls = () => (
    <div className="audio-controls">
      <button 
        className={`audio-btn ${!audioManager.isEnabled() ? 'disabled' : ''}`}
        onClick={() => audioManager.setEnabled(!audioManager.isEnabled())}
        title={audioManager.isEnabled() ? 'Mute sounds' : 'Unmute sounds'}
      >
        {audioManager.isEnabled() ? '🔊' : '🔇'}
      </button>
      <input 
        type="range" 
        min="0" 
        max="100" 
        value={audioManager.getVolume() * 100}
        onChange={(e) => audioManager.setVolume(Number(e.target.value) / 100)}
        className="volume-slider"
        title="Volume"
      />
    </div>
  );

  return (
    <>
      <svg style={{ display: 'none' }} width="0" height="0">
        <defs>
          <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
          <linearGradient id="timerWarningGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#f87171" />
          </linearGradient>
        </defs>
      </svg>
      <main className="app">
        {view === "home" && renderHome()}
        {view === "lobby" && renderLobby()}
        {view === "game" && renderGame()}
        {view === "results" && renderResults()}
        {renderAudioControls()}
      </main>
    </>
  );
}

export default App;
