const EARTH_M = 6371000;

export function haversineMeters(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_M * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** Pick closest delivery region by map center (fallback when name match fails). */
export function nearestRegionByCenter(lat, lng, regions) {
  let best = null;
  let bestD = Infinity;
  for (const r of regions) {
    const c = r.mapCenter;
    if (!c || !Number.isFinite(c.lat) || !Number.isFinite(c.lng)) continue;
    const d = haversineMeters(lat, lng, c.lat, c.lng);
    if (d < bestD) {
      bestD = d;
      best = r;
    }
  }
  return best ? { region: best, distanceM: bestD } : null;
}

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Match Nominatim result text to a delivery region (longest substring wins).
 */
export function matchRegionFromGeocode(regions, { displayName = '', address = null } = {}) {
  const hay = norm(
    [displayName, address?.suburb, address?.neighbourhood, address?.city_district, address?.quarter]
      .filter(Boolean)
      .join(' ')
  );

  if (!hay || !regions?.length) return null;

  let best = null;
  let bestLen = 0;

  for (const r of regions) {
    const en = norm(typeof r.name === 'object' ? r.name?.en : r.name);
    const ar = norm(typeof r.name === 'object' ? r.name?.ar : '');
    for (const token of [en, ar]) {
      if (token.length >= 3 && hay.includes(token) && token.length > bestLen) {
        bestLen = token.length;
        best = r;
      }
    }
  }
  return best;
}

/**
 * Resolve delivery region for a geocoded point: prefer name hints, else nearest center.
 */
export function resolveRegionForPoint(regions, lat, lng, geocodeMeta) {
  const fromName = matchRegionFromGeocode(regions, geocodeMeta);
  if (fromName) return { region: fromName, strategy: 'name' };
  const near = nearestRegionByCenter(lat, lng, regions);
  if (near) return { region: near.region, strategy: 'distance' };
  return null;
}
