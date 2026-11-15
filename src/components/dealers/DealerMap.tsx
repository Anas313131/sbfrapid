import { useEffect, useMemo } from 'react';
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import { divIcon, latLngBounds, type LatLngTuple } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { formatDistance, formatDuration, type RankedDealer } from '@/lib/drivingRoutes';
import { primaryPhone } from '@/lib/dealers';
import type { MappedDealer, RouteState, SearchOrigin } from '@/components/dealers/useDealerSearch';

const dealerIcon = divIcon({
  className: 'bg-transparent border-0',
  html: '<span class="block h-3.5 w-3.5 rounded-full border-2 border-white bg-navy-900 shadow-md"></span>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
  popupAnchor: [0, -8],
});

const selectedDealerIcon = divIcon({
  className: 'bg-transparent border-0',
  html: '<span class="block h-5 w-5 rounded-full border-[3px] border-white bg-red-600 shadow-lg ring-4 ring-red-200"></span>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -10],
});

const originIcon = divIcon({
  className: 'bg-transparent border-0',
  html: '<span class="relative flex h-5 w-5"><span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75"></span><span class="relative inline-flex h-5 w-5 rounded-full border-2 border-white bg-sky-600"></span></span>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -10],
});

function FitToPoints({ points }: { points: LatLngTuple[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    map.fitBounds(latLngBounds(points), { padding: [48, 48], maxZoom: 13 });
  }, [map, points]);
  return null;
}

type DealerMapProps = {
  dealers: MappedDealer[];
  origin: SearchOrigin | null;
  results: RankedDealer<MappedDealer>[];
  selectedId: string | null;
  route: RouteState;
  onSelectDealer: (id: string) => void;
};

export function DealerMap({ dealers, origin, results, selectedId, route, onSelectDealer }: DealerMapProps) {
  const selected = results.find((result) => result.dealer.id === selectedId);
  const routePath = route.status === 'ready' ? route.path : null;

  const fitPoints = useMemo<LatLngTuple[]>(() => {
    if (routePath) return routePath;
    if (origin && selected) {
      return [
        [origin.lat, origin.lon],
        [selected.dealer.latitude, selected.dealer.longitude],
      ];
    }
    const points = dealers.map((dealer): LatLngTuple => [dealer.latitude, dealer.longitude]);
    return origin ? [...points, [origin.lat, origin.lon]] : points;
  }, [routePath, origin, selected, dealers]);

  return (
    <div className="relative isolate h-[420px] overflow-hidden rounded-3xl border border-slate-200 shadow-card lg:h-full lg:min-h-[560px]">
      <MapContainer center={[28.8, 76.6]} zoom={7} scrollWheelZoom={false} className="h-full w-full">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <FitToPoints points={fitPoints} />

        {routePath && <Polyline positions={routePath} pathOptions={{ color: '#d7192d', weight: 5, opacity: 0.85 }} />}

        {origin && (
          <Marker position={[origin.lat, origin.lon]} icon={originIcon}>
            <Popup>
              <p className="text-sm font-semibold text-navy-900">Your search location</p>
              <p className="text-xs text-slate-600">{origin.label}</p>
            </Popup>
          </Marker>
        )}

        {dealers.map((dealer) => {
          const phone = primaryPhone(dealer.phone);
          const result = results.find((item) => item.dealer.id === dealer.id);
          return (
            <Marker
              key={dealer.id}
              position={[dealer.latitude, dealer.longitude]}
              icon={dealer.id === selectedId ? selectedDealerIcon : dealerIcon}
              eventHandlers={{ click: () => onSelectDealer(dealer.id) }}
            >
              <Popup>
                <div className="min-w-[200px] space-y-1 text-sm">
                  <p className="font-bold text-navy-900">{dealer.name}</p>
                  {dealer.address && <p className="text-slate-600">{dealer.address}</p>}
                  {phone && (
                    <a href={`tel:${phone}`} className="block font-semibold text-navy-900 underline underline-offset-2">
                      {dealer.phone}
                    </a>
                  )}
                  {result && (
                    <p className="pt-1 text-slate-700">
                      {formatDistance(result.distanceKm)} by road, about {formatDuration(result.durationMin)}
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
