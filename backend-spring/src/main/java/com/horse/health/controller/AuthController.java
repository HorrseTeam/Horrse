package com.horse.health.controller;

import com.horse.health.domain.User;
import com.horse.health.service.AuthService;
import com.horse.health.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final JwtUtil jwtUtil;

    // 계정 생성 (관리자가 직접 호출)
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");
        User user = authService.register(username, password);
        return ResponseEntity.ok(Map.of("message", "계정 생성 완료", "username", user.getUsername()));
    }

    // 로그인
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");
        return authService.login(username, password)
                .map(user -> {
                    String token = jwtUtil.generateToken(username);
                    return ResponseEntity.ok(Map.of("token", token));
                })
                .orElse(ResponseEntity.status(401).body(Map.of("message", "아이디 또는 비밀번호가 틀렸습니다")));
    }
}