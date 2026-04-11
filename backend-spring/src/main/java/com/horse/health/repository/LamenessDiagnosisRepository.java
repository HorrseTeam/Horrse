package com.horse.health.repository;

import com.horse.health.domain.LamenessDiagnosis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LamenessDiagnosisRepository extends JpaRepository<LamenessDiagnosis, Long> {
    List<LamenessDiagnosis> findByHorseIdOrderByCreatedAtDesc(Long horseId);
}
