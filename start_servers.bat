@echo off
title CommunityPulse AI Startup Manager
echo ===================================================
echo   Starting CommunityPulse AI: EcoBin Platform
echo ===================================================

echo 1. Launching Flask Backend Server on http://127.0.0.1:8000 ...
start "EcoBin Backend" cmd /k ".\venv\Scripts\activate.bat && python -m backend.main"

timeout /t 2 /nobreak >nul

echo 2. Launching Vite React Frontend on http://localhost:3000 ...
start "EcoBin Frontend" cmd /k "cd frontend && npm.cmd run dev"

echo ===================================================
echo   Both services started. Open http://localhost:3000
echo ===================================================
pause
