@echo off
cd /d "%~dp0"
echo ========================================
echo   Astra Desktop — Установка зависимостей
echo ========================================
echo.

where pnpm >nul 2>nul
if %errorlevel% neq 0 (
    echo [!] pnpm не найден. Устанавливаю через npm...
    call npm install -g pnpm
)

echo [*] Устанавливаю зависимости...
call pnpm install

echo.
echo [OK] Готово! Запусти 2_run_desktop.bat для запуска приложения.
pause
