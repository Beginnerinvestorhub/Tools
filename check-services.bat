@echo off
echo Checking Investment Tools Hub Services...
echo.

echo Testing Frontend (should be running)...
curl -s http://localhost:3000 >nul 2>&1
if %errorlevel%==0 (
    echo ✓ Frontend: http://localhost:3000 - RUNNING
) else (
    echo ✗ Frontend: http://localhost:3000 - NOT RESPONDING
)

echo Testing Backend API...
curl -s http://localhost:4000/api/health >nul 2>&1
if %errorlevel%==0 (
    echo ✓ Backend API: http://localhost:4000 - RUNNING
) else (
    echo ✗ Backend API: http://localhost:4000 - NOT RESPONDING
)

echo Testing Python AI Engine...
curl -s http://localhost:8000/health >nul 2>&1
if %errorlevel%==0 (
    echo ✓ Python AI: http://localhost:8000 - RUNNING
) else (
    echo ✗ Python AI: http://localhost:8000 - NOT RESPONDING
)

echo.
echo Open these URLs in your browser:
echo - Frontend: http://localhost:3000
echo - Backend API Docs: http://localhost:4000/api/docs
echo - Python AI Docs: http://localhost:8000/docs
echo.
pause
