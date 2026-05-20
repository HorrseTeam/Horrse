package com.horse.health.service;

import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import org.springframework.stereotype.Service;

@Service
public class FcmService {

    public void sendPush(String fcmToken, String title, String body) {
        try {
            //  메시지 구성
            Message message = Message.builder()
                    .setToken(fcmToken)
                    .setNotification(Notification.builder()
                            .setTitle(title)
                            .setBody(body)
                            .build())
                    .build();

            // 발송
            String response = FirebaseMessaging.getInstance().send(message);
            System.out.println("푸시 알림 발송 성공: " + response);

        } catch (Exception e) {
            System.err.println("푸시 알림 발송 실패: " + e.getMessage());
        }
    }
}