@echo off
cd /d "%~dp0"
echo ========================================
echo   Astra Desktop — Запуск
echo ========================================
echo.
echo [*] Запускаю Astra Desktop...
call pnpm dev:desktop
pause
