package com.horse.health.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.horse.health.domain.LamenessDiagnosis;
import com.horse.health.domain.HoofDiagnosis;
import com.horse.health.repository.LamenessDiagnosisRepository;
import com.horse.health.repository.HoofDiagnosisRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@Transactional
public class DiagnosisService {

    private final LamenessDiagnosisRepository diagnosisRepository;
    private final HoofDiagnosisRepository hoofDiagnosisRepository;
    private final ObjectMapper objectMapper;

    public DiagnosisService(LamenessDiagnosisRepository diagnosisRepository, 
                            HoofDiagnosisRepository hoofDiagnosisRepository, 
                            ObjectMapper objectMapper) {
        this.diagnosisRepository = diagnosisRepository;
        this.hoofDiagnosisRepository = hoofDiagnosisRepository;
        this.objectMapper = objectMapper;
    }

    public void processLamenessCallback(Map<String, Object> payload) throws Exception {
        String status = (String) payload.get("status");
        if ("SUCCESS".equals(status)) {
            Long horseId = Long.valueOf(payload.get("horse_id").toString());
            Map<String, Object> result = (Map<String, Object>) payload.get("result");
            
            String lamenessYn = (String) result.get("lameness_yn");
            Boolean isLameness = "Y".equalsIgnoreCase(lamenessYn);
            String walkType = (String) result.get("walk_type");
            String walkDirection = (String) result.get("walk_direction");
            
            Map<String, Object> diagnosisData = (Map<String, Object>) result.get("diagnosis");
            String affectedArea = diagnosisData != null ? (String) diagnosisData.get("affected_area") : null;
            String problemJoint = diagnosisData != null ? (String) diagnosisData.get("problem_joint") : null;
            
            Double confidence = null;
            if (result.containsKey("confidence")) {
                confidence = Double.valueOf(result.get("confidence").toString());
            }

            List<Object> jointArray = (List<Object>) result.get("joint_array");
            String jointDataJson = objectMapper.writeValueAsString(jointArray);

            LamenessDiagnosis diagnosis = LamenessDiagnosis.builder()
                    .horseId(horseId)
                    .isLameness(isLameness)
                    .walkType(walkType)
                    .walkDirection(walkDirection)
                    .affectedArea(affectedArea)
                    .problemJoint(problemJoint)
                    .confidence(confidence)
                    .jointData(jointDataJson)
                    .build();

            diagnosisRepository.save(diagnosis);
            System.out.println("Successfully saved diagnosis for horse_id: " + horseId);
        } else {
            System.out.println("AI Analysis returned FAIL.");
        }
    }

    public void processHoofCallback(Map<String, Object> payload) throws Exception {
        String status = (String) payload.get("status");
        if ("SUCCESS".equals(status)) {
            Long horseId = Long.valueOf(payload.get("horse_id").toString());
            Map<String, Object> result = (Map<String, Object>) payload.get("result");
            
            String grade = (String) result.get("grade");
            Double confidence = Double.valueOf(result.get("confidence").toString());

            HoofDiagnosis diagnosis = HoofDiagnosis.builder()
                    .horseId(horseId)
                    .grade(grade)
                    .confidence(confidence)
                    .taskId((String) payload.get("task_id"))
                    .build();

            hoofDiagnosisRepository.save(diagnosis);
            System.out.println("Successfully saved hoof diagnosis for horse_id: " + horseId);
        }
    }

    @Transactional(readOnly = true)
    public List<LamenessDiagnosis> getDiagnosisHistory(Long horseId) {
        return diagnosisRepository.findByHorseIdOrderByCreatedAtDesc(horseId);
    }
}
