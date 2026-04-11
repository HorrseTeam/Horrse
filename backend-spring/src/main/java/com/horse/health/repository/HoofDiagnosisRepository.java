package com.horse.health.repository;

import com.horse.health.domain.HoofDiagnosis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HoofDiagnosisRepository extends JpaRepository<HoofDiagnosis, Long> {
    List<HoofDiagnosis> findByHorseIdOrderByCreatedAtDesc(Long horseId);
}
