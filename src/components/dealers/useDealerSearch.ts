import { useCallback, useEffect, useRef, useState } from 'react';
import { MAPPED_DEALERS, type Dealer } from '@/lib/dealers';
import { geocodePinCode } from '@/lib/geocodePin';
import {
  fetchRouteGeometry,
  rankDealersByDrivingDistance,
  type LatLon,
  type RankedDealer,
} from '@/lib/drivingRoutes';

export type MappedDealer = Dealer & { latitude: number; longitude: number };

export type SearchOrigin = LatLon & {
  label: string;
  approximate: boolean;
};

export const RESULT_COUNT = 5;

type SearchState =
  | { status: 'idle' }
  | { status: 'searching'; message: string }
  | { status: 'error'; message: string }
  | {
      status: 'ready';
      origin: SearchOrigin;
      results: RankedDealer<MappedDealer>[];
      unreachableCount: number;
    };

export type RouteState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; path: [number, number][] }
  | { status: 'error' };

const PIN_PATTERN = /^\d{6}$/;

export function useDealerSearch() {
  const [pinInput, setPinInput] = useState('');
  const [state, setState] = useState<SearchState>({ status: 'idle' });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [route, setRoute] = useState<RouteState>({ status: 'idle' });
  const requestRef = useRef(0);

  const runSearch = useCallback(async (origin: SearchOrigin) => {
    const requestId = ++requestRef.current;
    setState({ status: 'searching', message: 'Measuring driving distance to every dealer…' });
    try {
      const { ranked, unreachable } = await rankDealersByDrivingDistance(origin, MAPPED_DEALERS);
      if (requestId !== requestRef.current) return;
      if (ranked.length === 0) {
        setState({
          status: 'error',
          message: 'No dealer could be reached by road from this location. Please try another PIN code.',
        });
        return;
      }
      setSelectedId(ranked[0].dealer.id);
      setState({
        status: 'ready',
        origin,
        results: ranked.slice(0, RESULT_COUNT),
        unreachableCount: unreachable.length,
      });
    } catch {
      if (requestId !== requestRef.current) return;
      setState({
        status: 'error',
        message: 'We could not calculate road distances right now. Please try again in a moment.',
      });
    }
  }, []);

  const searchByPin = useCallback(
    async (rawPin: string) => {
      const pin = rawPin.trim();
      if (!PIN_PATTERN.test(pin)) {
        setState({ status: 'error', message: 'Enter a valid six-digit PIN code, for example 110001.' });
        return;
      }
      const requestId = ++requestRef.current;
      setState({ status: 'searching', message: 'Finding the area for this PIN code…' });

      let point: LatLon | null;
      try {
        point = await geocodePinCode(pin);
      } catch {
        if (requestId !== requestRef.current) return;
        setState({ status: 'error', message: 'We could not look up this PIN code. Check your connection and try again.' });
        return;
      }
      if (requestId !== requestRef.current) return;
      if (!point) {
        setState({ status: 'error', message: `We could not find PIN code ${pin}. Please check it and try again.` });
        return;
      }

      await runSearch({ ...point, label: `PIN code ${pin}`, approximate: true });
    },
    [runSearch],
  );

  const searchByCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState({ status: 'error', message: 'Your browser cannot share your location. Please search by PIN code instead.' });
      return;
    }
    requestRef.current += 1;
    setState({ status: 'searching', message: 'Waiting for your location permission…' });
    navigator.geolocation.getCurrentPosition(
      (position) =>
        runSearch({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          label: 'your current location',
          approximate: false,
        }),
      (error) => {
        const denied = error.code === error.PERMISSION_DENIED;
        setState({
          status: 'error',
          message: denied
            ? 'Location access was blocked. You can search by PIN code instead.'
            : 'We could not get your location. Please try again or search by PIN code.',
        });
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 },
    );
  }, [runSearch]);

  const selectedResult = state.status === 'ready'
    ? state.results.find((result) => result.dealer.id === selectedId) ?? state.results[0]
    : undefined;
  const origin = state.status === 'ready' ? state.origin : null;
  const destinationLat = selectedResult?.dealer.latitude;
  const destinationLon = selectedResult?.dealer.longitude;

  useEffect(() => {
    if (!origin || destinationLat === undefined || destinationLon === undefined) {
      setRoute({ status: 'idle' });
      return;
    }
    const controller = new AbortController();
    setRoute({ status: 'loading' });
    fetchRouteGeometry(origin, { lat: destinationLat, lon: destinationLon }, controller.signal)
      .then((path) => setRoute({ status: 'ready', path }))
      .catch(() => {
        if (!controller.signal.aborted) setRoute({ status: 'error' });
      });
    return () => controller.abort();
  }, [origin, destinationLat, destinationLon]);

  return {
    pinInput,
    setPinInput,
    state,
    selectedResult,
    selectDealer: setSelectedId,
    route,
    searchByPin,
    searchByCurrentLocation,
  };
}
