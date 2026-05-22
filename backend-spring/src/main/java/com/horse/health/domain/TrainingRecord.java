package com.horse.health.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;

@Entity
@Table(name = "training_records")
@Getter @Setter
public class TrainingRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long horseId;
    private LocalDate date;
    private Double temperature;
    private Integer heartRate;
    private String appetite;
    private String trainingType;
    private Integer trainingTime; // 훈련 시간 (분)
    private String notes;
}
