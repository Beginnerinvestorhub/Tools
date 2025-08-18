@echo off
echo Starting Investment Tools Hub Development Environment...
echo.

echo Starting Backend API...
start "Backend API" cmd /k "cd /d %~dp0 && pnpm --filter backend dev"

timeout /t 3 /nobreak >nul

echo Starting Python AI Engine...
start "Python AI Engine" cmd /k "cd /d %~dp0\python-engine && python main.py"

echo.
echo All services starting...
echo Frontend: http://localhost:3000 (already running)
echo Backend API: http://localhost:4000
echo Python AI: http://localhost:8000
echo.
pause
