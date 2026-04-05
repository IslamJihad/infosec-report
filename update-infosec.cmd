@echo off
setlocal EnableExtensions

cd /d "%~dp0"

call :ensure_docker_ready
if errorlevel 1 goto :error

echo [1/4] Pulling latest image for app...
docker compose pull app
if errorlevel 1 goto :error

echo [2/4] Removing existing infosec-app container if present...
docker rm -f infosec-app >nul 2>&1

echo [3/4] Recreating app container with saved compose settings...
docker compose up -d app
if errorlevel 1 goto :error

echo [4/4] Current app status:
docker compose ps app

echo Done.
echo Open: http://localhost:3000
echo.
pause
exit /b 0

:ensure_docker_ready
where docker >nul 2>&1
if errorlevel 1 (
echo Docker CLI was not found in PATH.
echo Install Docker Desktop, then run this script again.
exit /b 1
)

docker info >nul 2>&1
if not errorlevel 1 (
exit /b 0
)

echo Docker daemon is not running.
call :start_docker_desktop
if errorlevel 1 (
exit /b 1
)

echo Waiting for Docker engine to become ready...
for /l %%i in (1,1,60) do (
docker info >nul 2>&1 && goto :docker_ready
<nul set /p "=."
timeout /t 2 >nul
)

echo.
echo Docker engine did not become ready within 120 seconds.
echo Open Docker Desktop manually and wait until it says "Engine running".
exit /b 1

:docker_ready
echo.
echo Docker engine is ready.
exit /b 0

:start_docker_desktop
if exist "%ProgramFiles%\Docker\Docker\Docker Desktop.exe" (
echo Starting Docker Desktop...
start "" "%ProgramFiles%\Docker\Docker\Docker Desktop.exe"
exit /b 0
)

if exist "%LocalAppData%\Programs\Docker\Docker\Docker Desktop.exe" (
echo Starting Docker Desktop...
start "" "%LocalAppData%\Programs\Docker\Docker\Docker Desktop.exe"
exit /b 0
)

echo Docker Desktop executable was not found.
echo Start Docker Desktop manually, then run this script again.
exit /b 1

:error
echo.
echo Update failed. Keep this window open and share the error output.
echo.
pause
exit /b 1
