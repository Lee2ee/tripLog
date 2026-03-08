package com.triplog.controller;

import com.triplog.dto.request.LocationRequest;
import com.triplog.dto.response.ApiResponse;
import com.triplog.dto.response.LocationResponse;
import com.triplog.service.LocationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class LocationController {

    private final LocationService locationService;

    @PostMapping("/api/trips/{tripId}/days/{dayId}/locations")
    public ResponseEntity<ApiResponse<LocationResponse>> addLocation(
            @PathVariable Long tripId,
            @PathVariable Long dayId,
            @Valid @RequestBody LocationRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        LocationResponse location = locationService.addLocation(tripId, dayId, request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Location added successfully", location));
    }

    @PutMapping("/api/locations/{id}")
    public ResponseEntity<ApiResponse<LocationResponse>> updateLocation(
            @PathVariable Long id,
            @Valid @RequestBody LocationRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        LocationResponse location = locationService.updateLocation(id, request, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Location updated successfully", location));
    }

    @DeleteMapping("/api/locations/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteLocation(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        locationService.deleteLocation(id, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Location deleted successfully", null));
    }
}
