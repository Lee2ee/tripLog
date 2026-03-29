package com.triplog.dto.response;

import lombok.*;
import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminStatsResponse {
    private long totalUsers;
    private long totalTrips;
    private long totalImages;
    private List<MonthlyCount> tripsPerMonth;
    private List<MonthlyCount> usersPerMonth;
    private List<TopUser> topUsers;

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyCount {
        private String month;
        private long count;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TopUser {
        private String nickname;
        private String email;
        private long tripCount;
    }
}
