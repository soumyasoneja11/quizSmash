import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { audioManager } from "./audio";
import { particleSystem, celebrationCSS } from "./animations";
import NeonButton from "./components/NeonButton";
import CyberCard from "./components/CyberCard";
import NeonInput from "./components/NeonInput";
import CyberHeader from "./components/CyberHeader";
import NeonProgress from "./components/NeonProgress";
import MatrixBackground from "./components/MatrixBackground";

// Types
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
  { id: "general", name: "General Knowledge", emoji: "🧠", description: "Random topics" },
  { id: "science", name: "Science", emoji: "🔬", description: "Physics, chemistry, biology" },
  { id: "history", name: "History", emoji: "📚", description: "Historical events and figures" },
  { id: "geography", name: "Geography", emoji: "🌍", description: "Countries, capitals, landmarks" },
  { id: "sports", name: "Sports", emoji: "⚽", description: "Teams, players, leagues" },
  { id: "movies", name: "Movies", emoji: "🎬", description: "Films, actors, directors" },
  { id: "music", name: "Music", emoji: "🎵", description: "Artists, songs, genres" },
  { id: "technology", name: "Technology", emoji: "💻", description: "Tech companies, innovations" },
];

const QUESTION_TIME = 20;

function App() {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // State variables
  const [view, setView] = useState<"home" | "categories" | "lobby" | "game" | "results" | "answer-reveal">("home");
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

  // Initialize socket connection
  useEffect(() => {
    console.log("Initializing socket connection to:", SOCKET_URL);
    
    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket.id);
      setConnected(true);
      setConnectionError(null);
    });

    socket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error.message);
      setConnected(false);
      setConnectionError(`Cannot connect to server: ${error.message}. Make sure backend is running on ${SOCKET_URL}`);
    });

    socket.on("disconnect", (reason) => {
      console.log("🔌 Socket disconnected:", reason);
      setConnected(false);
      if (reason === "io server disconnect") {
        setConnectionError("Server disconnected. Trying to reconnect...");
      }
    });

    socket.on("reconnect", (attemptNumber) => {
      console.log("🔄 Reconnected after", attemptNumber, "attempts");
      setConnected(true);
      setConnectionError(null);
    });

    socket.on("room-created", ({ roomCode, playerId }) => {
      console.log("Room created:", roomCode, playerId);
      setRoomCode(roomCode);
      setPlayerId(playerId);
      setIsHost(true);
      setPlayers([{ id: playerId, username, score: 0, is_ready: 1 }]);
      setView("lobby");
      setErrorMessage("");
    });

    socket.on("room-joined", ({ roomCode, playerId, players }) => {
      console.log("Room joined:", roomCode, playerId);
      setRoomCode(roomCode);
      setPlayerId(playerId);
      setPlayers(players);
      setIsHost(false);
      setView("lobby");
      setErrorMessage("");
      audioManager.playSound('join');
    });

    socket.on("player-joined", ({ players }) => {
      console.log("Player joined:", players);
      setPlayers(players);
      audioManager.playSound('join');
    });

    socket.on("player-left", ({ players }) => {
      console.log("Player left:", players);
      setPlayers(players);
    });

    socket.on("game-started", ({ firstQuestion, totalQuestions, players }) => {
      console.log("Game started:", firstQuestion);
      setPlayers(players);
      setCurrentQuestion(firstQuestion);
      setTotalQuestions(totalQuestions);
      setCurrentRound(1);
      setSelectedAnswer(null);
      setFeedback(null);
      setScores([]);
      setView("game");
      audioManager.playSound('round-start');
      particleSystem.init('root');
    });

    socket.on("next-question", (question) => {
      console.log("Next question:", question);
      setCurrentQuestion(question);
      setCurrentRound(question.round);
      setSelectedAnswer(null);
      setFeedback(null);
    });

    socket.on("answer-feedback", (payload) => {
      console.log("Answer feedback:", payload);
      setFeedback(payload);
    });

    socket.on("score-update", ({ scores }) => {
      console.log("Score update:", scores);
      setScores(scores);
    });

    socket.on("all-players-ready", () => {
      console.log("All players ready");
      setStatusMessage("Everyone is ready! Host can start the game.");
    });

    socket.on("game-completed", ({ leaderboard }) => {
      console.log("Game completed:", leaderboard);
      setLeaderboard(leaderboard);
      setView("results");
    });

    socket.on("room-closed", ({ message }) => {
      console.log("Room closed:", message);
      setErrorMessage(message || "Room closed.");
      resetToHome();
    });

    socket.on("error", ({ message }) => {
      console.error("Socket error:", message);
      setErrorMessage(message || "Something went wrong.");
    });

    return () => {
      console.log("Cleaning up socket connection");
      socket.disconnect();
    };
  }, []);

  // Test server connection
  const testConnection = async () => {
    try {
      const response = await fetch(`${API_URL}/api/test`);
      const data = await response.json();
      console.log("Server test:", data);
      return true;
    } catch (error) {
      console.error("Server test failed:", error);
      return false;
    }
  };

  // Timer countdown effect
  useEffect(() => {
    if (view !== "game" || !currentQuestion || selectedAnswer !== null) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = prev - 1;
        
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
        await audioManager.playSound('correct');
        
        if (feedback.speedBonus) {
          particleSystem.createConfetti(x, y, 40);
          particleSystem.createSparkles(x - 100, y - 50, 20);
          particleSystem.createFloatingText(x, y - 80, '⚡ SPEED BONUS!', '#FFD700');
          await audioManager.playSound('victory');
        } else {
          particleSystem.createConfetti(x, y, 25);
          particleSystem.createFloatingText(x, y - 80, `+${feedback.pointsEarned}`, '#00FF00');
        }
        
        const feedbackBox = document.querySelector('.feedback-box');
        if (feedbackBox) {
          feedbackBox.classList.add('celebration-active');
          setTimeout(() => feedbackBox.classList.remove('celebration-active'), 600);
        }
      } else {
        await audioManager.playSound('incorrect');
      }
    };

    triggerEffects();
  }, [feedback]);

  useEffect(() => {
    if (view === "home") {
      fetchRooms();
      testConnection();
    }
  }, [view]);

  const fetchRooms = async () => {
    try {
      console.log("Fetching rooms from:", `${API_URL}/api/rooms`);
      const response = await fetch(`${API_URL}/api/rooms`);
      const data = await response.json();
      console.log("Rooms fetched:", data);
      setRooms(data);
    } catch (error) {
      console.error("Failed to fetch rooms:", error);
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
    setErrorMessage("");
  };

  const handleCreateRoom = async () => {
    if (!username.trim()) {
      setErrorMessage("Enter a username first.");
      return;
    }

    if (!connected || !socketRef.current) {
      setErrorMessage("Not connected to server. Please wait...");
      const isServerUp = await testConnection();
      if (!isServerUp) {
        setErrorMessage(`Cannot connect to server at ${SOCKET_URL}. Make sure backend is running.`);
      }
      return;
    }

    console.log("Creating room with username:", username);
    socketRef.current?.emit("create-room", username.trim());
  };

  const handleJoinRoom = async () => {
    if (!username.trim()) {
      setErrorMessage("Enter a username first.");
      return;
    }
    if (!roomCodeInput.trim()) {
      setErrorMessage("Enter a room code.");
      return;
    }

    if (!connected || !socketRef.current) {
      setErrorMessage("Not connected to server. Please wait...");
      const isServerUp = await testConnection();
      if (!isServerUp) {
        setErrorMessage(`Cannot connect to server at ${SOCKET_URL}. Make sure backend is running.`);
      }
      return;
    }

    console.log("Joining room:", roomCodeInput, "with username:", username);
    socketRef.current?.emit("join-room", {
      roomCode: roomCodeInput.trim().toUpperCase(),
      username: username.trim(),
    });
  };

  const handleStartGame = () => {
    if (!socketRef.current) {
      setErrorMessage("Not connected to server");
      return;
    }
    
    console.log("Starting game with:", { roomCode, topic: selectedCategory, difficulty });
    socketRef.current?.emit("start-game", {
      roomCode,
      topic: selectedCategory,
      difficulty,
    });
  };

  const handleReady = () => {
    if (!playerId || !socketRef.current) return;
    socketRef.current?.emit("player-ready", {
      roomCode,
      playerId,
    });
    setStatusMessage("Ready! Waiting for others...");
  };

  const handleAnswer = (answerIndex: number | null) => {
    if (!currentQuestion || !playerId || selectedAnswer !== null || !socketRef.current) return;
    setSelectedAnswer(answerIndex ?? -1);
    
    const speedFactor = timeLeft / QUESTION_TIME;
    const hasSpeedBonus = speedFactor > 0.5;
    
    console.log("Submitting answer:", { 
      roomCode, 
      playerId, 
      questionId: currentQuestion.id, 
      answerIndex,
      timeRemaining: timeLeft 
    });
    
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
    if (!socketRef.current) return;
    socketRef.current?.emit("next-question", {
      roomCode,
      currentRound,
    });
  };

  const renderHome = () => {
    return (
      <div className="min-h-screen bg-cyber-black p-4 md:p-8 relative overflow-hidden crt">
        <MatrixBackground opacity={0.1} speed={1} />

        {/* Connection Status */}
        <div className="absolute top-4 right-4 z-50">
          <div className={`px-4 py-2 rounded-lg font-pixel text-sm ${
            connected 
              ? 'bg-neon-green/20 border border-neon-green text-neon-green' 
              : 'bg-neon-red/20 border border-neon-red text-neon-red'
          }`}>
            {connected ? '🟢 CONNECTED' : '🔴 DISCONNECTED'}
          </div>
        </div>

        {connectionError && (
          <div className="absolute top-16 right-4 z-50 max-w-md">
            <div className="bg-cyber-dark border-2 border-neon-red p-4 rounded-lg">
              <p className="font-pixel text-neon-red text-sm">{connectionError}</p>
              <button 
                onClick={testConnection}
                className="mt-2 px-4 py-2 bg-neon-blue text-black font-pixel text-sm"
              >
                RETRY CONNECTION
              </button>
            </div>
          </div>
        )}

        {/* Floating neon orbs */}
        <div className="absolute top-10 left-10 w-4 h-4 bg-neon-pink rounded-full animate-neon-pulse"></div>
        <div className="absolute top-20 right-20 w-4 h-4 bg-neon-blue rounded-full animate-neon-pulse delay-100"></div>
        <div className="absolute bottom-20 left-1/4 w-4 h-4 bg-neon-green rounded-full animate-neon-pulse delay-200"></div>
        <div className="absolute bottom-1/2 right-1/4 w-4 h-4 bg-neon-purple rounded-full animate-neon-pulse delay-300"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="font-cyber text-5xl md:text-7xl mb-6 animate-neon-pulse">
              <span className="bg-gradient-to-r from-neon-pink via-neon-blue to-neon-green bg-clip-text text-transparent">
                CYBER QUIZ
              </span>
            </h1>
            <p className="font-synthwave text-xl text-cyber-teal mb-8 animate-text-flicker">
              🎮 NEON TRIVIA IN THE CYBERVERSE
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Left Panel - Create Game */}
            <CyberCard
              title="CREATE GAME"
              emoji="⚡"
              glowColor="pink"
              hologram={true}
            >
              <div className="space-y-6">
                <NeonInput
                  value={username}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                  placeholder="ENTER CYBER-NAME"
                  neonColor="cyan"
                  className="text-center text-lg font-pixel"
                />

                <div className="grid grid-cols-3 gap-4">
                  {[
                    { text: '⚡ SPEED', color: 'yellow' },
                    { text: '🧠 HARD', color: 'red' },
                    { text: '🎯 CLASSIC', color: 'green' }
                  ].map((mode) => (
                    <NeonButton
                      key={mode.text}
                      variant={mode.color as any}
                      size="sm"
                      className="w-full"
                    >
                      {mode.text}
                    </NeonButton>
                  ))}
                </div>

                <div className="pt-4 border-t-2 border-cyber-light">
                  <NeonButton
                    variant="pink"
                    size="lg"
                    className="w-full"
                    onClick={handleCreateRoom}
                    glow={true}
                    disabled={!connected}
                  >
                    {connected ? '🚀 INITIATE GAME' : '⏳ CONNECTING...'}
                  </NeonButton>
                </div>
              </div>
            </CyberCard>

            {/* Right Panel - Join Game */}
            <CyberCard
              title="JOIN GAME"
              emoji="🔗"
              glowColor="blue"
            >
              <div className="space-y-6">
                <div className="space-y-4">
                  <NeonInput
                    value={roomCodeInput}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRoomCodeInput(e.target.value.toUpperCase())}
                    placeholder="ENTER ACCESS CODE"
                    maxLength={6}
                    neonColor="purple"
                    className="text-center text-2xl tracking-widest font-matrix"
                  />

                  <div className="grid grid-cols-6 gap-2">
                    {['A', 'B', 'C', 'D', 'E', 'F'].map((letter) => (
                      <NeonButton
                        key={letter}
                        variant="cyan"
                        size="sm"
                        className="font-matrix"
                        onClick={() => setRoomCodeInput((prev: string) => (prev + letter).slice(0, 6))}
                      >
                        {letter}
                      </NeonButton>
                    ))}
                  </div>
                </div>

                <NeonButton
                  variant="green"
                  size="lg"
                  className="w-full"
                  onClick={handleJoinRoom}
                  glow={true}
                  disabled={!connected}
                >
                  {connected ? '🔗 CONNECT TO SERVER' : '⏳ CONNECTING...'}
                </NeonButton>

                {errorMessage && (
                  <div className="font-pixel text-neon-red text-center animate-glitch">
                    ⚠️ {errorMessage}
                  </div>
                )}
              </div>
            </CyberCard>
          </div>

          {/* Active Games Section */}
          <CyberCard title="ACTIVE SERVERS" emoji="🌐" glowColor="yellow">
            <div className="flex justify-between items-center mb-6">
              <p className="font-synthwave text-cyber-teal">
                {rooms.length} SERVERS ONLINE • {rooms.reduce((acc: number, r: Room) => acc + r.player_count, 0)} ACTIVE PLAYERS
              </p>
              <div className="flex gap-2">
                <NeonButton
                  variant="cyan"
                  size="sm"
                  onClick={fetchRooms}
                  glow={true}
                >
                  🔄 RESCAN
                </NeonButton>
                <NeonButton
                  variant="blue"
                  size="sm"
                  onClick={testConnection}
                >
                  🔌 TEST SERVER
                </NeonButton>
              </div>
            </div>

            {rooms.length === 0 ? (
              <div className="text-center py-12">
                <div className="font-cyber text-neon-purple text-6xl mb-4 animate-neon-flicker">404</div>
                <p className="font-matrix text-cyber-light">NO SERVERS DETECTED</p>
                <p className="font-matrix text-cyber-teal text-sm mt-2">Start a new game to create the first server!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rooms.map((room: Room) => (
                  <button
                    key={room.code}
                    className="text-left bg-cyber-gray border-2 border-cyber-light p-4 
                             hover:border-neon-blue hover:scale-105 transition-all duration-300
                             group relative"
                    onClick={() => setRoomCodeInput(room.code)}
                  >
                    <div className="absolute inset-0 bg-neon-blue opacity-0 group-hover:opacity-10 transition-opacity"></div>
                    
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-cyber text-white group-hover:text-neon-cyan transition-colors">
                          {room.code}
                        </h3>
                        <span className="font-pixel text-neon-yellow bg-cyber-black px-2 py-1 border border-neon-yellow">
                          {room.player_count}/4
                        </span>
                      </div>
                      <div className="font-matrix text-sm text-cyber-teal space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-neon-pink">📍</span>
                          <span>{room.topic || "CYBER-CORE"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-neon-green">⚡</span>
                          <span>{room.difficulty?.toUpperCase() || "MEDIUM"}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex-1 h-1 bg-cyber-black">
                            <div 
                              className="h-full bg-gradient-to-r from-neon-pink to-neon-blue"
                              style={{ width: `${(room.player_count / 4) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-neon-yellow">CLICK TO JOIN</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CyberCard>

          {/* Server Info */}
          <div className="mt-8 text-center">
            <div className="inline-block bg-cyber-dark border border-cyber-light p-4 rounded-lg">
              <p className="font-matrix text-sm text-cyber-light">
                SERVER: <span className="text-neon-cyan">{SOCKET_URL}</span> | 
                STATUS: <span className={connected ? "text-neon-green" : "text-neon-red"}>
                  {connected ? "OPERATIONAL" : "OFFLINE"}
                </span>
              </p>
              {!connected && (
                <p className="font-matrix text-xs text-neon-yellow mt-2">
                  Make sure backend server is running on port 5000
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Lobby View
  const renderLobby = () => (
    <div className="min-h-screen bg-cyber-black p-4 md:p-8 relative crt">
      <MatrixBackground opacity={0.05} speed={0.5} />
      
      <div className="max-w-6xl mx-auto relative z-10">
        <CyberHeader
          title="LOBBY"
          subtitle={`SERVER: ${roomCode}`}
          score={players.find(p => p.id === playerId)?.score || 0}
          showGlitch={true}
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <CyberCard title="PLAYERS" emoji="👥" glowColor="cyan" className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {players.map((player: Player, index: number) => (
                <div
                  key={player.id}
                  className={`p-4 border-2 ${
                    playerId === player.id 
                      ? 'border-neon-yellow bg-cyber-dark/50' 
                      : 'border-cyber-light bg-cyber-dark'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-pixel text-neon-purple">#{index + 1}</span>
                      <span className="font-cyber text-white">{player.username}</span>
                      {isHost && player.id === playerId && (
                        <span className="font-pixel text-xs bg-neon-pink px-2 py-1 text-black">HOST</span>
                      )}
                    </div>
                    <span className="font-pixel text-neon-yellow">
                      {player.score} PTS
                    </span>
                  </div>
                  {player.is_ready === 1 && (
                    <div className="mt-2 font-synthwave text-neon-green text-sm animate-neon-pulse">
                      ✅ READY
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CyberCard>

          {/* Game Settings */}
          <CyberCard title="SETTINGS" emoji="⚙️" glowColor="purple">
            <div className="space-y-6">
              <div>
                <label className="font-cyber text-neon-cyan mb-2 block">CATEGORY</label>
                <select 
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full font-matrix bg-cyber-black border-2 border-neon-blue p-3 text-white"
                >
                  {GAME_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.name}>
                      {cat.emoji} {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="font-cyber text-neon-cyan mb-2 block">DIFFICULTY</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { text: 'EASY', color: 'green' },
                    { text: 'MEDIUM', color: 'yellow' },
                    { text: 'HARD', color: 'red' }
                  ].map(diff => (
                    <NeonButton
                      key={diff.text}
                      variant={diff.color as any}
                      size="sm"
                      className="w-full"
                      onClick={() => setDifficulty(diff.text.toLowerCase())}
                      glow={difficulty === diff.text.toLowerCase()}
                    >
                      {diff.text}
                    </NeonButton>
                  ))}
                </div>
              </div>
              
              <NeonProgress 
                value={players.filter(p => p.is_ready === 1).length}
                max={players.length}
                label="READY PLAYERS"
                color="cyan"
                glow={true}
              />
              
              <div className="space-y-3 pt-4 border-t-2 border-cyber-light">
                {isHost ? (
                  <NeonButton
                    variant="green"
                    className="w-full"
                    onClick={handleStartGame}
                    disabled={players.length < 2}
                    glow={players.length >= 2}
                  >
                    🚀 INITIATE GAME ({players.length}/4)
                  </NeonButton>
                ) : (
                  <NeonButton
                    variant="blue"
                    className="w-full"
                    onClick={handleReady}
                  >
                    ✅ READY UP
                  </NeonButton>
                )}
                
                <NeonButton
                  variant="red"
                  className="w-full"
                  onClick={resetToHome}
                >
                  🏃 DISCONNECT
                </NeonButton>
              </div>
              {statusMessage && (
                <div className="font-synthwave text-neon-green text-center mt-2 animate-text-flicker">
                  {statusMessage}
                </div>
              )}
              {errorMessage && (
                <div className="font-pixel text-neon-red text-center animate-glitch">
                  ⚠️ {errorMessage}
                </div>
              )}
            </div>
          </CyberCard>
        </div>
      </div>
    </div>
  );

  // Game View
  const renderGame = () => (
    <div className="min-h-screen bg-cyber-black p-4 md:p-8 relative crt">
      <MatrixBackground opacity={0.05} speed={0.8} />
      
      <div className="max-w-6xl mx-auto relative z-10">
        <CyberHeader
          title={`ROUND ${currentRound}/${totalQuestions}`}
          score={players.find(p => p.id === playerId)?.score || 0}
          timeLeft={timeLeft}
          showGlitch={true}
        />
        
        <CyberCard title="QUESTION" emoji="❓" glowColor="blue" className="mb-8">
          <h2 className="font-cyber text-2xl text-white mb-6 animate-text-flicker">
            {currentQuestion?.question}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentQuestion?.options.map((option, index) => (
              <button
                key={option}
                className={`p-4 border-2 text-left transition-all ${
                  selectedAnswer === index
                    ? 'border-neon-yellow bg-cyber-dark/50'
                    : 'border-cyber-light bg-cyber-dark hover:bg-cyber-gray'
                } ${
                  feedback && index === feedback.correctAnswer
                    ? 'border-neon-green bg-neon-green/10'
                    : ''
                } ${
                  feedback && selectedAnswer === index && !feedback.isCorrect
                    ? 'border-neon-red bg-neon-red/10'
                    : ''
                }`}
                onClick={() => handleAnswer(index)}
                disabled={selectedAnswer !== null}
              >
                <div className="flex items-center gap-4">
                  <div className="font-cyber w-10 h-10 flex items-center justify-center border-2 border-black bg-cyber-black text-neon-blue">
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span className="font-synthwave text-white">{option}</span>
                </div>
              </button>
            ))}
          </div>
        </CyberCard>

        {feedback && (
          <CyberCard 
            title={feedback.isCorrect ? "CORRECT! 🎉" : "INCORRECT ❌"} 
            emoji={feedback.isCorrect ? "✅" : "❌"}
            glowColor={feedback.isCorrect ? "green" : "red"}
            className="feedback-box"
          >
            <div className="space-y-4">
              <p className="font-synthwave text-white">
                The correct answer was: <span className="font-cyber text-neon-cyan">
                  {String.fromCharCode(65 + feedback.correctAnswer)}
                </span>
              </p>
              
              {currentQuestion?.explanation && (
                <div className="bg-cyber-dark border-2 border-cyber-light p-4">
                  <p className="font-cyber text-neon-yellow mb-2">💡 CYBER-INTEL:</p>
                  <p className="font-matrix text-cyber-teal">{currentQuestion.explanation}</p>
                </div>
              )}
              
              <div className="bg-cyber-dark border-2 border-cyber-light p-4">
                <div className="font-cyber text-white space-y-2">
                  <div className="flex justify-between">
                    <span>Base points:</span>
                    <span className="text-neon-green">+100</span>
                  </div>
                  {feedback.speedBonus && (
                    <div className="flex justify-between">
                      <span>Speed bonus:</span>
                      <span className="text-neon-yellow">+50</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t-2 border-cyber-light pt-2">
                    <span>Total earned:</span>
                    <span className="text-neon-cyan">+{feedback.pointsEarned}</span>
                  </div>
                </div>
              </div>
              
              {isHost && currentRound < totalQuestions && (
                <NeonButton
                  variant="pink"
                  className="w-full"
                  onClick={handleNextQuestion}
                  glow={true}
                >
                  NEXT ROUND →
                </NeonButton>
              )}
              {isHost && currentRound >= totalQuestions && (
                <NeonButton
                  variant="green"
                  className="w-full"
                  onClick={() => setView("results")}
                  glow={true}
                >
                  VIEW RESULTS
                </NeonButton>
              )}
            </div>
          </CyberCard>
        )}

        {!feedback && selectedAnswer !== null && (
          <div className="text-center mt-8">
            <p className="font-synthwave text-cyber-teal animate-text-flicker">
              ✅ ANSWER UPLOADED! AWAITING OTHER PLAYERS...
            </p>
          </div>
        )}

        <CyberCard title="LEADERBOARD" emoji="🏆" glowColor="yellow" className="mt-8">
          <div className="space-y-2">
            {scores.length === 0 ? (
              <p className="font-synthwave text-cyber-light text-center py-4">
                NO DATA STREAM DETECTED
              </p>
            ) : (
              scores.map((score, idx) => (
                <div
                  key={score.username}
                  className={`flex justify-between items-center p-3 border-2 ${
                    idx === 0
                      ? 'border-neon-yellow bg-yellow-900/10'
                      : 'border-cyber-light bg-cyber-dark'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-pixel text-cyber-light">#{idx + 1}</span>
                    <span className="font-cyber text-white">{score.username}</span>
                    {score.username === username && (
                      <span className="font-pixel text-xs bg-neon-pink px-2 py-1 text-black">YOU</span>
                    )}
                  </div>
                  <span className="font-pixel text-neon-yellow">
                    {score.score} PTS
                  </span>
                </div>
              ))
            )}
          </div>
        </CyberCard>
      </div>
    </div>
  );

  // Results View
  const renderResults = () => (
    <div className="min-h-screen bg-cyber-black p-4 md:p-8 relative crt">
      <MatrixBackground opacity={0.05} speed={0.3} />
      
      <div className="max-w-4xl mx-auto relative z-10">
        <CyberCard title="MISSION COMPLETE!" emoji="🏆" glowColor="pink" hologram={true} className="text-center">
          <h1 className="font-cyber text-4xl text-white mb-6 animate-neon-pulse">
            🎉 CYBER-VICTORY! 🎉
          </h1>
          
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {leaderboard.slice(0, 3).map((entry, idx) => (
                <div
                  key={entry.username}
                  className={`p-6 border-4 ${
                    idx === 0
                      ? 'border-neon-yellow bg-yellow-900/20'
                      : idx === 1
                      ? 'border-cyber-light bg-cyber-dark'
                      : 'border-neon-orange bg-orange-900/20'
                  }`}
                >
                  <div className="font-cyber text-5xl mb-4">
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                  </div>
                  <div className="font-cyber text-xl text-white mb-2">
                    {entry.username}
                  </div>
                  <div className="font-cyber text-3xl text-neon-yellow">
                    {entry.score} PTS
                  </div>
                </div>
              ))}
            </div>

            {leaderboard.length > 3 && (
              <div className="bg-cyber-dark border-4 border-cyber-light p-6">
                <h3 className="font-cyber text-white mb-4">OTHER OPERATIVES</h3>
                <div className="space-y-2">
                  {leaderboard.slice(3).map((entry, idx) => (
                    <div
                      key={entry.username}
                      className="flex justify-between items-center p-3 bg-cyber-black border-2 border-cyber-light"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-pixel text-cyber-light">#{idx + 4}</span>
                        <span className="font-cyber text-white">{entry.username}</span>
                      </div>
                      <span className="font-pixel text-neon-yellow">
                        {entry.score} PTS
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t-2 border-cyber-light">
              <NeonButton
                variant="blue"
                className="w-full"
                onClick={resetToHome}
                glow={true}
              >
                🏠 RETURN TO HUB
              </NeonButton>
              <NeonButton
                variant="green"
                className="w-full"
                onClick={() => {
                  if (isHost) {
                    handleStartGame();
                  } else {
                    setView("lobby");
                  }
                }}
                glow={true}
              >
                🔄 RESTART SIMULATION
              </NeonButton>
            </div>
          </div>
        </CyberCard>
      </div>
    </div>
  );

  // Audio Control Component
  const renderAudioControls = () => (
    <div className="fixed bottom-4 right-4 z-50 flex gap-2 bg-cyber-dark/90 border-2 border-neon-blue p-3 backdrop-blur-sm">
      <button 
        className={`w-10 h-10 flex items-center justify-center border-2 border-black ${
          !audioManager.isEnabled() ? 'bg-cyber-gray' : 'bg-neon-purple'
        }`}
        onClick={() => audioManager.setEnabled(!audioManager.isEnabled())}
        title={audioManager.isEnabled() ? 'Mute sounds' : 'Unmute sounds'}
      >
        <span className="font-pixel text-sm">
          {audioManager.isEnabled() ? '🔊' : '🔇'}
        </span>
      </button>
      <input 
        type="range" 
        min="0" 
        max="100" 
        value={audioManager.getVolume() * 100}
        onChange={(e) => audioManager.setVolume(Number(e.target.value) / 100)}
        className="w-24 accent-neon-blue"
        title="Volume"
      />
    </div>
  );

  return (
    <>
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