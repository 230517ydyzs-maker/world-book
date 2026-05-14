@echo off
setlocal

chcp 65001 >nul
title 世界书 - 本地启动器
cd /d "%~dp0"

if not exist package.json (
  echo 当前目录不是世界书项目目录：
  echo %CD%
  echo.
  echo 请把此脚本放在包含 package.json 的项目根目录中运行。
  echo 如果你想从桌面启动，请使用桌面专用快捷脚本。
  echo.
  pause
  exit /b 1
)

where node >nul 2>nul
if errorlevel 1 (
  echo 未检测到 Node.js。
  echo 请先安装 Node.js 18 或更高版本：
  echo https://nodejs.org/
  echo.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo 未检测到 npm。
  echo 请确认 Node.js 已正确安装。
  echo.
  pause
  exit /b 1
)

if not exist node_modules (
  echo 正在安装依赖，请稍候...
  call npm install
  if errorlevel 1 (
    echo.
    echo 依赖安装失败，请检查网络或 npm 配置。
    pause
    exit /b 1
  )
)

echo 正在启动世界书...
echo 浏览器将打开：http://localhost:5173/create
echo.

start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 3; Start-Process 'http://localhost:5173/create'"
call npm run dev -- --host 127.0.0.1

echo.
echo 世界书已停止。
pause
