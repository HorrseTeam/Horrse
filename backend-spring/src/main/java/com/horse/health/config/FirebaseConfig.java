package com.horse.health.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import java.io.IOException;
import java.io.InputStream;

@Configuration
public class FirebaseConfig {

    @Value("${firebase.service-account-file}")
    private String serviceAccountFile;

    @PostConstruct
    public void initialize() {
        try {
            // 1. resources 폴더에서 JSON 키 파일 읽기
            ClassPathResource resource = new ClassPathResource(serviceAccountFile);
            InputStream serviceAccount = resource.getInputStream();

            // 2. Firebase 옵션 설정 (인증 정보 등록)
            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                    .build();

            // 3. Firebase 앱 초기화 (이미 초기화돼있으면 스킵)
            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseApp.initializeApp(options);
                System.out.println("Firebase 초기화 성공");
            }
        } catch (IOException e) {
            System.err.println("Firebase 초기화 실패: " + e.getMessage());
            e.printStackTrace();
        }
    }
}