package com.triplog.controller;

import com.triplog.dto.request.TripRequest;
import com.triplog.dto.response.ApiResponse;
import com.triplog.dto.response.TripMemberResponse;
import com.triplog.dto.response.TripResponse;
import com.triplog.service.TripService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.Nullable;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/trips")
@RequiredArgsConstructor
public class TripController {

    private final TripService tripService;

    // ── 여행 CRUD ──────────────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<ApiResponse<List<TripResponse>>> getTrips(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(tripService.getTrips(userDetails.getUsername())));
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
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(tripService.getTripById(id, userDetails.getUsername())));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTrip(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {
        tripService.deleteTrip(id, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Trip deleted successfully", null));
    }

    @PostMapping("/{id}/copy")
    public ResponseEntity<ApiResponse<TripResponse>> copyTrip(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {
        TripResponse trip = tripService.copyTrip(id, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("여행이 복사되었습니다.", trip));
    }

    @PatchMapping("/{id}/tags")
    public ResponseEntity<ApiResponse<TripResponse>> updateTags(
            @PathVariable UUID id,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        @SuppressWarnings("unchecked")
        java.util.Set<String> tags = body.get("tags") instanceof java.util.List
                ? new java.util.HashSet<>((java.util.List<String>) body.get("tags"))
                : new java.util.HashSet<>();
        TripResponse trip = tripService.updateTags(id, tags, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(trip));
    }

    // ── 공개 여행 (인증 불필요) ────────────────────────────────────────

    @GetMapping("/public")
    public ResponseEntity<ApiResponse<List<TripResponse>>> getPublicTrips() {
        return ResponseEntity.ok(ApiResponse.success(tripService.getPublicTrips()));
    }

    @GetMapping("/public/{id}")
    public ResponseEntity<ApiResponse<TripResponse>> getPublicTripById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(tripService.getPublicTripById(id)));
    }

    // ── 공개/비공개 전환 (소유자 전용) ───────────────────────────────

    @PatchMapping("/{id}/visibility")
    public ResponseEntity<ApiResponse<TripResponse>> updateVisibility(
            @PathVariable UUID id,
            @RequestBody Map<String, Boolean> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        Boolean isPublic = body.get("isPublic");
        if (isPublic == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("isPublic 값이 필요합니다."));
        }
        TripResponse trip = tripService.updateVisibility(id, isPublic, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(isPublic ? "여행이 공개되었습니다." : "여행이 비공개로 변경되었습니다.", trip));
    }

    // ── 멤버 관리 ──────────────────────────────────────────────────────

    @GetMapping("/{id}/members")
    public ResponseEntity<ApiResponse<List<TripMemberResponse>>> getMembers(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(tripService.getMembers(id, userDetails.getUsername())));
    }

    @PostMapping("/{id}/members")
    public ResponseEntity<ApiResponse<TripMemberResponse>> inviteMember(
            @PathVariable UUID id,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        Object userIdObj = body.get("userId");
        if (userIdObj == null) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("초대할 사용자를 선택해주세요."));
        }
        Long inviteeId = Long.valueOf(userIdObj.toString());
        TripMemberResponse member = tripService.inviteMemberById(id, inviteeId, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("멤버가 초대되었습니다.", member));
    }

    @DeleteMapping("/{id}/members/{memberId}")
    public ResponseEntity<ApiResponse<Void>> removeMember(
            @PathVariable UUID id,
            @PathVariable Long memberId,
            @AuthenticationPrincipal UserDetails userDetails) {
        tripService.removeMember(id, memberId, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("멤버가 제거되었습니다.", null));
    }

    @DeleteMapping("/{id}/leave")
    public ResponseEntity<ApiResponse<Void>> leaveTrip(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {
        tripService.leaveTrip(id, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("여행에서 나갔습니다.", null));
    }
}
