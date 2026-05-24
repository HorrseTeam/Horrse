package com.horse.health.controller;

import com.horse.health.domain.HoofDiagnosis;
import com.horse.health.domain.LamenessDiagnosis;
import com.horse.health.service.DiagnosisService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 구 콜백 방식 호환 + 이력 조회 엔드포인트
 *
 * 신규 진단 요청은 AIAnalysisController (/api/ai/lameness, /api/ai/hoof) 를 사용하세요.
 * 이 컨트롤러는 하위 호환 및 이력 조회용으로 유지합니다.
 */
@RestController
@RequestMapping("/api/diagnosis")
@CrossOrigin(origins = "*")
public class DiagnosisCallbackController {

    private final DiagnosisService diagnosisService;

    public DiagnosisCallbackController(DiagnosisService diagnosisService) {
        this.diagnosisService = diagnosisService;
    }

    // ── 구 콜백 호환 (하위 호환 유지) ─────────────────────────────────────────

    @PostMapping("/callback")
    public ResponseEntity<String> receiveLamenessCallback(@RequestBody Map<String, Object> payload) {
        System.out.println("[Callback] 파행 진단 콜백 수신");
        try {
            diagnosisService.saveLamenessResult(payload);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body("{\"error\": \"콜백 파싱/저장 중 오류가 발생했습니다.\"}");
        }
        return ResponseEntity.ok("{\"message\": \"파행 진단 콜백 처리 완료\"}");
    }

    @PostMapping("/hoof-callback")
    public ResponseEntity<String> receiveHoofCallback(@RequestBody Map<String, Object> payload) {
        System.out.println("[Callback] 발굽 진단 콜백 수신");
        try {
            diagnosisService.saveHoofResult(payload);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body("{\"error\": \"발굽 콜백 파싱/저장 중 오류가 발생했습니다.\"}");
        }
        return ResponseEntity.ok("{\"message\": \"발굽 진단 콜백 처리 완료\"}");
    }

    // ── 이력 조회 ─────────────────────────────────────────────────────────────

    @GetMapping("/lameness/{horseId}")
    public ResponseEntity<List<LamenessDiagnosis>> getLamenessHistory(
            @PathVariable Long horseId) {
        return ResponseEntity.ok(diagnosisService.getLamenessHistory(horseId));
    }

    @GetMapping("/hoof/{horseId}")
    public ResponseEntity<List<HoofDiagnosis>> getHoofHistory(
            @PathVariable Long horseId) {
        return ResponseEntity.ok(diagnosisService.getHoofHistory(horseId));
    }
}
