@echo off
cd /d "%~dp0"
echo Installing Astra Desktop dependencies...
where pnpm >nul 2>nul
if errorlevel 1 (
  echo pnpm not found. Install pnpm first, then run this file again.
  pause
  exit /b 1
)
call pnpm install
pause
