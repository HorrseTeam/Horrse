package com.horse.health.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "schedules")
@Getter @Setter
public class Schedule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long horseId;
    private String title;
    private LocalDateTime eventDate;
    private String description;
    private Boolean notify = true;
}
