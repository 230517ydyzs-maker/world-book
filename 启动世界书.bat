@echo off
setlocal EnableExtensions

title Worldbook Launcher
cd /d "%~dp0"

if not exist "package.json" (
  echo This launcher must be run from the Worldbook project root.
  echo Current directory:
  echo %CD%
  echo.
  echo Please keep this file next to package.json.
  echo.
  pause
  exit /b 1
)

where node.exe >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found.
  echo Please install Node.js 18 or newer:
  echo https://nodejs.org/
  echo.
  pause
  exit /b 1
)

where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo npm was not found.
  echo Please make sure Node.js is installed correctly.
  echo.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Installing dependencies. This may take a while...
  call npm.cmd install
  if errorlevel 1 (
    echo.
    echo Failed to install dependencies.
    echo Check your network connection or npm configuration.
    echo.
    pause
    exit /b 1
  )
)

echo Starting Worldbook...
echo The browser will open: http://localhost:5173/create
echo Keep this window open while playing.
echo.

start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 3; Start-Process 'http://localhost:5173/create'"
call npm.cmd run dev -- --host 127.0.0.1

echo.
echo Worldbook has stopped.
pause
