package com.horse.health.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "hoof_diagnoses")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HoofDiagnosis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "horse_id", nullable = false)
    private Long horseId;

    @Column(name = "task_id", length = 255)
    private String taskId;

    @Column(name = "grade", length = 50)
    private String grade;

    @Column(name = "grade_probability")
    private Double gradeProbability;

    // JSON string: {"정상":0.01,"경미":0.02,"중등도":0.43,"심각":0.54}
    @Column(name = "class_probabilities", columnDefinition = "TEXT")
    private String classProbabilities;

    // AI 서버가 반환한 크랙 시각화 이미지 URL (MinIO)
    @Column(name = "image_url", length = 1000)
    private String imageUrl;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
