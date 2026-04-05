package com.triplog.dto.response;

import lombok.*;

import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MapsApiUsageStatsResponse {

    private int todayDirections;
    private int todayPlaces;
    private int todayMapLoads;
    private int monthDirections;
    private int monthPlaces;
    private int monthMapLoads;
    private int monthlyLimit;
    private int remainingCalls;
    private double rawCostUsd;       // $200 크레딧 적용 전
    private double estimatedCostUsd; // $200 크레딧 적용 후 실 청구 예상액
    private String periodLabel;      // 예: "2026년 4월"

    private List<DailyPoint> dailyChart;

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyPoint {
        private String date;
        private int directions;
        private int places;
        private int mapLoads;
    }
}
