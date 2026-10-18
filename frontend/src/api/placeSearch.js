const TOMTOM_KEY = import.meta.env.VITE_TOMTOM_API_KEY || '';
const GOOGLE_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

// 세션 캐시: 같은 검색어는 API 재호출 없이 재사용
const cache = new Map();

const COUNTRY_LANGUAGE = {
  JP: 'ja', KR: 'ko', CN: 'zh', TW: 'zh-TW',
  US: 'en', GB: 'en', FR: 'fr', DE: 'de',
  IT: 'it', ES: 'es', TH: 'th', VN: 'vi',
};

/**
 * 장소 검색: Google Places(키 있을 때) → TomTom → Photon(폴백)
 * 반환 형태: [{ id, name, detail, lat, lng }]
 */
export async function searchPlaces(query, countryCode = '') {
  const cacheKey = `${query.trim().toLowerCase()}|${countryCode}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  // Google Places API (New) — 일본/아시아 POI 정확도 최상
  if (GOOGLE_KEY) {
    try {
      const body = {
        textQuery: query,
        languageCode: COUNTRY_LANGUAGE[countryCode] || 'ko',
        maxResultCount: 6,
      };
      if (countryCode) body.regionCode = countryCode;

      const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_KEY,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location',
        },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        const results = (data.places || [])
          .filter((p) => p.location)
          .map((p) => ({
            id: p.id,
            name: p.displayName?.text || '',
            detail: p.formattedAddress || '',
            lat: p.location.latitude,
            lng: p.location.longitude,
          }))
          .filter((p) => p.name);
        if (results.length > 0) {
          cache.set(cacheKey, results);
          return results;
        }
      }
    } catch (e) {
      console.error('[Search] Google Places 오류:', e);
    }
  }

  // TomTom 폴백
  if (TOMTOM_KEY) {
    try {
      const countryParam = countryCode ? `&countrySet=${countryCode}` : '';
      const res = await fetch(
        `https://api.tomtom.com/search/2/search/${encodeURIComponent(query)}.json?key=${TOMTOM_KEY}&limit=6&language=ko-KR${countryParam}`
      );
      if (res.ok) {
        const data = await res.json();
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
        if (results.length > 0) {
          cache.set(cacheKey, results);
          return results;
        }
      }
    } catch (e) {
      console.error('[Search] TomTom 오류:', e);
    }
  }

  // Photon 최종 폴백
  const res = await fetch(
    `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=6`
  );
  if (!res.ok) throw new Error(`Photon ${res.status}`);
  const data = await res.json();
  const results = (data.features || [])
    .map((f) => {
      const p = f.properties;
      return {
        id: `${p.osm_id}-${p.osm_type}`,
        name: p.name || '',
        detail: [p.city, p.state, p.country].filter(Boolean).join(', '),
        lat: f.geometry.coordinates[1],
        lng: f.geometry.coordinates[0],
      };
    })
    .filter((r) => r.name);
  cache.set(cacheKey, results);
  return results;
}
