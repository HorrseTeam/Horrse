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

    @Column(name = "confidence")
    private Double confidence;

    @Column(name = "result_image", length = 1000)
    private String resultImage;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
