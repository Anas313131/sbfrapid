import { Clock, Navigation, Phone, Route, MapPin } from 'lucide-react';
import type { MappedDealer, SearchOrigin } from '@/components/dealers/useDealerSearch';
import { primaryPhone } from '@/lib/dealers';
import { formatDistance, formatDuration, type RankedDealer } from '@/lib/drivingRoutes';

type DealerResultCardProps = {
  result: RankedDealer<MappedDealer>;
  rank: number;
  origin: SearchOrigin;
  onViewOnMap: (id: string) => void;
};

function directionsUrl(origin: SearchOrigin, dealer: MappedDealer) {
  return `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lon}&destination=${dealer.latitude},${dealer.longitude}&travelmode=driving`;
}

export function DealerResultCard({ result, rank, origin, onViewOnMap }: DealerResultCardProps) {
  const { dealer } = result;
  const featured = rank === 1;
  const phone = primaryPhone(dealer.phone);
  const textMuted = featured ? 'text-navy-100' : 'text-slate-600';
  const statBox = featured ? 'bg-white/10 text-white' : 'bg-sky-100 text-navy-900';

  return (
    <article
      className={`flex flex-col gap-5 rounded-2xl p-6 card-lift ${
        featured
          ? 'bg-navy-900 text-white shadow-lift ring-2 ring-red-600'
          : 'border border-slate-200 bg-white text-navy-900 shadow-card hover:shadow-lift'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
            featured ? 'bg-red-600 text-white' : 'bg-slate-100 text-navy-900'
          }`}
        >
          {featured ? 'Nearest by road' : `Option ${rank - 1}`}
        </span>
        {dealer.geocodePrecision !== 'address' && (
          <span className={`text-xs ${textMuted}`}>Approximate location</span>
        )}
      </div>

      <div>
        <h3 className="text-lg font-bold leading-snug">{dealer.name}</h3>
        <p className={`mt-2 text-sm ${textMuted}`}>{dealer.address ?? 'Full address not provided'}</p>
        {dealer.pincode && (
          <p className={`mt-1 flex items-center gap-1.5 text-sm ${textMuted}`}>
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            PIN {dealer.pincode}
          </p>
        )}
        <p className={`mt-1 flex items-center gap-1.5 text-sm ${textMuted}`}>
          <Phone className="h-3.5 w-3.5" aria-hidden="true" />
          {phone ? (
            <a href={`tel:${phone}`} className="underline underline-offset-2 hover:opacity-80">
              {dealer.phone}
            </a>
          ) : (
            'Phone not provided'
          )}
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-3">
        <div className={`rounded-xl p-3 ${statBox}`}>
          <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider opacity-80">
            <Route className="h-3.5 w-3.5" aria-hidden="true" />
            Driving distance
          </dt>
          <dd className="mt-1 text-xl font-bold">{formatDistance(result.distanceKm)}</dd>
        </div>
        <div className={`rounded-xl p-3 ${statBox}`}>
          <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider opacity-80">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            Est. drive time
          </dt>
          <dd className="mt-1 text-xl font-bold">{formatDuration(result.durationMin)}</dd>
        </div>
      </dl>

      <div className="mt-auto flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => onViewOnMap(dealer.id)}
          className={`inline-flex flex-1 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition ${
            featured
              ? 'border border-white/60 text-white hover:bg-white hover:text-navy-900'
              : 'border border-navy-900 text-navy-900 hover:bg-navy-900 hover:text-white'
          }`}
        >
          <MapPin className="h-4 w-4" aria-hidden="true" />
          View on map
        </button>
        <a
          href={directionsUrl(origin, dealer)}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex flex-1 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition hover:-translate-y-0.5 ${
            featured ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-navy-900 text-white hover:bg-navy-800'
          }`}
        >
          <Navigation className="h-4 w-4" aria-hidden="true" />
          Get directions
        </a>
      </div>
    </article>
  );
}
