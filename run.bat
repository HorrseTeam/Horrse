@echo off
chcp 65001 >nul
echo ===========================================
echo  Horse Health Management System (MSA)
echo ===========================================

echo.
echo [필수] 루트 디렉토리에 .env 파일이 있어야 합니다.
echo        없으면: copy .env.example .env  후 값 채우기
echo.

if not exist ".env" (
    echo [오류] .env 파일이 없습니다!
    echo        .env.example 을 복사해서 .env 를 만들어 주세요.
    echo        명령어: copy .env.example .env
    pause
    exit /b 1
)

echo [1/2] 백엔드 서비스 시작 (Docker Compose)...
echo  - Spring Boot API  : http://localhost:8080
echo  - FastAPI AI Server: http://localhost:8000/docs
echo  - PostgreSQL DB    : localhost:5432
echo  - Redis            : localhost:6379
echo.
start cmd /k "docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build"

echo [2/2] 프론트엔드 앱 시작 (React Native Expo)...
cd frontend
start cmd /k "npx expo start -w -c"

echo.
echo 모든 서비스가 실행되었습니다!
echo  - 프론트엔드: http://localhost:8081
echo  - API Swagger: http://localhost:8000/docs
echo ===========================================
pause
