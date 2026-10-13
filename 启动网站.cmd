@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo 未找到 Node.js。请在有 Node.js 的终端中运行 README 的启动命令。
  pause
  exit /b 1
)
node scripts/build.cjs
if errorlevel 1 (
  echo 构建未通过，请检查上面的配置或素材路径提示。
  pause
  exit /b 1
)
echo 请在浏览器打开 http://127.0.0.1:4180
echo 使用期间保留这个窗口，按 Ctrl+C 停止。
node scripts/serve.cjs
pause
