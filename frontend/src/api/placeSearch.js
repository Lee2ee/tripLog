const FSQ_KEY = import.meta.env.VITE_FOURSQUARE_API_KEY || '';

/**
 * 장소 검색: Foursquare(키 있을 때) → Photon(폴백)
 * 반환 형태: [{ id, name, detail, lat, lng }]
 */
export async function searchPlaces(query) {
  if (FSQ_KEY) {
    const res = await fetch(
      `https://api.foursquare.com/v3/places/search?query=${encodeURIComponent(query)}&limit=6`,
      { headers: { Authorization: FSQ_KEY, Accept: 'application/json' } }
    );
    if (!res.ok) throw new Error(`Foursquare ${res.status}`);
    const data = await res.json();
    return (data.results || []).map((r) => ({
      id: r.fsq_id,
      name: r.name,
      detail: r.location?.formatted_address || '',
      lat: r.geocodes?.main?.latitude,
      lng: r.geocodes?.main?.longitude,
    })).filter((r) => r.lat != null && r.lng != null);
  }

  // Photon 폴백
  const res = await fetch(
    `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=6`
  );
  if (!res.ok) throw new Error(`Photon ${res.status}`);
  const data = await res.json();
  return (data.features || []).map((f) => {
    const p = f.properties;
    return {
      id: `${p.osm_id}-${p.osm_type}`,
      name: p.name || '',
      detail: [p.city, p.state, p.country].filter(Boolean).join(', '),
      lat: f.geometry.coordinates[1],
      lng: f.geometry.coordinates[0],
    };
  }).filter((r) => r.name);
}
