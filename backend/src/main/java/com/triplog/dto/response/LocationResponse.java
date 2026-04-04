package com.triplog.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LocationResponse {
    private Long id;
    private String name;
    private Double latitude;
    private Double longitude;
    private Integer orderIndex;
    private String category;
    private String memo;
    private String transportMode;
    private List<ImageResponse> images;
}
