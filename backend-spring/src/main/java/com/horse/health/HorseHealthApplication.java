package com.horse.health;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableAsync
@EnableScheduling
public class HorseHealthApplication {

	public static void main(String[] args) {
		SpringApplication.run(HorseHealthApplication.class, args);
	}

}
