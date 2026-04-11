// API 서버 URL 중앙 설정 파일
// 환경변수 EXPO_PUBLIC_API_URL이 있으면 우선 사용, 없으면 localhost 기본값 사용
// 팀원은 frontend/.env 파일에 본인 환경에 맞는 IP를 설정하세요.
// 예시: EXPO_PUBLIC_API_URL=http://192.168.1.100:8080/api
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080/api';

export default API_URL;
