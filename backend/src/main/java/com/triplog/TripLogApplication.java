package com.triplog;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class TripLogApplication {
    public static void main(String[] args) {
        SpringApplication.run(TripLogApplication.class, args);
    }
}
