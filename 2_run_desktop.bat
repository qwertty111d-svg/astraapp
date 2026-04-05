@echo off
cd /d "%~dp0"
echo Starting Astra Desktop...
call pnpm dev:desktop
pause
