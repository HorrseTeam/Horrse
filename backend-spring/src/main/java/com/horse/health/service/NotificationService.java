package com.horse.health.service;

import com.horse.health.domain.Schedule;
import com.horse.health.repository.HorseRepository;
import com.horse.health.repository.ScheduleRepository;
import com.horse.health.repository.UserRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class NotificationService {

    private final ScheduleRepository scheduleRepository;
    private final UserRepository userRepository;
    private final HorseRepository horseRepository;
    private final FcmService fcmService;

    public NotificationService(ScheduleRepository scheduleRepository,
                               UserRepository userRepository,
                               HorseRepository horseRepository,
                               FcmService fcmService) {
        this.scheduleRepository = scheduleRepository;
        this.userRepository = userRepository;
        this.horseRepository = horseRepository;
        this.fcmService = fcmService;
    }

    @Scheduled(fixedRate = 60000)
    public void checkAndSendNotifications() {
        LocalDateTime now = LocalDateTime.now();

        List<Schedule> allSchedules = scheduleRepository.findAll();

        for (Schedule schedule : allSchedules) {
            if (Boolean.TRUE.equals(schedule.getNotify())
                    && Boolean.FALSE.equals(schedule.getNotified())
                    && schedule.getEventDate() != null
                    && schedule.getEventDate().isAfter(now.plusHours(23))
                    && schedule.getEventDate().isBefore(now.plusDays(1))) {

                if (schedule.getHorseId() != null) {
                    horseRepository.findById(schedule.getHorseId()).ifPresent(horse -> {
                        if (horse.getManagerId() != null) {
                            userRepository.findByUsername(horse.getManagerId()).ifPresent(user -> {
                                if (user.getFcmToken() != null && !user.getFcmToken().isEmpty()) {
                                    fcmService.sendPush(
                                            user.getFcmToken(),
                                            "일정 알림",
                                            schedule.getEventDate().getMonthValue() + "월 "
                                                    + schedule.getEventDate().getDayOfMonth() + "일 "
                                                    + schedule.getEventDate().getHour() + "시 | "
                                                    + horse.getName() + " " + schedule.getTitle()
                                    );
                                }
                            });
                        }
                    });
                }

                schedule.setNotified(true);
                scheduleRepository.save(schedule);

                System.out.println("[FCM] 알림 발송 완료 - " + schedule.getTitle());
            }
        }
    }
}