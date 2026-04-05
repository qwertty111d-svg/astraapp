@echo off
cd /d "%~dp0"
echo Building Astra Desktop installer...
call pnpm --filter @astra/desktop dist:win
pause
