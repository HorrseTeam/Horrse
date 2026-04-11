package com.horse.health.controller;

import com.horse.health.domain.Horse;
import com.horse.health.service.HorseService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/horses")
@CrossOrigin(origins = "*")
public class HorseController {

    private final HorseService service;

    public HorseController(HorseService service) {
        this.service = service;
    }

    @GetMapping
    public List<Horse> getAllHorses() {
        return service.getAllHorses();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Horse> getHorse(@PathVariable Long id) {
        return service.getHorse(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Horse createHorse(@RequestBody Horse horse) {
        return service.createHorse(horse);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Horse> updateHorse(@PathVariable Long id, @RequestBody Horse updatedHorse) {
        return service.updateHorse(id, updatedHorse)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteHorse(@PathVariable Long id) {
        if (service.deleteHorse(id)) {
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
