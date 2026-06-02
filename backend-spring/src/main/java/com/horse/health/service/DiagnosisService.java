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

    /**
     * AI 서버 POST /api/ai/lameness 동기 응답을 파싱해서 DB에 저장합니다.
     *
     * 응답 예시:
     * {
     *   "status": "SUCCESS",
     *   "result": {
     *     "horse_id": 1,
     *     "lameness_yn": true,          ← boolean
     *     "confidence": 0.875,
     *     "walk_direction": "SIDE",
     *     "walk_type": "WALK",
     *     "affected_area": "T_Coxae",
     *     "problem_joint": "T_Coxae",
     *     "frame_count": 280,
     *     "result_image_url": "http://..."
     *   }
     * }
     */
    public LamenessDiagnosis saveLamenessResult(Map<String, Object> aiResponse) throws Exception {
        String status = (String) aiResponse.get("status");
        if (!"SUCCESS".equals(status)) {
            throw new IllegalStateException("AI 서버 응답 상태 오류: " + status);
        }

        @SuppressWarnings("unchecked")
        Map<String, Object> result = (Map<String, Object>) aiResponse.get("result");

        Long horseId       = Long.valueOf(result.get("horse_id").toString());
        Boolean isLameness = (Boolean) result.get("lameness_yn");           // boolean
        String walkType      = (String) result.get("walk_type");
        String walkDirection = (String) result.get("walk_direction");
        String affectedArea  = (String) result.get("affected_area");
        String problemJoint  = (String) result.get("problem_joint");
        String resultImageUrl = (String) result.get("result_image_url");    // MinIO URL

        Double confidence = null;
        if (result.containsKey("confidence") && result.get("confidence") != null) {
            confidence = Double.valueOf(result.get("confidence").toString());
        }

        Integer frameCount = null;
        if (result.containsKey("frame_count") && result.get("frame_count") != null) {
            frameCount = Integer.valueOf(result.get("frame_count").toString());
        }

        // frame_count 는 jointData 에 보조 정보로 저장
        String jointDataJson = frameCount != null
                ? objectMapper.writeValueAsString(Map.of("frame_count", frameCount))
                : null;

        LamenessDiagnosis diagnosis = LamenessDiagnosis.builder()
                .horseId(horseId)
                .isLameness(isLameness)
                .walkType(walkType)
                .walkDirection(walkDirection)
                .affectedArea(affectedArea)
                .problemJoint(problemJoint)
                .confidence(confidence)
                .resultImageUrl(resultImageUrl)
                .jointData(jointDataJson)
                .build();

        LamenessDiagnosis saved = diagnosisRepository.save(diagnosis);
        System.out.println("[DiagnosisService] 파행 진단 저장 완료 - horse_id=" + horseId
                + ", lameness=" + isLameness + ", image=" + resultImageUrl);
        return saved;
    }

    /**
     * AI 서버 POST /api/ai/hoof 동기 응답을 파싱해서 DB에 저장합니다.
     *
     * 응답 예시:
     * {
     *   "status": "SUCCESS",
     *   "result": {
     *     "horse_id": 1,
     *     "grade": "심각",
     *     "grade_probability": 0.54,
     *     "class_probabilities": { "정상": 0.013, "경미": 0.016, "중등도": 0.432, "심각": 0.540 },
     *     "image_url": "http://..."
     *   }
     * }
     */
    public HoofDiagnosis saveHoofResult(Map<String, Object> aiResponse) throws Exception {
        String status = (String) aiResponse.get("status");
        if (!"SUCCESS".equals(status)) {
            throw new IllegalStateException("AI 서버 응답 상태 오류: " + status);
        }

        @SuppressWarnings("unchecked")
        Map<String, Object> result = (Map<String, Object>) aiResponse.get("result");

        Long horseId         = Long.valueOf(result.get("horse_id").toString());
        String grade         = (String) result.get("grade");
        String imageUrl      = (String) result.get("result_image_url");            // MinIO URL

        Double gradeProbability = null;
        if (result.containsKey("grade_probability") && result.get("grade_probability") != null) {
            gradeProbability = Double.valueOf(result.get("grade_probability").toString());
        }

        // class_probabilities Map → JSON 문자열로 직렬화
        String classProbJson = null;
        if (result.containsKey("class_probabilities") && result.get("class_probabilities") != null) {
            classProbJson = objectMapper.writeValueAsString(result.get("class_probabilities"));
        }

        HoofDiagnosis diagnosis = HoofDiagnosis.builder()
                .horseId(horseId)
                .grade(grade)
                .gradeProbability(gradeProbability)
                .classProbabilities(classProbJson)
                .imageUrl(imageUrl)
                .build();

        HoofDiagnosis saved = hoofDiagnosisRepository.save(diagnosis);
        System.out.println("[DiagnosisService] 발굽 진단 저장 완료 - horse_id=" + horseId
                + ", grade=" + grade + ", image=" + imageUrl);
        return saved;
    }

    // ── 조회 ────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<LamenessDiagnosis> getLamenessHistory(Long horseId) {
        return diagnosisRepository.findByHorseIdOrderByCreatedAtDesc(horseId);
    }

    @Transactional(readOnly = true)
    public List<HoofDiagnosis> getHoofHistory(Long horseId) {
        return hoofDiagnosisRepository.findByHorseIdOrderByCreatedAtDesc(horseId);
    }

    // ── 구 콜백 방식 호환용 (DiagnosisCallbackController 에서 사용) ──────────

    /** @deprecated 동기 직접 호출 방식(saveLamenessResult)을 사용하세요. */
    @Deprecated
    public void processLamenessCallback(Map<String, Object> payload) throws Exception {
        saveLamenessResult(payload);
    }

    /** @deprecated 동기 직접 호출 방식(saveHoofResult)을 사용하세요. */
    @Deprecated
    public void processHoofCallback(Map<String, Object> payload) throws Exception {
        saveHoofResult(payload);
    }

    /** @deprecated getLamenessHistory 를 사용하세요. */
    @Deprecated
    @Transactional(readOnly = true)
    public List<LamenessDiagnosis> getDiagnosisHistory(Long horseId) {
        return getLamenessHistory(horseId);
    }
}
