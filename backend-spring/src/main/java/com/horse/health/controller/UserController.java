package com.horse.health.controller;

import com.horse.health.domain.User;
import com.horse.health.repository.UserRepository;
import com.horse.health.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/user")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class UserController {

    private final AuthService authService;
    private final UserRepository userRepository;

    @PutMapping("/password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> body,
                                            Authentication authentication) {
        String username = authentication.getName();
        String currentPassword = body.get("currentPassword");
        String newPassword = body.get("newPassword");

        boolean success = authService.changePassword(username, currentPassword, newPassword);
        if (success) {
            return ResponseEntity.ok(Map.of("message", "비밀번호가 변경되었습니다"));
        }
        return ResponseEntity.status(400).body(Map.of("message", "현재 비밀번호가 틀렸습니다"));
    }

    @PostMapping("/fcm-token")
    public ResponseEntity<?> updateFcmToken(@RequestBody Map<String, String> body,
                                            Authentication authentication) {
        String username = authentication.getName();
        String fcmToken = body.get("token");

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다"));
        user.setFcmToken(fcmToken);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "FCM 토큰 저장 완료"));
    }
}