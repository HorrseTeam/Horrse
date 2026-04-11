package com.horse.health.service;

import com.horse.health.domain.Horse;
import com.horse.health.repository.HorseRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional(readOnly = true)
public class HorseService {

    private final HorseRepository repository;

    public HorseService(HorseRepository repository) {
        this.repository = repository;
    }

    public List<Horse> getAllHorses() {
        return repository.findAll();
    }

    public Optional<Horse> getHorse(Long id) {
        return repository.findById(id);
    }

    @Transactional
    public Horse createHorse(Horse horse) {
        return repository.save(horse);
    }

    @Transactional
    public Optional<Horse> updateHorse(Long id, Horse updatedHorse) {
        return repository.findById(id).map(horse -> {
            if (updatedHorse.getName() != null) horse.setName(updatedHorse.getName());
            if (updatedHorse.getBreed() != null) horse.setBreed(updatedHorse.getBreed());
            if (updatedHorse.getBirthDate() != null) horse.setBirthDate(updatedHorse.getBirthDate());
            if (updatedHorse.getGender() != null) horse.setGender(updatedHorse.getGender());
            if (updatedHorse.getCharacteristics() != null) horse.setCharacteristics(updatedHorse.getCharacteristics());
            if (updatedHorse.getProfileImageUrl() != null) horse.setProfileImageUrl(updatedHorse.getProfileImageUrl());
            return repository.save(horse);
        });
    }

    @Transactional
    public boolean deleteHorse(Long id) {
        if (repository.existsById(id)) {
            repository.deleteById(id);
            return true;
        }
        return false;
    }
}
