package com.triplog.service;

import com.triplog.dto.response.MapsApiUsageStatsResponse;
import com.triplog.entity.MapsApiUsage;
import com.triplog.entity.Notification;
import com.triplog.entity.Role;
import com.triplog.repository.MapsApiUsageRepository;
import com.triplog.repository.NotificationRepository;
import com.triplog.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MapsApiUsageService {

    public static final String DIRECTIONS = "DIRECTIONS";
    public static final String PLACES     = "PLACES";
    public static final String MAP_LOAD   = "MAP_LOAD";
    private static final Set<String> VALID_TYPES = Set.of(DIRECTIONS, PLACES, MAP_LOAD);

    // Google Maps 단가 (USD / 요청)
    private static final double COST_DIRECTIONS = 0.005;   // $5 / 1,000
    private static final double COST_PLACES     = 0.017;   // $17 / 1,000 (세션)
    private static final double COST_MAP_LOAD   = 0.007;   // $7 / 1,000
    private static final double FREE_CREDIT     = 200.0;   // Google 월 무료 크레딧

    private static final int[] ALERT_THRESHOLDS = {80, 100};

    private final MapsApiUsageRepository repository;
    private final SettingsService settingsService;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;

    @Transactional
    public void track(String apiType, int count) {
        if (!VALID_TYPES.contains(apiType) || count <= 0) return;

        LocalDate today = LocalDate.now();
        MapsApiUsage usage = repository.findByUsageDateAndApiType(today, apiType)
                .orElse(MapsApiUsage.builder()
                        .usageDate(today).apiType(apiType).callCount(0).build());
        usage.setCallCount(usage.getCallCount() + count);
        repository.save(usage);

        // 한도 초과 알림 체크
        int limit = settingsService.getMapsMonthlyLimit();
        if (limit > 0) {
            LocalDate monthStart = today.withDayOfMonth(1);
            int newTotal  = sumAll(monthStart, today);
            int prevTotal = newTotal - count;
            checkThresholds(prevTotal, newTotal, limit);
        }
    }

    @Transactional(readOnly = true)
    public MapsApiUsageStatsResponse getStats(Integer year, Integer month) {
        LocalDate today = LocalDate.now();

        // 조회 대상 기간 계산
        LocalDate refStart = (year != null && month != null)
                ? LocalDate.of(year, month, 1)
                : today.withDayOfMonth(1);
        LocalDate refEnd = refStart.plusMonths(1).minusDays(1);
        if (refEnd.isAfter(today)) refEnd = today;   // 미래는 오늘까지만

        LocalDate chartStart = refEnd.minusDays(6);

        // 오늘 통계 (선택 기간이 현재 달일 때만 의미 있음)
        int todayDir = repository.sumCallCount(today, today, DIRECTIONS);
        int todayPl  = repository.sumCallCount(today, today, PLACES);
        int todayMl  = repository.sumCallCount(today, today, MAP_LOAD);

        // 해당 월 통계
        int monthDir = repository.sumCallCount(refStart, refEnd, DIRECTIONS);
        int monthPl  = repository.sumCallCount(refStart, refEnd, PLACES);
        int monthMl  = repository.sumCallCount(refStart, refEnd, MAP_LOAD);

        // 비용 계산 ($200 무료 크레딧 반영)
        double raw  = monthDir * COST_DIRECTIONS + monthPl * COST_PLACES + monthMl * COST_MAP_LOAD;
        double bill = Math.max(0, raw - FREE_CREDIT);
        raw  = Math.round(raw  * 100.0) / 100.0;
        bill = Math.round(bill * 100.0) / 100.0;

        int limit     = settingsService.getMapsMonthlyLimit();
        int total     = monthDir + monthPl + monthMl;
        int remaining = limit > 0 ? Math.max(0, limit - total) : -1;

        String periodLabel = refStart.format(DateTimeFormatter.ofPattern("yyyy년 M월"));

        return MapsApiUsageStatsResponse.builder()
                .todayDirections(todayDir)
                .todayPlaces(todayPl)
                .todayMapLoads(todayMl)
                .monthDirections(monthDir)
                .monthPlaces(monthPl)
                .monthMapLoads(monthMl)
                .monthlyLimit(limit)
                .remainingCalls(remaining)
                .rawCostUsd(raw)
                .estimatedCostUsd(bill)
                .periodLabel(periodLabel)
                .dailyChart(buildChart(chartStart, refEnd))
                .build();
    }

    // ── private helpers ────────────────────────────────────────────────

    private int sumAll(LocalDate from, LocalDate to) {
        return repository.sumCallCount(from, to, DIRECTIONS)
             + repository.sumCallCount(from, to, PLACES)
             + repository.sumCallCount(from, to, MAP_LOAD);
    }

    private void checkThresholds(int prev, int current, int limit) {
        for (int pct : ALERT_THRESHOLDS) {
            int threshold = limit * pct / 100;
            if (prev < threshold && current >= threshold) {
                String msg = String.format(
                        "⚠️ Google Maps API 월 사용량 %d%% 도달 (%d / %d 회)", pct, current, limit);
                userRepository.findByRole(Role.ADMIN).forEach(admin ->
                        notificationRepository.save(
                                Notification.builder().recipient(admin).message(msg).build()));
                log.warn("Maps API threshold alert sent: {}%", pct);
            }
        }
    }

    private List<MapsApiUsageStatsResponse.DailyPoint> buildChart(LocalDate from, LocalDate to) {
        List<MapsApiUsage> rows = repository.findByDateRange(from, to);

        Map<LocalDate, Map<String, Integer>> byDate = new LinkedHashMap<>();
        for (LocalDate d = from; !d.isAfter(to); d = d.plusDays(1)) {
            byDate.put(d, new HashMap<>());
        }
        rows.forEach(r -> byDate.get(r.getUsageDate()).put(r.getApiType(), r.getCallCount()));

        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MM-dd");
        return byDate.entrySet().stream()
                .map(e -> MapsApiUsageStatsResponse.DailyPoint.builder()
                        .date(e.getKey().format(fmt))
                        .directions(e.getValue().getOrDefault(DIRECTIONS, 0))
                        .places(e.getValue().getOrDefault(PLACES, 0))
                        .mapLoads(e.getValue().getOrDefault(MAP_LOAD, 0))
                        .build())
                .collect(Collectors.toList());
    }
}
