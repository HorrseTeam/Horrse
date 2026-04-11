package com.horse.health.service;

import com.horse.health.domain.TrainingRecord;
import com.horse.health.repository.TrainingRecordRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@Transactional(readOnly = true)
public class TrainingRecordService {

    private final TrainingRecordRepository repository;

    public TrainingRecordService(TrainingRecordRepository repository) {
        this.repository = repository;
    }

    public List<TrainingRecord> getRecordsByHorseId(Long horseId) {
        return repository.findByHorseIdOrderByDateDesc(horseId);
    }

    @Transactional
    public TrainingRecord createRecord(TrainingRecord record) {
        if (record.getDate() == null) {
            record.setDate(LocalDate.now());
        }
        return repository.save(record);
    }

    @Transactional
    public Optional<TrainingRecord> updateRecord(Long id, TrainingRecord updatedRecord) {
        return repository.findById(id).map(record -> {
            if (updatedRecord.getDate() != null) record.setDate(updatedRecord.getDate());
            if (updatedRecord.getTemperature() != null) record.setTemperature(updatedRecord.getTemperature());
            if (updatedRecord.getHeartRate() != null) record.setHeartRate(updatedRecord.getHeartRate());
            if (updatedRecord.getAppetite() != null) record.setAppetite(updatedRecord.getAppetite());
            if (updatedRecord.getTrainingType() != null) record.setTrainingType(updatedRecord.getTrainingType());
            if (updatedRecord.getNotes() != null) record.setNotes(updatedRecord.getNotes());
            return repository.save(record);
        });
    }

    @Transactional
    public boolean deleteRecord(Long id) {
        if (repository.existsById(id)) {
            repository.deleteById(id);
            return true;
        }
        return false;
    }
}
