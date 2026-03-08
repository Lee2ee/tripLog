/**
 * Calculates the great-circle distance between two points on Earth
 * using the Haversine formula.
 *
 * @param {number} lat1 - Latitude of the first point in degrees
 * @param {number} lng1 - Longitude of the first point in degrees
 * @param {number} lat2 - Latitude of the second point in degrees
 * @param {number} lng2 - Longitude of the second point in degrees
 * @returns {number} Distance in kilometers
 */
export const haversine = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in kilometers
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Calculates the total distance of a route through an ordered list of locations.
 *
 * @param {Array<{latitude: number, longitude: number}>} locations - Ordered array of location objects
 * @returns {number} Total distance in kilometers, rounded to 2 decimal places
 */
export const calculateTotalDistance = (locations) => {
  if (!locations || locations.length < 2) return 0;

  let total = 0;
  for (let i = 0; i < locations.length - 1; i++) {
    total += haversine(
      locations[i].latitude,
      locations[i].longitude,
      locations[i + 1].latitude,
      locations[i + 1].longitude
    );
  }

  return Math.round(total * 100) / 100;
};
