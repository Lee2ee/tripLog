package com.triplog.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;

@Getter
public class WishlistRequest {
    @NotBlank private String name;
    @NotNull  private Double latitude;
    @NotNull  private Double longitude;
    private String address;
    private String memo;
}
