import type { LatLon } from '@/lib/drivingRoutes';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

type NominatimHit = { lat: string; lon: string };

export async function geocodePinCode(pin: string): Promise<LatLon | null> {
  const params = new URLSearchParams({
    postalcode: pin,
    countrycodes: 'in',
    format: 'json',
    limit: '1',
  });
  const response = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error(`PIN lookup failed with status ${response.status}`);

  const hits = (await response.json()) as NominatimHit[];
  const hit = hits[0];
  if (!hit) return null;

  const lat = Number(hit.lat);
  const lon = Number(hit.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return { lat, lon };
}
