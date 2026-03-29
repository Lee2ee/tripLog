package com.triplog.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TripResponse {
    private Long id;
    private String title;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDateTime createdAt;
    private List<TripDayResponse> tripDays;
    private List<ImageResponse> images;
    // populated in admin context only
    private String userEmail;
    private String userNickname;
    // visibility
    private Boolean isPublic;
    // collaboration fields
    private Long ownerId;
    private String ownerNickname;
    private Boolean isOwner;
    private int memberCount;
    private List<TripMemberResponse> members;
}
