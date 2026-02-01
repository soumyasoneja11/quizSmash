import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { audioManager } from "./audio";
import { particleSystem, celebrationCSS } from "./animations";
import PixelButton from "./components/PixelButton";
import PixelCard from "./components/PixelCard";
import PixelInput from "./components/PixelInput";
import GameHeader from "./components/GameHeader";
import PixelProgress from "./components/PixelProgress";

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
      audioManager.playSound('join');
    });

    socket.on("player-joined", ({ players }) => {
      setPlayers(players);
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
      audioManager.playSound('round-start');
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
    }
  }, [view]);

  const fetchRooms = async () => {
    try {
      const response = await fetch(`${API_URL}/api/rooms`);
      const data = await response.json();
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
    
    const speedFactor = timeLeft / QUESTION_TIME;
    const hasSpeedBonus = speedFactor > 0.5;
    
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

  const renderHome = () => {
    return (
      <div className="min-h-screen bg-gray-900 p-4 md:p-8 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-pixel-grid bg-[length:20px_20px] opacity-10"></div>

        {/* Floating pixels */}
        <div className="absolute top-10 left-10 w-4 h-4 bg-pixel-purple animate-bounce"></div>
        <div className="absolute top-20 right-20 w-4 h-4 bg-pixel-cyan animate-bounce delay-100"></div>
        <div className="absolute bottom-20 left-1/4 w-4 h-4 bg-pixel-yellow animate-bounce delay-200"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="font-pixel text-5xl md:text-7xl text-white mb-6 animate-pulse">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-pixel-purple via-pixel-cyan to-pixel-yellow">
                PIXEL QUIZ
              </span>
            </h1>
            <p className="font-silkscreen text-xl text-gray-300 mb-8">
              🎮 Test your knowledge in this pixelated trivia adventure!
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Left Panel - Create Room */}
            <PixelCard
              title="CREATE GAME"
              emoji="🎮"
              glow={true}
              borderColor="border-pixel-purple"
            >
              <div className="space-y-6">
                <PixelInput
                  value={username}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                  placeholder="ENTER PLAYER NAME"
                  className="text-center text-lg" 
                />

                <div className="grid grid-cols-3 gap-4">
                  {['🎯 CLASSIC', '⚡ SPEED', '💀 HARD'].map((mode) => (
                    <button
                      key={mode}
                      className="font-pixel text-sm bg-gray-900 border-2 border-black p-4 hover:bg-gray-800 hover:scale-105 transition-transform"
                    >
                      {mode}
                    </button>
                  ))}
                </div>

                <div className="pt-4 border-t-2 border-gray-700">
                  <PixelButton
                    variant="primary"
                    size="lg"
                    className="w-full"
                    onClick={handleCreateRoom}
                    glow={true}
                  >
                    🚀 START GAME
                  </PixelButton>
                </div>
              </div>
            </PixelCard>

            {/* Right Panel - Join Room */}
            <PixelCard
              title="JOIN GAME"
              emoji="🔗"
              borderColor="border-pixel-blue"
            >
              <div className="space-y-6">
                <div className="space-y-4">
                  <PixelInput
                    value={roomCodeInput}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRoomCodeInput(e.target.value.toUpperCase())}
                    placeholder="ENTER GAME CODE"
                    maxLength={6}
                    className="text-center text-2xl tracking-widest" 
                  />

                  <div className="flex gap-4">
                    {['A', 'B', 'C', 'D', 'E', 'F'].map((letter) => (
                      <button
                        key={letter}
                        className="flex-1 font-pixel bg-gray-900 border-2 border-black p-3 hover:bg-gray-800"
                        onClick={() => setRoomCodeInput(prev => (prev + letter).slice(0, 6))}
                      >
                        {letter}
                      </button>
                    ))}
                  </div>
                </div>

                <PixelButton
                  variant="secondary"
                  size="lg"
                  className="w-full"
                  onClick={handleJoinRoom}
                >
                  🔗 JOIN ROOM
                </PixelButton>

                {errorMessage && (
                  <div className="font-pixel text-pixel-red text-center animate-pixel-shake">
                    ⚠️ {errorMessage}
                  </div>
                )}
              </div>
            </PixelCard>
          </div>

          {/* Active Rooms Section */}
          <PixelCard title="ACTIVE GAMES" emoji="🌐">
            <div className="flex justify-between items-center mb-6">
              <p className="font-silkscreen text-gray-400">
                {rooms.length} games online • {rooms.reduce((acc: number, r: Room) => acc + r.player_count, 0)} players
              </p>
              <PixelButton
                variant="info"
                size="sm"
                onClick={fetchRooms}
              >
                🔄 REFRESH
              </PixelButton>
            </div>

            {rooms.length === 0 ? (
              <div className="text-center py-12">
                <div className="font-pixel text-gray-500 text-6xl mb-4">?</div>
                <p className="font-silkscreen text-gray-400">No active games found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rooms.map((room: Room) => (
                  <button
                    key={room.code}
                    className="text-left bg-gray-900 border-2 border-black p-4 hover:bg-gray-800 hover:scale-105 transition-transform group"
                    onClick={() => setRoomCodeInput(room.code)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-pixel text-white group-hover:text-pixel-cyan transition-colors">
                        {room.code}
                      </h3>
                      <span className="font-pixel text-pixel-yellow bg-black px-2 py-1">
                        {room.player_count}/8
                      </span>
                    </div>
                    <div className="font-silkscreen text-sm text-gray-400 space-y-1">
                      <div>📍 {room.topic || "Random"}</div>
                      <div>⚡ {room.difficulty?.toUpperCase() || "MEDIUM"}</div>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 h-2 bg-gray-800">
                          <div
                            className="h-full bg-pixel-green"
                            style={{ width: `${(room.player_count / 8) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-xs">JOIN</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </PixelCard>
        </div>
      </div>
    );
  };

  // Lobby View
  const renderLobby = () => (
    <div className="min-h-screen bg-gray-900 p-4 md:p-8">
      <GameHeader
        title="LOBBY"
        subtitle={`ROOM: ${roomCode}`}
        score={players.find(p => p.id === playerId)?.score || 0}
      />
      
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Players List */}
          <PixelCard title="PLAYERS" emoji="👥" className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {players.map((player: Player, index: number) => (
                <div
                  key={player.id}
                  className={`p-4 border-4 ${
                    playerId === player.id 
                      ? 'border-pixel-yellow bg-gray-800' 
                      : 'border-black bg-gray-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-pixel text-gray-400">#{index + 1}</span>
                      <span className="font-pixel text-white">{player.username}</span>
                      {isHost && player.id === playerId && (
                        <span className="font-pixel text-xs bg-pixel-purple px-2 py-1">HOST</span>
                      )}
                    </div>
                    <span className="font-pixel text-pixel-yellow">
                      {player.score} PTS
                    </span>
                  </div>
                  {player.is_ready === 1 && (
                    <div className="mt-2 font-silkscreen text-green-400 text-sm">
                      ✅ READY
                    </div>
                  )}
                </div>
              ))}
            </div>
          </PixelCard>

          {/* Game Settings */}
          <PixelCard title="SETTINGS" emoji="⚙️">
            <div className="space-y-6">
              <div>
                <label className="font-pixel text-gray-300 mb-2 block">CATEGORY</label>
                <select 
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full font-silkscreen bg-gray-900 border-4 border-black p-3 text-white"
                >
                  {GAME_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.name}>
                      {cat.emoji} {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="font-pixel text-gray-300 mb-2 block">DIFFICULTY</label>
                <div className="grid grid-cols-3 gap-2">
                  {['EASY', 'MEDIUM', 'HARD'].map(diff => (
                    <button
                      key={diff}
                      className={`font-pixel p-2 border-4 ${
                        difficulty === diff.toLowerCase()
                          ? 'border-pixel-green bg-gray-800'
                          : 'border-black bg-gray-900'
                      }`}
                      onClick={() => setDifficulty(diff.toLowerCase())}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>
              
              <PixelProgress 
                value={players.filter(p => p.is_ready === 1).length}
                max={players.length}
                label="READY PLAYERS"
                color="green"
              />
              
              <div className="space-y-3 pt-4 border-t-2 border-gray-700">
                {isHost ? (
                  <PixelButton
                    variant="success"
                    className="w-full"
                    onClick={handleStartGame}
                    disabled={players.length < 2}
                    glow={players.length >= 2}
                  >
                    🚀 START GAME ({players.length}/8)
                  </PixelButton>
                ) : (
                  <PixelButton
                    variant="primary"
                    className="w-full"
                    onClick={handleReady}
                  >
                    ✅ READY UP
                  </PixelButton>
                )}
                
                <PixelButton
                  variant="danger"
                  className="w-full"
                  onClick={resetToHome}
                >
                  🏃 LEAVE
                </PixelButton>
              </div>
              {statusMessage && (
                <div className="font-silkscreen text-green-400 text-center mt-2">
                  {statusMessage}
                </div>
              )}
            </div>
          </PixelCard>
        </div>
      </div>
    </div>
  );

  // Game View
  const renderGame = () => (
    <div className="min-h-screen bg-gray-900 p-4 md:p-8">
      <GameHeader
        title={`ROUND ${currentRound}/${totalQuestions}`}
        score={players.find(p => p.id === playerId)?.score || 0}
        timeLeft={timeLeft}
        showTimer={true}
        lives={3}
      />
      
      <div className="max-w-6xl mx-auto">
        <PixelCard title="QUESTION" emoji="❓" className="mb-8">
          <h2 className="font-pixel text-2xl text-white mb-6">
            {currentQuestion?.question}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentQuestion?.options.map((option, index) => (
              <button
                key={option}
                className={`p-4 border-4 text-left transition-all ${
                  selectedAnswer === index
                    ? 'border-pixel-yellow bg-gray-800'
                    : 'border-black bg-gray-900 hover:bg-gray-800'
                } ${
                  feedback && index === feedback.correctAnswer
                    ? 'border-pixel-green bg-green-900/20'
                    : ''
                } ${
                  feedback && selectedAnswer === index && !feedback.isCorrect
                    ? 'border-pixel-red bg-red-900/20'
                    : ''
                }`}
                onClick={() => handleAnswer(index)}
                disabled={selectedAnswer !== null}
              >
                <div className="flex items-center gap-4">
                  <div className="font-pixel w-10 h-10 flex items-center justify-center border-2 border-black bg-gray-800">
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span className="font-silkscreen text-white">{option}</span>
                </div>
              </button>
            ))}
          </div>
        </PixelCard>

        {feedback && (
          <PixelCard 
            title={feedback.isCorrect ? "CORRECT! 🎉" : "INCORRECT ❌"} 
            emoji={feedback.isCorrect ? "✅" : "❌"}
            borderColor={feedback.isCorrect ? "border-pixel-green" : "border-pixel-red"}
            className="feedback-box"
          >
            <div className="space-y-4">
              <p className="font-silkscreen text-white">
                The correct answer was: <span className="font-pixel text-pixel-cyan">
                  {String.fromCharCode(65 + feedback.correctAnswer)}
                </span>
              </p>
              
              {currentQuestion?.explanation && (
                <div className="bg-gray-800 border-2 border-black p-4">
                  <p className="font-pixel text-pixel-yellow mb-2">💡 DID YOU KNOW?</p>
                  <p className="font-silkscreen text-gray-300">{currentQuestion.explanation}</p>
                </div>
              )}
              
              <div className="bg-gray-800 border-2 border-black p-4">
                <div className="font-pixel text-white space-y-2">
                  <div className="flex justify-between">
                    <span>Base points:</span>
                    <span className="text-pixel-green">+100</span>
                  </div>
                  {feedback.speedBonus && (
                    <div className="flex justify-between">
                      <span>Speed bonus:</span>
                      <span className="text-pixel-yellow">+50</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t-2 border-gray-700 pt-2">
                    <span>Total earned:</span>
                    <span className="text-pixel-cyan">+{feedback.pointsEarned}</span>
                  </div>
                </div>
              </div>
              
              {isHost && currentRound < totalQuestions && (
                <PixelButton
                  variant="primary"
                  className="w-full"
                  onClick={handleNextQuestion}
                >
                  NEXT QUESTION →
                </PixelButton>
              )}
              {isHost && currentRound >= totalQuestions && (
                <PixelButton
                  variant="success"
                  className="w-full"
                  onClick={() => setView("results")}
                >
                  VIEW RESULTS
                </PixelButton>
              )}
            </div>
          </PixelCard>
        )}

        {!feedback && selectedAnswer !== null && (
          <div className="text-center mt-8">
            <p className="font-silkscreen text-gray-400">
              ✅ Answer submitted! Waiting for other players...
            </p>
          </div>
        )}

        <PixelCard title="LEADERBOARD" emoji="🏆" className="mt-8">
          <div className="space-y-2">
            {scores.length === 0 ? (
              <p className="font-silkscreen text-gray-400 text-center py-4">
                No scores yet
              </p>
            ) : (
              scores.map((score, idx) => (
                <div
                  key={score.username}
                  className={`flex justify-between items-center p-3 border-2 ${
                    idx === 0
                      ? 'border-pixel-yellow bg-yellow-900/10'
                      : 'border-black bg-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-pixel text-gray-400">#{idx + 1}</span>
                    <span className="font-pixel text-white">{score.username}</span>
                    {score.username === username && (
                      <span className="font-pixel text-xs bg-pixel-purple px-2 py-1">YOU</span>
                    )}
                  </div>
                  <span className="font-pixel text-pixel-yellow">
                    {score.score} PTS
                  </span>
                </div>
              ))
            )}
          </div>
        </PixelCard>
      </div>
    </div>
  );

  // Results View
  const renderResults = () => (
    <div className="min-h-screen bg-gray-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <PixelCard title="GAME OVER!" emoji="🏆" glow={true} className="text-center">
          <h1 className="font-pixel text-4xl text-white mb-6">
            🎉 FINAL RESULTS 🎉
          </h1>
          
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {leaderboard.slice(0, 3).map((entry, idx) => (
                <div
                  key={entry.username}
                  className={`p-6 border-4 ${
                    idx === 0
                      ? 'border-pixel-yellow bg-yellow-900/20'
                      : idx === 1
                      ? 'border-gray-400 bg-gray-800'
                      : 'border-amber-700 bg-amber-900/20'
                  }`}
                >
                  <div className="font-pixel text-5xl mb-4">
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                  </div>
                  <div className="font-pixel text-xl text-white mb-2">
                    {entry.username}
                  </div>
                  <div className="font-pixel text-3xl text-pixel-yellow">
                    {entry.score} PTS
                  </div>
                </div>
              ))}
            </div>

            {leaderboard.length > 3 && (
              <div className="bg-gray-800 border-4 border-black p-6">
                <h3 className="font-pixel text-white mb-4">OTHER PLAYERS</h3>
                <div className="space-y-2">
                  {leaderboard.slice(3).map((entry, idx) => (
                    <div
                      key={entry.username}
                      className="flex justify-between items-center p-3 bg-gray-900 border-2 border-black"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-pixel text-gray-400">#{idx + 4}</span>
                        <span className="font-pixel text-white">{entry.username}</span>
                      </div>
                      <span className="font-pixel text-pixel-yellow">
                        {entry.score} PTS
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t-2 border-gray-700">
              <PixelButton
                variant="primary"
                className="w-full"
                onClick={resetToHome}
              >
                🏠 BACK TO HOME
              </PixelButton>
              <PixelButton
                variant="secondary"
                className="w-full"
                onClick={() => {
                  if (isHost) {
                    handleStartGame();
                  } else {
                    setView("lobby");
                  }
                }}
              >
                🔄 PLAY AGAIN
              </PixelButton>
            </div>
          </div>
        </PixelCard>
      </div>
    </div>
  );

  // Audio Control Component
  const renderAudioControls = () => (
    <div className="fixed bottom-4 right-4 z-50 flex gap-2 bg-gray-900 border-4 border-black p-3">
      <button 
        className={`w-10 h-10 flex items-center justify-center border-2 border-black ${
          !audioManager.isEnabled() ? 'bg-gray-700' : 'bg-pixel-purple'
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
        className="w-24"
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