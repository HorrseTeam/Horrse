# Horse Health Management System (팀 프로젝트 안내)

이 프로젝트는 말을 관리하고 AI를 통해 질병(파행, 질병 등)을 진단하는 종합 관리 시스템입니다.
백엔드(Spring Boot, FastAPI)와 데이터베이스(PostgreSQL, Redis)가 MSA 구조로 구성되어 있으며, 프론트엔드는 React Native (Expo)로 구현되어 있습니다.

## 🚀 로컬 개발환경 세팅 가이드 (처음 시작하는 팀원용)

GitHub에서 프로젝트를 막 Clone 받아 로컬에서 실행하려는 팀원 분들은 아래 순서대로 세팅을 진행해 주세요.

### 1단계: 프로젝트 Clone 및 `.env` 설정

1. 저장소를 클론받고 폴더로 이동합니다.
   ```bash
   git clone [저장소 URL]
   cd Horrse # 또는 설정된 프로젝트 폴더명
   ```

2. 프로젝트 최상위 경로에 있는 `.env.example` 파일을 복사하여 `.env` 라는 이름으로 새 파일을 만듭니다.
   - 윈도우: `copy .env.example .env`
   - 맥/리눅스: `cp .env.example .env`

3. 생성된 `.env` 파열을 열고 본인이 사용할 데이터베이스 비밀번호를 설정합니다. (기본 텍스트를 그대로 두어도 동작합니다.)

### 2단계: 백엔드 서버 켜기 (Docker Compose)

스프링 부트, AI(파이썬) 서버, DB, 워커 등 모든 서버는 Docker를 통해 한 번에 실행됩니다.
반드시 **Docker Desktop**이 켜져 있어야 합니다.

1. 프로젝트 최상위 경로에서 다음 명령어를 실행하여 서버들을 빌드하고 백그라운드에서 실행합니다.
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
   ```

2. 정상적으로 켜졌는지 확인합니다.
   - Spring Boot API: `http://localhost:8080`
   - FastAPI (AI서버): `http://localhost:8000/docs` 접속 시 Swagger UI가 떠야 합니다.
   - 데이터베이스 접속: `localhost:5432`로 DBeaver 등에서 접속 가능 (`.env`에 적힌 계정 정보 사용)

### 3단계: 프론트엔드 (React Native 앱) 실행하기

이제 앱 화면을 띄울 차례입니다. `Node.js`가 설치되어 있어야 합니다.

1. `frontend` 폴더로 이동합니다.
   ```bash
   cd frontend
   ```

2. 의존성(라이브러리)을 설치합니다.
   ```bash
   npm install
   ```

3. Expo 개발 서버를 실행합니다.
   ```bash
   npm start
   ```

4. 화면에 QR 코드가 나타나면:
   - 스마트폰에 **Expo Go** 앱을 깔고 카메라로 스캔하여 핸드폰에서 직접 확인하거나,
   - `a` 키를 눌러 안드로이드 에뮬레이터로 띄울 수 있습니다. (안드로이드 스튜디오 세팅 필요)
   - 웹 브라우저에서 보려면 `w` 키를 누르세요.

---

---

### ⚠️ 개발 시 주의사항 / 규칙

- **.env 업로드 절대 금지**: `.env` 파일은 `git push` 하시면 절대 안 됩니다. (이미 `.gitignore`에 등록되어 있습니다.)
- **스마트폰 실기기 테스트 시 API 주소 설정**: 스마트폰에서 테스트할 때는 `frontend/.env` 파일을 만들고 아래 내용을 추가하세요.
  ```
  EXPO_PUBLIC_API_URL=http://본인컴퓨터_IP주소:8080/api
  ```
  이 파일도 `.gitignore`에 등록되어 있으므로 GitHub에 올라가지 않습니다.
- **ALLOWED_ORIGINS 설정**: `.env` 파일의 `ALLOWED_ORIGINS` 값에 프론트엔드 접속 주소를 추가하세요. 실기기 테스트 시 예시:
  ```
  ALLOWED_ORIGINS=http://localhost:8081,http://192.168.1.100:8081
  ```
