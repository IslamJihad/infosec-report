@echo off
setlocal

cd /d "%~dp0"

echo [1/4] Pulling latest image for app...
docker compose pull app
if errorlevel 1 goto :error

echo [2/4] Recreating app container with saved compose settings...
docker compose up -d app
if errorlevel 1 goto :error

echo [3/4] Current app status:
docker compose ps app

echo [4/4] Done.
echo Open: http://localhost:3000
echo.
pause
exit /b 0

:error
echo.
echo Update failed. Keep this window open and share the error output.
echo.
pause
exit /b 1
