package com.triplog.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Builder @NoArgsConstructor @AllArgsConstructor
public class WishlistResponse {
    private Long id;
    private String name;
    private Double latitude;
    private Double longitude;
    private String address;
    private String memo;
    private LocalDateTime createdAt;
}
