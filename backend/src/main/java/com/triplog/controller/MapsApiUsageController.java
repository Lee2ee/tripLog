package com.triplog.controller;

import com.triplog.dto.response.ApiResponse;
import com.triplog.dto.response.MapsApiUsageStatsResponse;
import com.triplog.service.MapsApiUsageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
public class MapsApiUsageController {

    private final MapsApiUsageService mapsApiUsageService;

    /** 로그인 사용자: API 호출 1건 기록 */
    @PostMapping("/api/maps-usage")
    public ResponseEntity<Void> track(@RequestBody Map<String, Object> body) {
        String type  = (String) body.getOrDefault("type", "");
        int    count = body.get("count") instanceof Number n ? n.intValue() : 1;
        mapsApiUsageService.track(type, count);
        return ResponseEntity.ok().build();
    }

    /** 관리자: 사용량 통계 조회 (year, month 미입력 시 현재 달) */
    @GetMapping("/api/admin/maps-usage/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<MapsApiUsageStatsResponse>> getStats(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month) {
        return ResponseEntity.ok(ApiResponse.success(mapsApiUsageService.getStats(year, month)));
    }
}
