package com.triplog.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Builder
public class NotificationResponse {
    private Long id;
    private String message;
    private UUID tripId;
    private boolean isRead;
    private LocalDateTime createdAt;
}
