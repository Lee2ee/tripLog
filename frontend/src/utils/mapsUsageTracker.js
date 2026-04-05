import api from '../api/axios';

const QUEUE_KEY = 'maps_usage_queue';
const MAX_AGE_MS = 3 * 24 * 60 * 60 * 1000; // 3일 이상 된 항목은 폐기

/**
 * Google Maps API 호출을 백엔드에 기록합니다.
 * 전송 실패 시 localStorage 큐에 저장하여 다음 앱 실행 시 재전송합니다.
 */
export const trackApiCall = (type, count = 1) => {
  api.post('/maps-usage', { type, count }).catch(() => {
    try {
      const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
      queue.push({ type, count, ts: Date.now() });
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    } catch (_) {}
  });
};

/**
 * 인증된 사용자 진입 시 호출 — 미전송 큐를 백엔드로 플러시합니다.
 */
export const flushTrackingQueue = () => {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return;

    const queue = JSON.parse(raw);
    if (queue.length === 0) return;

    // 오래된 항목 제거
    const cutoff = Date.now() - MAX_AGE_MS;
    const valid = queue.filter((item) => item.ts > cutoff);
    localStorage.removeItem(QUEUE_KEY);
    if (valid.length === 0) return;

    // 타입별로 합산해서 한 번에 전송
    const grouped = valid.reduce((acc, { type, count }) => {
      acc[type] = (acc[type] || 0) + count;
      return acc;
    }, {});

    Object.entries(grouped).forEach(([type, count]) => {
      api.post('/maps-usage', { type, count }).catch(() => {});
    });
  } catch (_) {}
};
