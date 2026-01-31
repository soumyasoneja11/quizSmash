#!/usr/bin/env bash
# QuizSmash Quick Start Script - Development

echo "🚀 QuizSmash Quick Start"
echo "======================="
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Install from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js $(node --version) found"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
echo ""

echo "Backend:"
cd backend
npm install
if [ $? -ne 0 ]; then
    echo "❌ Backend installation failed"
    exit 1
fi
cd ..

echo ""
echo "Frontend:"
cd frontend
npm install
if [ $? -ne 0 ]; then
    echo "❌ Frontend installation failed"
    exit 1
fi
cd ..

echo ""
echo "✅ Dependencies installed!"
echo ""

# Check for .env files
echo "🔍 Checking configuration files..."

if [ ! -f backend/.env ]; then
    echo "⚠️  backend/.env not found. Creating with defaults..."
    cat > backend/.env << 'EOF'
PORT=5000
FRONTEND_URL=http://localhost:5173
SQLITE_PATH=./data/quizsmash.sqlite
OPENAI_API_KEY=sk_test_your_api_key_here
EOF
    echo "   Created backend/.env"
fi

if [ ! -f frontend/.env ]; then
    echo "⚠️  frontend/.env not found. Creating with defaults..."
    cat > frontend/.env << 'EOF'
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
EOF
    echo "   Created frontend/.env"
fi

echo ""
echo "✅ Configuration ready!"
echo ""
echo "🎮 To start the app:"
echo ""
echo "   Terminal 1 (Backend):"
echo "   cd backend && npm start"
echo ""
echo "   Terminal 2 (Frontend):"
echo "   cd frontend && npm run dev"
echo ""
echo "   Then open: http://localhost:5173"
echo ""
echo "💡 Tip: Update OpenAI API key in backend/.env for AI quizzes"
