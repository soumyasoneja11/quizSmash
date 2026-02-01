@echo off
REM QuizSmash Quick Start Script - Development (Windows)

echo.
echo 🚀 QuizSmash Quick Start
echo =======================
echo.

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js not found. Install from https://nodejs.org/
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VER=%%i
echo ✅ Node.js %NODE_VER% found
echo.

REM Install dependencies
echo 📦 Installing dependencies...
echo.

echo Backend:
cd backend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Backend installation failed
    exit /b 1
)
cd ..

echo.
echo Frontend:
cd frontend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Frontend installation failed
    exit /b 1
)
cd ..

echo.
echo ✅ Dependencies installed!
echo.

REM Check for .env files
echo 🔍 Checking configuration files...

if not exist backend\.env (
    echo ⚠️  backend\.env not found. Creating with defaults...
    (
        echo PORT=5000
        echo FRONTEND_URL=http://localhost:5173
        echo SQLITE_PATH=./data/quizsmash.sqlite
        echo OPENAI_API_KEY=sk_test_your_api_key_here
    ) > backend\.env
    echo    Created backend\.env
)

if not exist frontend\.env (
    echo ⚠️  frontend\.env not found. Creating with defaults...
    (
        echo VITE_API_URL=http://localhost:5000
        echo VITE_SOCKET_URL=http://localhost:5000
    ) > frontend\.env
    echo    Created frontend\.env
)

echo.
echo ✅ Configuration ready!
echo.
echo 🎮 To start the app:
echo.
echo    Terminal 1 ^(Backend^):
echo    cd backend ^&^& npm start
echo.
echo    Terminal 2 ^(Frontend^):
echo    cd frontend ^&^& npm run dev
echo.
echo    Then open: http://localhost:5173
echo.
echo 💡 Tip: Update OpenAI API key in backend\.env for AI quizzes
echo.
pause
