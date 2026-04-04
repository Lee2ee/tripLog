package com.triplog.dto.request;

import jakarta.validation.constraints.Min;
import lombok.*;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class AppSettingsRequest {
    @Min(0)
    private int maxTripsPerUser;

    @Min(0)
    private int maxLocationsPerDay;

    @Min(1)
    private int maxImagesPerTrip;
}
