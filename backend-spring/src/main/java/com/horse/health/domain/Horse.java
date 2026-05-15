package com.horse.health.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "horses")
@Getter @Setter
public class Horse {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String breed;
    private LocalDate birthDate;

    private String gender;

    @Column(name = "registration_number", length = 50)
    private String registrationNumber;

    @Column(name = "manager_id", length = 50)
    private String managerId;

    @Column(length = 20)
    private String purpose;

    @Column(columnDefinition = "TEXT")
    private String characteristics;
    
    @Column(name = "profile_image_url", length = 1000)
    private String profileImageUrl;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
