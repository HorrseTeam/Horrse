package com.horse.health.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "*")
public class AIAnalysisController {

    @Value("${ai.server.url:http://localhost:8000}")
    private String aiServerUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    @PostMapping("/hoof")
    public ResponseEntity<String> analyzeHoof(
            @RequestParam("horse_id") Long horseId,
            @RequestParam("file") MultipartFile file) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("horse_id", horseId);
            body.add("file", file.getResource());

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

            return restTemplate.exchange(
                    aiServerUrl + "/ai/hoof",
                    HttpMethod.POST,
                    requestEntity,
                    String.class
            );
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("{\"error\": \"Failed to connect to AI Inference Server\"}");
        }
    }

    @PostMapping("/lameness")
    public ResponseEntity<String> analyzeLameness(
            @RequestParam("horse_id") Long horseId,
            @RequestParam("walk_direction") String walkDirection,
            @RequestParam("walk_type") String walkType,
            @RequestParam("file") MultipartFile file) {
            
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("horse_id", horseId);
            body.add("walk_direction", walkDirection);
            body.add("walk_type", walkType);
            body.add("file", file.getResource());

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

            return restTemplate.exchange(
                    aiServerUrl + "/ai/lameness",
                    HttpMethod.POST,
                    requestEntity,
                    String.class
            );
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("{\"error\": \"Failed to connect to AI Inference Server\"}");
        }
    }

    @GetMapping("/status/{taskId}")
    public ResponseEntity<String> getTaskStatus(@PathVariable String taskId) {
        try {
            return restTemplate.exchange(
                    aiServerUrl + "/ai/status/" + taskId,
                    HttpMethod.GET,
                    null,
                    String.class
            );
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("{\"error\": \"Failed to connect to AI Inference Server\"}");
        }
    }

}
