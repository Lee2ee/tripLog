package com.triplog.controller;

import com.triplog.dto.request.TripRequest;
import com.triplog.dto.response.ApiResponse;
import com.triplog.dto.response.TripResponse;
import com.triplog.service.TripService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/trips")
@RequiredArgsConstructor
public class TripController {

    private final TripService tripService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<TripResponse>>> getTrips(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<TripResponse> trips = tripService.getTrips(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(trips));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TripResponse>> createTrip(
            @Valid @RequestBody TripRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        TripResponse trip = tripService.createTrip(request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Trip created successfully", trip));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TripResponse>> getTripById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        TripResponse trip = tripService.getTripById(id, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(trip));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTrip(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        tripService.deleteTrip(id, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Trip deleted successfully", null));
    }
}
