@echo off
title 🚀 CMSCRM Full Stack Dev (Backend + Frontend)
color 0A

echo ==================================================
echo       🚀 Starting CMSCRM Development Servers
echo ==================================================
echo.

:: ---- Verify Node.js ----
where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo ❌ Node.js not installed. Download from https://nodejs.org/
    pause
    exit /b
)

:: ---- Verify npm ----
where npm >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo ❌ npm not found in PATH.
    pause
    exit /b
)

:: ---- Install concurrently if missing ----
call npm list -g concurrently >nul 2>nul
if %errorlevel% neq 0 (
    color 0E
    echo ⚙️ Installing concurrently globally...
    npm install -g concurrently
)

:: ---- Detect Wi-Fi IPv4 Address ----
setlocal enabledelayedexpansion
set IP=
for /f "tokens=1,* delims=:" %%A in ('ipconfig ^| findstr /R /C:"Wireless LAN adapter Wi-Fi" /C:"IPv4 Address"') do (
    echo %%A | findstr /C:"IPv4 Address" >nul
    if not errorlevel 1 (
        for /f "tokens=2 delims=:" %%x in ("%%A:%%B") do set IP=%%x
    )
)
set IP=%IP: =%
set IP=%IP:~0,-1%
if "%IP%"=="" set IP=localhost
endlocal & set IP=%IP%

:: ---- Define Ports ----
set BACKEND_PORT=5000
set FRONTEND_PORT=8800

color 0A
echo ✅ Environment ready.
echo.
echo ==================================================
echo 🌐 Local IP Detected : %IP%
echo 📦 Backend  : http://%IP%:%BACKEND_PORT%
echo 💻 Frontend : http://%IP%:%FRONTEND_PORT%
echo ==================================================
echo.

:: ---- Run Both Servers ----
call npx concurrently ^
  --names "BACKEND,FRONTEND" ^
  --prefix-colors "cyan,magenta" ^
  "cd backend && echo [BACKEND] 🚀 Starting CMSCRM Backend on port %BACKEND_PORT%... && npm install && npm run dev" ^
  "cd frontend && echo [FRONTEND] 💻 Starting CMSCRM Frontend (Vite) on port %FRONTEND_PORT%... && npm install && npm run dev -- --host 0.0.0.0 --port %FRONTEND_PORT%"

echo.
echo ==================================================
echo ✅ CMSCRM Backend → http://%IP%:%BACKEND_PORT%
echo ✅ CMSCRM Frontend → http://%IP%:%FRONTEND_PORT%
echo (Press Ctrl + C to stop servers)
echo ==================================================
pause
