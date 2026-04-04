package com.triplog.util;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 슬라이딩 윈도우 방식의 업로드 레이트 리미터.
 * 사용자 이메일 기준으로 분당 MAX_UPLOADS 회 제한.
 */
@Component
public class UploadRateLimiter {

    private static final int MAX_UPLOADS_PER_MINUTE = 20;
    private static final long WINDOW_MS = 60_000L;

    private final ConcurrentHashMap<String, Deque<Long>> log = new ConcurrentHashMap<>();

    /**
     * @return true → 허용, false → 제한 초과
     */
    public boolean tryAcquire(String userKey) {
        long now = System.currentTimeMillis();
        Deque<Long> timestamps = log.computeIfAbsent(userKey, k -> new ArrayDeque<>());
        synchronized (timestamps) {
            long cutoff = now - WINDOW_MS;
            while (!timestamps.isEmpty() && timestamps.peekFirst() < cutoff) {
                timestamps.pollFirst();
            }
            if (timestamps.size() >= MAX_UPLOADS_PER_MINUTE) return false;
            timestamps.addLast(now);
            return true;
        }
    }

    /** 5분마다 비활성 항목 제거 (메모리 누수 방지) */
    @Scheduled(fixedDelay = 300_000)
    public void cleanup() {
        long cutoff = System.currentTimeMillis() - WINDOW_MS;
        log.entrySet().removeIf(entry -> {
            synchronized (entry.getValue()) {
                return entry.getValue().isEmpty() || entry.getValue().peekLast() < cutoff;
            }
        });
    }
}
