import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants'; // EAS ProjectId 추출용 임포트
import axios from 'axios';
import API_URL from '../config/api';

// 앱이 켜져 있을 때(Foreground)도 상단 푸시 배너를 무조건 띄우도록 설정
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,  
    shouldPlaySound: true,  
    shouldSetBadge: false,  
  }),
});

export default function NotificationManager() {
  
  useEffect(() => {
    async function registerForPushNotificationsAsync() {
      // 1. 웹 브라우저 환경이면 알림 로직을 아예 실행 안 하고 통과
      if (Platform.OS === 'web') return;

      try {
        // 2. 현재 권한 상태 체크
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        // 3. 권한이 없다면 모바일 표준 팝업으로 물어보기
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== 'granted') {
          console.log('⚠️ [알림 거부] 사용자가 알림 권한을 거부했습니다.');
          return;
        }

        // 4. 안드로이드 알림 채널 설정 (기본 기본 채널 및 중요 캘린더 채널 통합 빌드)
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('high_importance_channel', {
            name: '중요 일정 알림',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#4f6ef7',
          });
        }

        // 5. 🎯 [EAS 규격 적용] 최신 Expo 환경에서 푸시 토큰을 추출하기 위한 셋업
        // app.json에 설정된 고유 프로젝트 ID를 안전하게 로드합니다.
        const projectId = 
          Constants.expoConfig?.extra?.eas?.projectId ?? 
          Constants.easConfig?.projectId;

        if (!projectId) {
          console.error('🚨 [알림 실패] app.json 또는 EAS 환경에 projectId 설정이 유실되었습니다.');
          return;
        }

        // 6. 📡 [더미 제거] 가짜 토큰 대신 실제 기기의 Expo 고유 푸시 토큰 추출
        const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
        const pushToken = tokenData.data;
        
        console.log('📌 [실제 푸시 토큰 추출 완료]:', pushToken);

        // 7. 📡 [백엔드 연동] 추출된 유저 기기의 토큰을 데이터베이스(DB)에 동기화 전송
        await axios.post(`${API_URL}/api/notifications/register`, {
          token: pushToken,
          devicePlatform: Platform.OS // 'ios' 혹은 'android' 정보 동시 전달
        });
        
        console.log('🚀 [서버 동기화 완료] 실시간 기기 푸시 토큰이 백엔드 DB에 정상 매핑되었습니다.');

      } catch (globalError) {
        console.error('🚨 알림 모듈 서버 통신 또는 인증 오류 발생:', globalError);
      }
    }

    registerForPushNotificationsAsync();

    // 🔔 앱 사용 중 알림 수신 리스너
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('🟢 실시간 알림 수신 성공:', notification.request.content.title);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('🟡 알림 클릭 확인:', response.notification.request.content.title);
    });

    return () => {
      if (notificationListener?.remove) notificationListener.remove();
      if (responseListener?.remove) responseListener.remove();
    };
  }, []);

  return null;
}