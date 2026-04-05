@echo off
cd /d "%~dp0"
echo ========================================
echo   Astra Desktop — Сборка Windows EXE
echo ========================================
echo.
echo [*] Собираю установщик AstraSetup.exe...
echo [*] Это может занять 2-5 минут...
echo.
call pnpm --filter @astra/desktop dist:win
echo.
echo [OK] Готово! Установщик находится в apps\desktop\dist\
echo [*] Файл: AstraSetup.exe
echo.
echo Загрузи AstraSetup.exe в GitHub Releases:
echo https://github.com/qwertty111d-svg/astraapp/releases/new
echo.
pause
