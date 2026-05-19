package com.horse.health.controller;

import com.horse.health.domain.User;
import com.horse.health.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class FcmTokenController {

    private final UserRepository userRepository;

    public FcmTokenController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @PostMapping("/users/{userId}/fcm-token")
    public ResponseEntity<String> updateFcmToken(
            @PathVariable Long userId,
            @RequestBody Map<String, String> body) {

        String token = body.get("fcmToken");

        return userRepository.findById(userId)
                .map(user -> {
                    user.setFcmToken(token);
                    userRepository.save(user);
                    return ResponseEntity.ok("FCM 토큰 저장 완료");
                })
                .orElse(ResponseEntity.notFound().build());
    }
}