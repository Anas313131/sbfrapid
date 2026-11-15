import { useEffect, type FormEvent } from 'react';
import { Crosshair, MapPin, Phone, Search } from 'lucide-react';
import { DealerMap } from '@/components/dealers/DealerMap';
import { DealerResultCard } from '@/components/dealers/DealerResultCard';
import { useDealerSearch } from '@/components/dealers/useDealerSearch';
import { SubmitButton } from '@/components/ui/Button';
import { inputClass } from '@/components/ui/FormField';
import { MAPPED_DEALERS, UNMAPPED_DEALERS, primaryPhone } from '@/lib/dealers';
import { formatDistance, formatDuration } from '@/lib/drivingRoutes';

type DealerLocatorProps = {
  initialPin?: string;
  autoLocate?: boolean;
};

function routeNotice(status: 'idle' | 'loading' | 'ready' | 'error') {
  if (status === 'loading') return 'Drawing the road route…';
  if (status === 'error') return 'The road route could not be drawn right now. Distances and times are still road-based.';
  return null;
}

export function DealerLocator({ initialPin, autoLocate = false }: DealerLocatorProps) {
  const {
    pinInput,
    setPinInput,
    state,
    selectedResult,
    selectDealer,
    route,
    searchByPin,
    searchByCurrentLocation,
  } = useDealerSearch();

  useEffect(() => {
    if (!initialPin) return;
    setPinInput(initialPin);
    void searchByPin(initialPin);
  }, [initialPin, setPinInput, searchByPin]);

  useEffect(() => {
    if (autoLocate) searchByCurrentLocation();
  }, [autoLocate, searchByCurrentLocation]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void searchByPin(pinInput);
  };

  const isSearching = state.status === 'searching';
  const readyState = state.status === 'ready' ? state : null;
  const notice = routeNotice(route.status);

  return (
    <div className="flex flex-col gap-10">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card ring-1 ring-slate-100 sm:p-8 lg:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-600">Dealer locator</p>
        <h2 className="mt-2 text-2xl font-bold leading-tight text-navy-900 sm:text-3xl">FIND YOUR NEAREST DEALER</h2>
        <p className="mt-3 max-w-2xl leading-[1.5] text-slate-600">
          Enter your six-digit PIN code or share your location. We rank our dealers by driving distance and show the road route.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3 sm:flex-row">
          <label htmlFor="dealer-pin" className="sr-only">Six-digit PIN code</label>
          <div className="relative flex-1">
            <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              id="dealer-pin"
              type="text"
              inputMode="numeric"
              autoComplete="postal-code"
              maxLength={6}
              value={pinInput}
              onChange={(event) => setPinInput(event.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit PIN code, e.g. 110001"
              className={`${inputClass} pl-11`}
            />
          </div>
          <SubmitButton>
            <Search className="h-4 w-4" aria-hidden="true" />
            Find Dealers
          </SubmitButton>
        </form>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={searchByCurrentLocation}
            disabled={isSearching}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-navy-900 px-5 py-2.5 text-sm font-semibold text-navy-900 transition duration-300 hover:-translate-y-0.5 hover:bg-navy-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Crosshair className="h-4 w-4" aria-hidden="true" />
            Use My Current Location
          </button>
          <p className="text-xs leading-relaxed text-slate-500">
            A PIN code search uses the approximate centre of that PIN area, so distances are estimates.
          </p>
        </div>
      </div>

      <div aria-live="polite">
        {state.status === 'idle' && (
          <div className="rounded-3xl bg-sky-100 p-10 text-center">
            <MapPin className="mx-auto h-10 w-10 text-navy-900" aria-hidden="true" />
            <p className="mx-auto mt-4 max-w-md text-navy-900">
              Search by PIN code or use your location to see the nearest dealers on the map.
            </p>
          </div>
        )}

        {state.status === 'searching' && (
          <div className="flex items-center gap-3 rounded-2xl bg-sky-50 p-5 text-sm text-navy-900">
            <span className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-sky-200 border-t-navy-900" aria-hidden="true" />
            {state.message}
          </div>
        )}

        {state.status === 'error' && (
          <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            {state.message}
          </p>
        )}
      </div>

      {readyState && selectedResult && (
        <section className="result-pop flex flex-col gap-8">
          <div className="flex flex-col gap-1 text-sm text-slate-600">
            <p>
              Showing the {readyState.results.length} nearest dealers to {readyState.origin.label}, nearest first.
            </p>
            {readyState.unreachableCount > 0 && (
              <p className="text-slate-500">
                {readyState.unreachableCount} dealer{readyState.unreachableCount === 1 ? ' was' : 's were'} not reachable by road from this location and {readyState.unreachableCount === 1 ? 'is' : 'are'} not ranked.
              </p>
            )}
          </div>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            <ul className="flex flex-col gap-5">
              {readyState.results.map((result, index) => (
                <li key={result.dealer.id}>
                  <DealerResultCard
                    result={result}
                    rank={index + 1}
                    origin={readyState.origin}
                    onViewOnMap={selectDealer}
                  />
                </li>
              ))}
            </ul>

            <div className="flex flex-col gap-3 lg:min-h-[560px]">
              <DealerMap
                dealers={MAPPED_DEALERS}
                origin={readyState.origin}
                results={readyState.results}
                selectedId={selectedResult.dealer.id}
                route={route}
                onSelectDealer={selectDealer}
              />
              {notice && <p className="text-xs text-slate-500">{notice}</p>}
              {route.status === 'ready' && (
                <p className="text-xs text-slate-500">
                  Route to {selectedResult.dealer.name}: {formatDistance(selectedResult.distanceKm)}, about{' '}
                  {formatDuration(selectedResult.durationMin)} driving.
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {UNMAPPED_DEALERS.length > 0 && (
        <section className="flex flex-col gap-4">
          <div>
            <h3 className="text-lg font-bold text-navy-900">Dealers with location unavailable</h3>
            <p className="mt-1 text-sm text-slate-600">
              These dealers are listed but we do not yet have a verified location for them.
            </p>
          </div>
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {UNMAPPED_DEALERS.map((dealer) => {
              const phone = primaryPhone(dealer.phone);
              return (
                <li key={dealer.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
                  <p className="font-semibold text-navy-900">{dealer.name}</p>
                  <p className="mt-1 text-sm text-slate-600">{dealer.address ?? 'Address not provided'}</p>
                  <p className="mt-1 text-sm text-slate-600">{dealer.pincode ? `PIN ${dealer.pincode}` : 'PIN not provided'}</p>
                  <p className="mt-3 flex items-center gap-2 text-sm text-slate-700">
                    <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                    {phone ? (
                      <a href={`tel:${phone}`} className="font-semibold text-navy-900 underline underline-offset-2">
                        {dealer.phone}
                      </a>
                    ) : (
                      'Phone not provided'
                    )}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
