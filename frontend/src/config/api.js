// API 서버 URL 중앙 설정 파일
// GCP IP가 바뀌면 frontend/.env 파일의 EXPO_PUBLIC_API_URL 한 줄만 수정하세요.
// 예시: EXPO_PUBLIC_API_URL=http://34.64.xxx.xxx:8080/api
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080/api';

export default API_URL;
