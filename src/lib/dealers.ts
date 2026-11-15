import dealerRecords from '@/data/dealers.json';

export type GeocodePrecision = 'address' | 'locality' | 'pincode';

export type Dealer = {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  pincode: string | null;
  latitude: number | null;
  longitude: number | null;
  geocodePrecision: GeocodePrecision | null;
};

export const ALL_DEALERS = dealerRecords as Dealer[];

export const MAPPED_DEALERS = ALL_DEALERS.filter(
  (dealer): dealer is Dealer & { latitude: number; longitude: number } =>
    dealer.latitude !== null && dealer.longitude !== null,
);

export const UNMAPPED_DEALERS = ALL_DEALERS.filter(
  (dealer) => dealer.latitude === null || dealer.longitude === null,
);

export function primaryPhone(phone: string | null): string | null {
  if (!phone) return null;
  const first = phone.split(/[/,]/)[0]?.replace(/[^\d+]/g, '') ?? '';
  return first.length >= 6 ? first : null;
}
