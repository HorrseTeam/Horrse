package com.horse.health.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.horse.health.domain.HoofDiagnosis;
import com.horse.health.domain.LamenessDiagnosis;
import com.horse.health.service.DiagnosisService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

/**
 * AI 서버(FastAPI, port 8001)로 파행/발굽 진단을 요청하고,
 * 동기 응답을 파싱해 DB에 저장 후 결과를 클라이언트에 반환합니다.
 *
 * POST /api/ai/lameness  → AI POST /api/ai/lameness
 * POST /api/ai/hoof      → AI POST /api/ai/hoof
 */
@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "*")
public class AIAnalysisController {

    @Value("${ai.server.url:http://localhost:8001}")
    private String aiServerUrl;

    private final RestTemplate restTemplate = createRestTemplate();

    private static RestTemplate createRestTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10000);
        factory.setReadTimeout(360000); // 6분
        return new RestTemplate(factory);
    }
    private final DiagnosisService diagnosisService;
    private final ObjectMapper objectMapper;

    public AIAnalysisController(DiagnosisService diagnosisService, ObjectMapper objectMapper) {
        this.diagnosisService = diagnosisService;
        this.objectMapper = objectMapper;
    }

    // ── 파행 진단 ─────────────────────────────────────────────────────────────

    /**
     * @param horseId       말 ID
     * @param walkDirection 촬영 방향: FRONT / SIDE / BACK
     * @param walkType      보행 유형:  WALK  / TROT
     * @param video         보행 영상 (mp4/mov/avi, 최대 60초)
     */
    @PostMapping("/lameness")
    public ResponseEntity<?> analyzeLameness(
            @RequestParam("horse_id")       Long horseId,
            @RequestParam("walk_direction") String walkDirection,
            @RequestParam("walk_type")      String walkType,
            @RequestParam("video")          MultipartFile video) {

        // 1. AI 서버로 multipart 전송
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("horse_id",       horseId);
        body.add("walk_direction", walkDirection);
        body.add("walk_type",      walkType);
        body.add("video",          video.getResource());   // ← 필드명 "video"

        try {
            ResponseEntity<String> aiRes = restTemplate.exchange(
                    aiServerUrl + "/api/ai/lameness",       // ← 경로 수정
                    HttpMethod.POST,
                    new HttpEntity<>(body, headers),
                    String.class
            );

            // 2. 응답 파싱
            Map<String, Object> aiPayload = objectMapper.readValue(
                    aiRes.getBody(), new TypeReference<>() {});

            // 3. DB 저장
            LamenessDiagnosis saved = diagnosisService.saveLamenessResult(aiPayload);

            // 4. 클라이언트에 AI 원본 응답 + DB id 반환
            Map<String, Object> response = objectMapper.readValue(
                    aiRes.getBody(), new TypeReference<>() {});
            response.put("db_id", saved.getId());

            return ResponseEntity.ok(response);

        } catch (HttpClientErrorException e) {
            // AI 서버가 4xx 에러 코드를 돌려줄 때 (ERR_INVALID_FILE 등)
            return ResponseEntity.status(e.getStatusCode()).body(e.getResponseBodyAsString());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "AI 서버 연동 중 오류가 발생했습니다: " + e.getMessage()));
        }
    }

    // ── 발굽 진단 ─────────────────────────────────────────────────────────────

    /**
     * @param horseId 말 ID
     * @param image   발굽 이미지 (jpg/png)
     */
    @PostMapping("/hoof")
    public ResponseEntity<?> analyzeHoof(
            @RequestParam("horse_id") Long horseId,
            @RequestParam("image")    MultipartFile image) {   // ← 필드명 "image"

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("horse_id", horseId);
        body.add("image",    image.getResource());              // ← 필드명 "image"

        try {
            ResponseEntity<String> aiRes = restTemplate.exchange(
                    aiServerUrl + "/api/ai/hoof",               // ← 경로 수정
                    HttpMethod.POST,
                    new HttpEntity<>(body, headers),
                    String.class
            );

            Map<String, Object> aiPayload = objectMapper.readValue(
                    aiRes.getBody(), new TypeReference<>() {});

            HoofDiagnosis saved = diagnosisService.saveHoofResult(aiPayload);

            Map<String, Object> response = objectMapper.readValue(
                    aiRes.getBody(), new TypeReference<>() {});
            response.put("db_id", saved.getId());

            return ResponseEntity.ok(response);

        } catch (HttpClientErrorException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getResponseBodyAsString());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "AI 서버 연동 중 오류가 발생했습니다: " + e.getMessage()));
        }
    }

    // ── 진단 이력 조회 ────────────────────────────────────────────────────────

    @GetMapping("/lameness/history/{horseId}")
    public ResponseEntity<?> getLamenessHistory(@PathVariable Long horseId) {
        return ResponseEntity.ok(diagnosisService.getLamenessHistory(horseId));
    }

    @GetMapping("/hoof/history/{horseId}")
    public ResponseEntity<?> getHoofHistory(@PathVariable Long horseId) {
        return ResponseEntity.ok(diagnosisService.getHoofHistory(horseId));
    }
}
