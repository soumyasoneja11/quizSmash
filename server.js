import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors({
  origin: 'http://localhost:5173', // This is your React URL
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json()); // Allows the server to read JSON data

const PORT = 5000;

// MOCK DATABASE
const USERS = [
  { username: "SNIGDHA", password: "admin123" },
  { username: "SHUBHU", password: "soulmate2026" } // Based on your soulmate's name
];

// LOGIN ROUTE
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  const user = USERS.find(u => 
    u.username.toUpperCase() === username.toUpperCase() && 
    u.password === password
  );

  if (user) {
    res.json({ success: true, message: "ACCESS GRANTED" });
  } else {
    res.status(401).json({ success: false, message: "INVALID CREDENTIALS" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 BACKEND ENGINE RUNNING AT http://localhost:${PORT}`);
});