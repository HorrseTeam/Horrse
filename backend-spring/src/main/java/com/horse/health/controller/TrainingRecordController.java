package com.horse.health.controller;

import com.horse.health.domain.TrainingRecord;
import com.horse.health.service.TrainingRecordService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/records")
@CrossOrigin(origins = "*")
public class TrainingRecordController {

    private final TrainingRecordService service;

    public TrainingRecordController(TrainingRecordService service) {
        this.service = service;
    }

    @GetMapping("/horse/{horseId}")
    public List<TrainingRecord> getRecords(@PathVariable Long horseId) {
        return service.getRecordsByHorseId(horseId);
    }

    @PostMapping
    public TrainingRecord createRecord(@RequestBody TrainingRecord record) {
        return service.createRecord(record);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TrainingRecord> updateRecord(@PathVariable Long id, @RequestBody TrainingRecord updatedRecord) {
        return service.updateRecord(id, updatedRecord)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRecord(@PathVariable Long id) {
        if (service.deleteRecord(id)) {
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
