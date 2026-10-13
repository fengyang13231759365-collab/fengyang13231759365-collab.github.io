@echo off
chcp 65001 >nul
cd /d "%~dp0"
set "PORTFOLIO_NODE=node"
where node >nul 2>nul
if errorlevel 1 set "PORTFOLIO_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
"%PORTFOLIO_NODE%" scripts\build-online.cjs
if errorlevel 1 (
  echo 构建未完成。请安装 Node.js 24 或更高版本后重试。
  pause
  exit /b 1
)
echo 本机管理地址：http://127.0.0.1:4182/admin.html
echo 本机作品集地址：http://127.0.0.1:4182/
echo 本机内容与线上分开。请保持此窗口开启。
"%PORTFOLIO_NODE%" scripts\serve-online.cjs --open
pause
