package com.triplog.controller;

import com.triplog.dto.response.ApiResponse;
import com.triplog.service.TripLikeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/trips/{tripId}/like")
@RequiredArgsConstructor
public class TripLikeController {

    private final TripLikeService tripLikeService;

    @PostMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> toggle(
            @PathVariable UUID tripId,
            @AuthenticationPrincipal UserDetails userDetails) {
        Map<String, Object> result = tripLikeService.toggle(tripId, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStatus(
            @PathVariable UUID tripId,
            @AuthenticationPrincipal UserDetails userDetails) {
        String email = userDetails != null ? userDetails.getUsername() : null;
        Map<String, Object> result = tripLikeService.getStatus(tripId, email);
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
