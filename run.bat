@echo off
echo ===========================================
echo Horse Health Management System (MSA)
echo ===========================================

echo.
echo [1/2] Starting Backend Services via Docker Compose...
echo - FastAPI AI Server (Port 8000)
echo - Spring Boot Main Server (Port 8080)
echo - PostgreSQL DB (Port 5432)
start cmd /k "docker-compose up --build"

echo.
echo [2/2] Starting Frontend App (React Native Expo)...
cd frontend
start cmd /k "set EXPO_OFFLINE=true&& npx expo start -w -c"

echo.
echo All services have been launched!
echo Frontend URL: http://localhost:8081
echo ===========================================
pause
