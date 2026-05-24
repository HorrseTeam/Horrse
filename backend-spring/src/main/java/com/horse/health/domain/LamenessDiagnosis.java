package com.horse.health.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "lameness_diagnoses")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LamenessDiagnosis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "horse_id", nullable = false)
    private Long horseId;

    @Column(name = "task_id", length = 255)
    private String taskId;

    @Column(name = "is_lameness")
    private Boolean isLameness;

    @Column(name = "walk_type", length = 50)
    private String walkType;

    @Column(name = "video_url", length = 1000)
    private String videoUrl;

    // AI 서버가 반환한 문제 관절 강조 이미지 URL (MinIO)
    @Column(name = "result_image_url", length = 1000)
    private String resultImageUrl;

    @Column(name = "walk_direction", length = 10)
    private String walkDirection;

    @Column(name = "affected_area", length = 50)
    private String affectedArea;

    @Column(name = "problem_joint", length = 50)
    private String problemJoint;

    @Column(name = "confidence")
    private Double confidence;

    // Use TEXT type to store JSON array of joints
    @Column(name = "joint_data", columnDefinition = "TEXT")
    private String jointData;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
