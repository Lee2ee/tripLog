package com.triplog.config;

import com.triplog.entity.Role;
import com.triplog.entity.User;
import com.triplog.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    private static final String ADMIN_EMAIL = "admin@triplog.com";
    private static final String ADMIN_PASSWORD = "admin1234";
    private static final String ADMIN_NICKNAME = "관리자";

    @Override
    public void run(ApplicationArguments args) {
        if (userRepository.existsByEmail(ADMIN_EMAIL)) {
            return;
        }

        User admin = User.builder()
                .email(ADMIN_EMAIL)
                .password(passwordEncoder.encode(ADMIN_PASSWORD))
                .nickname(ADMIN_NICKNAME)
                .role(Role.ADMIN)
                .build();

        userRepository.save(admin);
        log.info("============================================");
        log.info("Admin account created");
        log.info("  Email   : {}", ADMIN_EMAIL);
        log.info("  Password: {}", ADMIN_PASSWORD);
        log.info("============================================");
    }
}
