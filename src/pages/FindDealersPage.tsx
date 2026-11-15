import { useSearchParams } from 'react-router-dom';
import { DealerLocator } from '@/components/dealers/DealerLocator';
import { PageHero } from '@/components/ui/PageHero';
import { useDocumentMeta } from '@/lib/useDocumentMeta';

const PIN_PATTERN = /^\d{6}$/;

export function FindDealersPage() {
  useDocumentMeta('Find Dealers', 'Find the nearest authorised SBF Rapid dealer by PIN code or your current location.');
  const [searchParams] = useSearchParams();
  const pinParam = (searchParams.get('q') ?? '').trim();

  return (
    <>
      <PageHero
        eyebrow="Find dealers"
        title={<>Find an <span className="text-red-500">authorised dealer</span></>}
        description="Search by six-digit PIN code or share your location to find the nearest SBF Rapid dealer by road."
        breadcrumb="Find Dealers"
      />

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <DealerLocator initialPin={PIN_PATTERN.test(pinParam) ? pinParam : undefined} />
        </div>
      </section>
    </>
  );
}
