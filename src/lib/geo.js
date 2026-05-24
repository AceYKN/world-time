export function haversineKm(a, b) {
  const toRad = (value) => (value * Math.PI) / 180;
  const radius = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * radius * Math.asin(Math.sqrt(h));
}

export function nearestLocation(coords, locations) {
  return locations.reduce(
    (nearest, location) => {
      const distance = haversineKm(coords, location);
      return distance < nearest.distance ? { location, distance } : nearest;
    },
    { location: locations[0], distance: Number.POSITIVE_INFINITY },
  ).location;
}
