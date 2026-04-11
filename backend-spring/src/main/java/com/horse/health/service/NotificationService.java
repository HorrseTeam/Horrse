package com.horse.health.service;

import com.horse.health.domain.Schedule;
import com.horse.health.repository.ScheduleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class NotificationService {

    @Autowired
    private ScheduleRepository scheduleRepository;

    // Run every minute to simulate scanning the DB and firing Celery Beat / FCM Push notification
    @Scheduled(fixedRate = 60000)
    public void simulateFcmPushNotifications() {
        System.out.println("[Scheduler] Checking for upcoming schedules to notify via FCM...");
        List<Schedule> allSchedules = scheduleRepository.findAll();
        LocalDateTime now = LocalDateTime.now();

        for (Schedule schedule : allSchedules) {
            // IF event is within the next 24 hours (simulating the "notification a day before" PDF requirement)
            if (Boolean.TRUE.equals(schedule.getNotify()) && schedule.getEventDate() != null && schedule.getEventDate().isAfter(now) && schedule.getEventDate().isBefore(now.plusDays(1))) {
                System.out.println(">>> [FCM PUSH MOCK] Sending push notification to User for Horse ID " 
                                    + schedule.getHorseId() + "\n"
                                    + "   * Title: " + schedule.getTitle() + "\n"
                                    + "   * Date: " + schedule.getEventDate() + "\n"
                                    + "   * Message: 내일 중요한 일정이 다가옵니다!");
            }
        }
    }
}
