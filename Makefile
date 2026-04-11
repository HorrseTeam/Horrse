# =============================================
# Horse Health Management System — Makefile
# Mac / Linux 팀원용 실행 스크립트
# 사용법: make <명령어>
# =============================================

.PHONY: help dev down logs build clean

# 기본 명령어 — make 만 입력 시 도움말 출력
help:
	@echo "=============================="
	@echo " Horse Health — 명령어 목록"
	@echo "=============================="
	@echo "  make dev     : 개발 서버 전체 시작 (빌드 포함)"
	@echo "  make up      : 개발 서버 시작 (빌드 없이)"
	@echo "  make down    : 모든 서버 종료"
	@echo "  make logs    : 실시간 로그 보기"
	@echo "  make build   : 이미지만 새로 빌드"
	@echo "  make clean   : 컨테이너 + 볼륨 모두 삭제 (DB 초기화)"
	@echo "  make frontend: 프론트엔드 Expo 실행"
	@echo "=============================="

# .env 파일 존재 여부 확인
check-env:
	@if [ ! -f .env ]; then \
		echo "❌ .env 파일이 없습니다!"; \
		echo "   cp .env.example .env 실행 후 값을 채워주세요."; \
		exit 1; \
	fi

# 개발 서버 전체 시작 (빌드 포함)
dev: check-env
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# 개발 서버 시작 (빌드 없이 — 코드 변경 없을 때)
up: check-env
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# 백그라운드 실행
up-d: check-env
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build

# 모든 서버 종료
down:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml down

# 실시간 로그 보기
logs:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f

# 이미지 새로 빌드만
build: check-env
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml build

# 컨테이너 + DB 볼륨 완전 삭제 (DB 초기화 시 사용)
clean:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml down -v
	@echo "⚠️  DB 볼륨(pgdata)까지 삭제되었습니다. DB가 초기화됩니다."

# 프론트엔드 실행
frontend:
	cd frontend && npx expo start -w -c

# 운영 서버 실행 (참고용)
prod: check-env
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
