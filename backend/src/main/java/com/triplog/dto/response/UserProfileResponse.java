package com.triplog.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Builder @NoArgsConstructor @AllArgsConstructor
public class UserProfileResponse {
    private Long id;
    private String email;
    private String nickname;
    private String provider;
    private LocalDateTime createdAt;
    private long tripCount;
    private long locationCount;
    private long imageCount;
    private long wishlistCount;
}
