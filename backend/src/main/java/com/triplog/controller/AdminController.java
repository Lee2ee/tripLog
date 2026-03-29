package com.triplog.controller;

import com.triplog.dto.request.AdminCreateTripRequest;
import com.triplog.dto.request.AdminUpdateUserRequest;
import com.triplog.dto.request.TripRequest;
import com.triplog.dto.response.*;
import com.triplog.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    // ── 대시보드 통계 ──────────────────────────────────────────────────

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<AdminStatsResponse>> getStats() {
        return ResponseEntity.ok(ApiResponse.success(adminService.getStats()));
    }

    // ── 회원 관리 ──────────────────────────────────────────────────────

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getAllUsers() {
        return ResponseEntity.ok(ApiResponse.success(adminService.getAllUsers()));
    }

    @GetMapping("/users/{userId}")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.success(adminService.getUserById(userId)));
    }

    @PutMapping("/users/{userId}")
    public ResponseEntity<ApiResponse<UserResponse>> updateUser(
            @PathVariable Long userId,
            @Valid @RequestBody AdminUpdateUserRequest request) {
        return ResponseEntity.ok(ApiResponse.success(adminService.updateUser(userId, request)));
    }

    @PutMapping("/users/{userId}/role")
    public ResponseEntity<ApiResponse<UserResponse>> updateUserRole(
            @PathVariable Long userId,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.success(adminService.updateUserRole(userId, body.get("role"))));
    }

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable Long userId) {
        adminService.deleteUser(userId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // ── 여행 관리 ──────────────────────────────────────────────────────

    @GetMapping("/trips")
    public ResponseEntity<ApiResponse<List<TripResponse>>> getAllTrips() {
        return ResponseEntity.ok(ApiResponse.success(adminService.getAllTrips()));
    }

    @GetMapping("/trips/{tripId}")
    public ResponseEntity<ApiResponse<TripResponse>> getTripById(@PathVariable Long tripId) {
        return ResponseEntity.ok(ApiResponse.success(adminService.getTripById(tripId)));
    }

    @PostMapping("/trips")
    public ResponseEntity<ApiResponse<TripResponse>> createTrip(
            @Valid @RequestBody AdminCreateTripRequest request) {
        TripResponse response = adminService.createTrip(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("여행이 등록되었습니다.", response));
    }

    @PutMapping("/trips/{tripId}")
    public ResponseEntity<ApiResponse<TripResponse>> updateTrip(
            @PathVariable Long tripId,
            @Valid @RequestBody TripRequest request) {
        return ResponseEntity.ok(ApiResponse.success(adminService.updateTrip(tripId, request)));
    }

    @DeleteMapping("/trips/{tripId}")
    public ResponseEntity<ApiResponse<Void>> deleteTrip(@PathVariable Long tripId) {
        adminService.deleteTrip(tripId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // ── 이미지 관리 ────────────────────────────────────────────────────

    @GetMapping("/images")
    public ResponseEntity<ApiResponse<List<ImageResponse>>> getAllImages() {
        return ResponseEntity.ok(ApiResponse.success(adminService.getAllImages()));
    }

    @DeleteMapping("/images/{imageId}")
    public ResponseEntity<ApiResponse<Void>> deleteImage(@PathVariable Long imageId) {
        adminService.deleteImage(imageId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
