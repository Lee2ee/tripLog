const TOMTOM_KEY = import.meta.env.VITE_TOMTOM_API_KEY || '';

// 세션 캐시: 같은 검색어는 API 재호출 없이 재사용
const cache = new Map();

/**
 * 장소 검색: TomTom(키 있을 때) → Photon(폴백)
 * 반환 형태: [{ id, name, detail, lat, lng }]
 */
export async function searchPlaces(query, countryCode = '') {
  const cacheKey = `${query.trim().toLowerCase()}|${countryCode}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);
  if (TOMTOM_KEY) {
    const countryParam = countryCode ? `&countrySet=${countryCode}` : '';
    console.log('[Search] TomTom 사용, query:', query, '국가:', countryCode || '전체');
    const res = await fetch(
      `https://api.tomtom.com/search/2/search/${encodeURIComponent(query)}.json?key=${TOMTOM_KEY}&limit=6&language=ko-KR${countryParam}`
    );
    console.log('[Search] TomTom 응답 status:', res.status);
    if (!res.ok) {
      const errText = await res.text();
      console.error('[Search] TomTom 오류:', errText);
      throw new Error(`TomTom ${res.status}`);
    }
    const data = await res.json();
    console.log('[Search] TomTom 결과:', data.results?.length, '건');
    const results = (data.results || [])
      .filter((r) => r.position)
      .map((r) => ({
        id: r.id,
        name: r.poi?.name || r.address?.freeformAddress || '',
        detail: r.address?.freeformAddress || '',
        lat: r.position.lat,
        lng: r.position.lon,
      }))
      .filter((r) => r.name);
    cache.set(cacheKey, results);
    return results;
  }

  // Photon 폴백
  console.log('[Search] VITE_TOMTOM_API_KEY 미설정 → Photon 폴백, query:', query);
  const res = await fetch(
    `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=6`
  );
  if (!res.ok) throw new Error(`Photon ${res.status}`);
  const data = await res.json();
  const results = (data.features || []).map((f) => {
    const p = f.properties;
    return {
      id: `${p.osm_id}-${p.osm_type}`,
      name: p.name || '',
      detail: [p.city, p.state, p.country].filter(Boolean).join(', '),
      lat: f.geometry.coordinates[1],
      lng: f.geometry.coordinates[0],
    };
  }).filter((r) => r.name);
  cache.set(cacheKey, results);
  return results;
}
