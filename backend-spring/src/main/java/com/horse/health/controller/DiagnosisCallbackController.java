package com.horse.health.controller;

import com.horse.health.domain.LamenessDiagnosis;
import com.horse.health.service.DiagnosisService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/diagnosis")
@CrossOrigin(origins = "*")
public class DiagnosisCallbackController {

    private final DiagnosisService diagnosisService;

    public DiagnosisCallbackController(DiagnosisService diagnosisService) {
        this.diagnosisService = diagnosisService;
    }

    @PostMapping("/callback")
    public ResponseEntity<String> receiveDiagnosisCallback(@RequestBody Map<String, Object> payload) {
        System.out.println("Received AI Diagnosis Callback...");
        try {
            diagnosisService.processLamenessCallback(payload);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("{\"error\": \"Failed to parse and save callback payload\"}");
        }
        return ResponseEntity.ok("{\"message\": \"Callback received and processed successfully\"}");
    }

    @PostMapping("/hoof-callback")
    public ResponseEntity<String> receiveHoofDiagnosisCallback(@RequestBody Map<String, Object> payload) {
        System.out.println("Received Hoof Diagnosis Callback...");
        try {
            diagnosisService.processHoofCallback(payload);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("{\"error\": \"Failed to parse and save hoof callback payload\"}");
        }
        return ResponseEntity.ok("{\"message\": \"Hoof Callback received successfully\"}");
    }

    @GetMapping("/{horse_id}")
    public ResponseEntity<List<LamenessDiagnosis>> getDiagnosisHistory(@PathVariable("horse_id") Long horseId) {
        List<LamenessDiagnosis> history = diagnosisService.getDiagnosisHistory(horseId);
        return ResponseEntity.ok(history);
    }
}
