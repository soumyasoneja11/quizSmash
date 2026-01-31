const { generateQuiz } = require("./openai");
const { run, get, all } = require("./database");

function generateRoomCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function normalizeOptions(options) {
  if (Array.isArray(options)) return options;
  if (typeof options === "string") {
    try {
      return JSON.parse(options);
    } catch (error) {
      return [];
    }
  }
  return [];
}

async function createRoom(hostSocketId, username) {
  try {
    const roomCode = generateRoomCode();

    await run("BEGIN");

    // Create room
    const roomInsert = await run(
      "INSERT INTO rooms (code, host_socket_id) VALUES (?, ?)",
      [roomCode, hostSocketId],
    );

    // Add host as player
    const playerInsert = await run(
      "INSERT INTO players (room_id, username, socket_id) VALUES (?, ?, ?)",
      [roomInsert.lastID, username, hostSocketId],
    );

    const room = await get("SELECT * FROM rooms WHERE id = ?", [
      roomInsert.lastID,
    ]);
    const player = await get("SELECT * FROM players WHERE id = ?", [
      playerInsert.lastID,
    ]);

    await run("COMMIT");

    return {
      room,
      player,
    };
  } catch (error) {
    await run("ROLLBACK");
    throw error;
  }
}

async function joinRoom(roomCode, username, socketId) {
  try {
    await run("BEGIN");

    // Get room
    const room = await get(
      "SELECT * FROM rooms WHERE code = ? AND status = ?",
      [roomCode, "waiting"],
    );

    if (!room) {
      throw new Error("Room not found or already started");
    }

    // Check player count
    const playerCountResult = await get(
      "SELECT COUNT(*) as count FROM players WHERE room_id = ?",
      [room.id],
    );

    if (parseInt(playerCountResult.count, 10) >= 4) {
      throw new Error("Room is full");
    }

    // Check if username already exists in room
    const existingPlayer = await get(
      "SELECT * FROM players WHERE room_id = ? AND username = ?",
      [room.id, username],
    );

    if (existingPlayer) {
      throw new Error("Username already taken in this room");
    }

    // Add player
    const playerInsert = await run(
      "INSERT INTO players (room_id, username, socket_id) VALUES (?, ?, ?)",
      [room.id, username, socketId],
    );

    const player = await get("SELECT * FROM players WHERE id = ?", [
      playerInsert.lastID,
    ]);

    // Get all players in room
    const players = await all(
      "SELECT id, username, score, is_ready FROM players WHERE room_id = ? ORDER BY joined_at",
      [room.id],
    );

    await run("COMMIT");

    return {
      room,
      player,
      players,
    };
  } catch (error) {
    await run("ROLLBACK");
    throw error;
  }
}

async function startGame(roomCode, topic, difficulty) {
  try {
    await run("BEGIN");

    // Update room status and topic
    await run(
      "UPDATE rooms SET status = ?, topic = ?, difficulty = ? WHERE code = ?",
      ["active", topic, difficulty, roomCode],
    );

    // Generate quiz questions
    const questions = await generateQuiz(topic, difficulty, 3);

    const room = await get("SELECT * FROM rooms WHERE code = ?", [
      roomCode,
    ]);

    // Save questions to database
    for (let i = 0; i < questions.length; i++) {
      await run(
        "INSERT INTO questions (room_id, question_text, options, correct_index, explanation, round_number) VALUES (?, ?, ?, ?, ?, ?)",
        [
          room.id,
          questions[i].question,
          JSON.stringify(questions[i].options),
          questions[i].correctIndex,
          questions[i].explanation || "Great question!",
          i + 1,
        ],
      );
    }

    const players = await all(
      "SELECT id, username, socket_id, score FROM players WHERE room_id = ?",
      [room.id],
    );

    const questionsResult = await all(
      "SELECT * FROM questions WHERE room_id = ? ORDER BY round_number",
      [room.id],
    );

    await run("COMMIT");

    return {
      room,
      players,
      questions: questionsResult,
    };
  } catch (error) {
    await run("ROLLBACK");
    throw error;
  }
}

async function submitAnswer(roomCode, playerId, questionId, answerIndex, timeRemaining = 0, speedBonus = false) {
  try {
    await run("BEGIN");

    // Get question
    const question = await get("SELECT * FROM questions WHERE id = ?", [
      questionId,
    ]);

    if (!question) {
      throw new Error("Question not found");
    }

    const isCorrect = answerIndex !== null && answerIndex === question.correct_index;

    // Save answer
    await run(
      "INSERT INTO answers (player_id, question_id, selected_index, is_correct) VALUES (?, ?, ?, ?)",
      [playerId, questionId, answerIndex !== null ? answerIndex : -1, isCorrect ? 1 : 0],
    );

    // Calculate points
    let pointsEarned = 0;
    if (isCorrect) {
      const basePoints = 100;
      pointsEarned = basePoints;
      
      // Add speed bonus if answered quickly (in first 50% of time)
      if (speedBonus && timeRemaining > 0) {
        const speedBonusPoints = Math.round(50 * (timeRemaining / 20)); // 20s is default QUESTION_TIME
        pointsEarned += speedBonusPoints;
      }
      
      await run("UPDATE players SET score = score + ? WHERE id = ?", [
        pointsEarned,
        playerId,
      ]);
    }

    // Get updated player info
    const player = await get(
      "SELECT username, score FROM players WHERE id = ?",
      [playerId],
    );

    // Get room scores
    const scores = await all(
      "SELECT p.username, p.score FROM players p " +
        "JOIN rooms r ON p.room_id = r.id WHERE r.code = ? ORDER BY p.score DESC",
      [roomCode],
    );

    await run("COMMIT");

    return {
      isCorrect,
      correctAnswer: question.correct_index,
      player,
      scores,
      pointsEarned,
      speedBonus: isCorrect && speedBonus,
    };
  } catch (error) {
    await run("ROLLBACK");
    throw error;
  }
}

function setupSocketHandlers(io) {
  io.on("connection", (socket) => {
    console.log(`🔌 New connection: ${socket.id}`);

    // Create a new room
    socket.on("create-room", async (username) => {
      try {
        const { room, player } = await createRoom(socket.id, username);

        socket.join(room.code);
        socket.emit("room-created", {
          roomCode: room.code,
          playerId: player.id,
          isHost: true,
        });

        console.log(`✅ Room created: ${room.code} by ${username}`);
      } catch (error) {
        socket.emit("error", { message: error.message });
        console.error("Room creation error:", error);
      }
    });

    // Join an existing room
    socket.on("join-room", async ({ roomCode, username }) => {
      try {
        const { room, player, players } = await joinRoom(
          roomCode,
          username,
          socket.id,
        );

        socket.join(room.code);

        // Notify the joiner
        socket.emit("room-joined", {
          roomCode: room.code,
          playerId: player.id,
          players,
          isHost: false,
        });

        // Notify everyone in the room (except the joiner)
        socket.to(room.code).emit("player-joined", {
          username,
          players,
        });

        console.log(`✅ ${username} joined room: ${roomCode}`);
      } catch (error) {
        socket.emit("error", { message: error.message });
        console.error("Join room error:", error);
      }
    });

    // Host starts the game
    socket.on("start-game", async ({ roomCode, topic, difficulty }) => {
      try {
        const { room, players, questions } = await startGame(
          roomCode,
          topic,
          difficulty,
        );

        // Send first question to all players
        const firstQuestion = questions[0];
        io.to(roomCode).emit("game-started", {
          topic,
          difficulty,
          totalQuestions: questions.length,
          firstQuestion: {
            id: firstQuestion.id,
            question: firstQuestion.question_text,
            options: normalizeOptions(firstQuestion.options),
            explanation: firstQuestion.explanation,
            round: 1,
          },
          players,
        });

        console.log(`🎮 Game started in room: ${roomCode}, Topic: ${topic}`);
      } catch (error) {
        socket.emit("error", { message: error.message });
        console.error("Start game error:", error);
      }
    });

    // Player submits answer
    socket.on(
      "submit-answer",
      async ({ roomCode, playerId, questionId, answerIndex, timeRemaining, speedBonus }) => {
        try {
          const result = await submitAnswer(
            roomCode,
            playerId,
            questionId,
            answerIndex,
            timeRemaining,
            speedBonus,
          );

          // Send feedback to the player
          socket.emit("answer-feedback", {
            isCorrect: result.isCorrect,
            correctAnswer: result.correctAnswer,
            playerScore: result.player.score,
            pointsEarned: result.pointsEarned,
            speedBonus: result.speedBonus,
          });

          // Update scores for all players
          io.to(roomCode).emit("score-update", {
            scores: result.scores,
          });

          console.log(`📝 Answer submitted by player ${playerId} - Correct: ${result.isCorrect} - Points: ${result.pointsEarned}`);
        } catch (error) {
          socket.emit("error", { message: error.message });
          console.error("Submit answer error:", error);
        }
      },
    );

    // Next question
    socket.on("next-question", async ({ roomCode, currentRound }) => {
      try {
        const room = await get("SELECT * FROM rooms WHERE code = ?", [
          roomCode,
        ]);

        const questionsResult = await get(
          "SELECT * FROM questions WHERE room_id = ? AND round_number = ?",
          [room.id, currentRound + 1],
        );

        if (questionsResult) {
          const question = questionsResult;
          io.to(roomCode).emit("next-question", {
            id: question.id,
            question: question.question_text,
            options: normalizeOptions(question.options),
            explanation: question.explanation,
            round: currentRound + 1,
          });
        } else {
          // Game completed
          const scoresResult = await all(
            "SELECT p.username, p.score FROM players p " +
              "JOIN rooms r ON p.room_id = r.id WHERE r.code = ? ORDER BY p.score DESC",
            [roomCode],
          );

          // Update room status
          await run("UPDATE rooms SET status = ? WHERE code = ?", [
            "completed",
            roomCode,
          ]);

          io.to(roomCode).emit("game-completed", {
            leaderboard: scoresResult,
          });
        }
      } catch (error) {
        socket.emit("error", { message: error.message });
        console.error("Next question error:", error);
      }
    });

    // Player ready status
    socket.on("player-ready", async ({ roomCode, playerId }) => {
      try {
        await run("UPDATE players SET is_ready = 1 WHERE id = ?", [playerId]);

        // Check if all players are ready
        const playersResult = await get(
          "SELECT COUNT(*) as total, SUM(CASE WHEN is_ready = 1 THEN 1 ELSE 0 END) as ready_count " +
            "FROM players p JOIN rooms r ON p.room_id = r.id WHERE r.code = ?",
          [roomCode],
        );

        const { total, ready_count } = playersResult || {
          total: 0,
          ready_count: 0,
        };

        if (parseInt(ready_count) === parseInt(total)) {
          io.to(roomCode).emit("all-players-ready");
        }
      } catch (error) {
        console.error("Player ready error:", error);
      }
    });

    // Disconnect
    socket.on("disconnect", async () => {
      console.log(`🔌 Disconnected: ${socket.id}`);

      try {
        const player = await get(
          "SELECT id, room_id FROM players WHERE socket_id = ?",
          [socket.id],
        );

        if (!player) return;

        const room = await get("SELECT id, code FROM rooms WHERE id = ?", [
          player.room_id,
        ]);

        // Remove player from database
        await run("DELETE FROM players WHERE id = ?", [player.id]);

        // Check if room is empty
        const remaining = await get(
          "SELECT COUNT(*) as count FROM players WHERE room_id = ?",
          [player.room_id],
        );

        if (remaining && parseInt(remaining.count, 10) === 0) {
          await run("DELETE FROM rooms WHERE id = ?", [player.room_id]);
          if (room?.code) {
            io.to(room.code).emit("room-closed", {
              message: "Room closed due to inactivity",
            });
          }
        } else if (room?.code) {
          const players = await all(
            "SELECT id, username, score, is_ready FROM players WHERE room_id = ? ORDER BY joined_at",
            [player.room_id],
          );
          io.to(room.code).emit("player-left", { players });
        }
      } catch (error) {
        console.error("Disconnect cleanup error:", error);
      }
    });
  });
}

module.exports = { setupSocketHandlers };