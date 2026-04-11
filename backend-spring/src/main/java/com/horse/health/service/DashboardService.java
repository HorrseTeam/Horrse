package com.horse.health.service;

import com.horse.health.domain.HoofDiagnosis;
import com.horse.health.domain.LamenessDiagnosis;
import com.horse.health.domain.TrainingRecord;
import com.horse.health.repository.HoofDiagnosisRepository;
import com.horse.health.repository.LamenessDiagnosisRepository;
import com.horse.health.repository.TrainingRecordRepository;
import com.horse.health.controller.DashboardController.DashboardSummary;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class DashboardService {

    private final TrainingRecordRepository trainingRecordRepository;
    private final LamenessDiagnosisRepository lamenessDiagnosisRepository;
    private final HoofDiagnosisRepository hoofDiagnosisRepository;

    public DashboardService(TrainingRecordRepository trainingRecordRepository, 
                            LamenessDiagnosisRepository lamenessDiagnosisRepository, 
                            HoofDiagnosisRepository hoofDiagnosisRepository) {
        this.trainingRecordRepository = trainingRecordRepository;
        this.lamenessDiagnosisRepository = lamenessDiagnosisRepository;
        this.hoofDiagnosisRepository = hoofDiagnosisRepository;
    }

    public DashboardSummary getDashboardSummary(Long horseId) {
        List<TrainingRecord> recentRecords = trainingRecordRepository.findByHorseIdOrderByDateDesc(horseId);
        List<LamenessDiagnosis> recentLameness = lamenessDiagnosisRepository.findByHorseIdOrderByCreatedAtDesc(horseId);
        List<HoofDiagnosis> recentHoofs = hoofDiagnosisRepository.findByHorseIdOrderByCreatedAtDesc(horseId);

        return DashboardSummary.builder()
                .trainingRecords(recentRecords)
                .lamenessDiagnoses(recentLameness)
                .hoofDiagnoses(recentHoofs)
                .build();
    }
}
