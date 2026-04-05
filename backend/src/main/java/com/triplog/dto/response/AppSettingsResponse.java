package com.triplog.dto.response;

import lombok.*;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppSettingsResponse {
    private int maxTripsPerUser;
    private int maxLocationsPerDay;
    private int maxImagesPerTrip;
    private int mapsMonthlyLimit;
}
