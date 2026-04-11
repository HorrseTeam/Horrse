package com.horse.health.controller;

import com.horse.health.service.DashboardService;
// Let's actually change the DashboardController to use the DashboardSummary from Service, but since DashboardSummary was defined as a static class inside it, let's fix it by making DashboardSummary a standalone DTO if needed, or keeping it inside Service.
// Wait, in my previous tool call I imported `com.horse.health.controller.DashboardController.DashboardSummary` in DashboardService. So I'll just keep it here.
import lombok.Builder;
import lombok.Data;
import com.horse.health.domain.HoofDiagnosis;
import com.horse.health.domain.LamenessDiagnosis;
import com.horse.health.domain.TrainingRecord;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "*")
public class DashboardController {

    @Autowired
    private DashboardService dashboardService;

    @GetMapping("/{horseId}")
    public ResponseEntity<DashboardSummary> getDashboardSummary(@PathVariable Long horseId) {
        return ResponseEntity.ok(dashboardService.getDashboardSummary(horseId));
    }

    @Data
    @Builder
    public static class DashboardSummary {
        private List<TrainingRecord> trainingRecords;
        private List<LamenessDiagnosis> lamenessDiagnoses;
        private List<HoofDiagnosis> hoofDiagnoses;
    }
}
