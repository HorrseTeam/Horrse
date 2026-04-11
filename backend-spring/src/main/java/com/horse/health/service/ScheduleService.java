package com.horse.health.service;

import com.horse.health.domain.Schedule;
import com.horse.health.repository.ScheduleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional(readOnly = true)
public class ScheduleService {

    private final ScheduleRepository repository;

    public ScheduleService(ScheduleRepository repository) {
        this.repository = repository;
    }

    public List<Schedule> getSchedulesByHorseId(Long horseId) {
        return repository.findByHorseIdOrderByEventDateAsc(horseId);
    }

    @Transactional
    public Schedule createSchedule(Schedule schedule) {
        return repository.save(schedule);
    }

    @Transactional
    public Optional<Schedule> updateSchedule(Long id, Schedule updatedSchedule) {
        return repository.findById(id).map(schedule -> {
            if (updatedSchedule.getTitle() != null) schedule.setTitle(updatedSchedule.getTitle());
            if (updatedSchedule.getEventDate() != null) schedule.setEventDate(updatedSchedule.getEventDate());
            if (updatedSchedule.getDescription() != null) schedule.setDescription(updatedSchedule.getDescription());
            if (updatedSchedule.getNotify() != null) schedule.setNotify(updatedSchedule.getNotify());
            return repository.save(schedule);
        });
    }

    @Transactional
    public boolean deleteSchedule(Long id) {
        if (repository.existsById(id)) {
            repository.deleteById(id);
            return true;
        }
        return false;
    }
}
