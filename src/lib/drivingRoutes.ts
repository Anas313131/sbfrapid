export type LatLon = { lat: number; lon: number };

export type RankedDealer<T> = {
  dealer: T;
  distanceKm: number;
  durationMin: number;
};

const OSRM_BASE_URL = import.meta.env.VITE_OSRM_BASE_URL || 'https://router.project-osrm.org';

function toOsrmCoordinate(point: LatLon) {
  return `${point.lon},${point.lat}`;
}

function isNumberOrNull(value: unknown): value is number | null {
  return value === null || (typeof value === 'number' && Number.isFinite(value));
}

export async function rankDealersByDrivingDistance<T extends { latitude: number; longitude: number }>(
  origin: LatLon,
  dealers: T[],
  signal?: AbortSignal,
): Promise<{ ranked: RankedDealer<T>[]; unreachable: T[] }> {
  if (dealers.length === 0) return { ranked: [], unreachable: [] };

  const points = dealers.map((dealer) => ({ lat: dealer.latitude, lon: dealer.longitude }));
  const coordinates = [origin, ...points].map(toOsrmCoordinate).join(';');
  const destinations = dealers.map((_, index) => index + 1).join(';');
  const url = `${OSRM_BASE_URL}/table/v1/driving/${coordinates}?sources=0&destinations=${destinations}&annotations=distance,duration`;

  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Routing failed with status ${response.status}`);

  const body = (await response.json()) as {
    code?: string;
    distances?: (number | null)[][];
    durations?: (number | null)[][];
  };
  const distances = body.distances?.[0];
  const durations = body.durations?.[0];
  if (
    body.code !== 'Ok' ||
    !Array.isArray(distances) ||
    !Array.isArray(durations) ||
    distances.length !== dealers.length ||
    durations.length !== dealers.length ||
    !distances.every(isNumberOrNull) ||
    !durations.every(isNumberOrNull)
  ) {
    throw new Error('Routing service returned an unexpected response');
  }

  const ranked: RankedDealer<T>[] = [];
  const unreachable: T[] = [];
  dealers.forEach((dealer, index) => {
    const meters = distances[index];
    const seconds = durations[index];
    if (meters === null || seconds === null) {
      unreachable.push(dealer);
      return;
    }
    ranked.push({ dealer, distanceKm: meters / 1000, durationMin: seconds / 60 });
  });

  ranked.sort((a, b) => a.distanceKm - b.distanceKm);
  return { ranked, unreachable };
}

export async function fetchRouteGeometry(
  origin: LatLon,
  destination: LatLon,
  signal?: AbortSignal,
): Promise<[number, number][]> {
  const coordinates = [origin, destination].map(toOsrmCoordinate).join(';');
  const url = `${OSRM_BASE_URL}/route/v1/driving/${coordinates}?overview=full&geometries=geojson`;

  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Route request failed with status ${response.status}`);

  const body = (await response.json()) as {
    code?: string;
    routes?: { geometry?: { coordinates?: [number, number][] } }[];
  };
  const line = body.routes?.[0]?.geometry?.coordinates;
  if (body.code !== 'Ok' || !Array.isArray(line) || line.length < 2) {
    throw new Error('Route geometry unavailable');
  }
  return line.map(([lon, lat]) => [lat, lon]);
}

export function formatDistance(km: number): string {
  return `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
}

export function formatDuration(minutes: number): string {
  const rounded = Math.max(1, Math.round(minutes));
  if (rounded < 60) return `${rounded} min`;
  const hours = Math.floor(rounded / 60);
  const rest = rounded % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}
