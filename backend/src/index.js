const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const { setupSocketHandlers } = require("./socket");
const { all } = require("./database");

require("dotenv").config();

const app = express();
const server = http.createServer(app);

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());

// Add logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Add a test endpoint
app.get("/api/test", (req, res) => {
  res.json({ message: "Server is working!", timestamp: new Date().toISOString() });
});

// Basic route for health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "QuizSmash Server Running" });
});

// Get active rooms
app.get("/api/rooms", async (req, res) => {
  try {
    console.log("Fetching rooms...");
    const rooms = await all(`
      SELECT 
        r.id, 
        r.code, 
        r.topic, 
        r.difficulty, 
        r.status,
        r.created_at,
        COUNT(p.id) as player_count
      FROM rooms r
      LEFT JOIN players p ON r.id = p.room_id
      WHERE r.status = 'waiting'
      GROUP BY r.id, r.code, r.topic, r.difficulty, r.status, r.created_at
      ORDER BY r.created_at DESC
    `);
    console.log(`Found ${rooms.length} rooms`);
    res.json(rooms);
  } catch (error) {
    console.error("Error fetching rooms:", error);
    res.status(500).json({ error: "Failed to fetch rooms" });
  }
});

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
    skipMiddlewares: true,
  },
});

// Setup socket handlers
setupSocketHandlers(io);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔗 Test endpoint: http://localhost:${PORT}/api/test`);
  console.log(`🔗 Rooms endpoint: http://localhost:${PORT}/api/rooms`);
  console.log(`🎮 Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:5173"}`);
});