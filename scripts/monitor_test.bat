@echo off
title AI Platform - Test Runner & Monitor
color 0A

echo ========================================================
echo   AI Market Analysis Platform - Automated Test Runner
echo ========================================================
echo.

:: 1. Check if Backend is running (Simple check by port or just assume dev env)
echo [1/4] Checking environment...
echo       Assuming Backend (8000) and Frontend (3000) are running...
echo.

:: 2. Open Monitoring Dashboard
echo [2/4] Launching Monitoring Dashboard...
start http://localhost:3000/monitor
timeout /t 3 >nul

:: 3. Run Integration Tests
echo [3/4] Running Integration Tests...
echo       (These tests will generate traffic and logs on the Dashboard)
echo ========================================================
cd backend
python -m pytest tests/integration -v
echo ========================================================

:: 4. Completion
echo.
echo [4/4] Test Cycle Complete.
echo       Check the Dashboard for real-time log visualization.
echo.
pause
