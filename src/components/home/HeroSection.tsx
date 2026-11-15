import { useState, type CSSProperties, type FormEvent } from 'react';
import { ArrowRight, Crosshair, MapPin, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ButtonLink, SubmitButton } from '@/components/ui/Button';
import { inputClass } from '@/components/ui/FormField';
import { TmtCalculator } from '@/components/calculator/TmtCalculator';

const HERO_IMAGE = 'https://images.pexels.com/photos/6804258/pexels-photo-6804258.jpeg?auto=compress&cs=tinysrgb&w=2000';

const rise = (delay: number) => ({ '--rise-delay': `${delay}ms` }) as CSSProperties;

export function HeroSection() {
  return (
    <section className="relative bg-navy-950 text-white">
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={HERO_IMAGE}
          alt=""
          aria-hidden="true"
          fetchPriority="high"
          className="hero-zoom h-full w-full object-cover object-[center_40%]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-navy-950/95 via-navy-950/75 to-navy-900/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/10 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 pb-40 pt-16 sm:px-8 sm:pb-44 sm:pt-24 lg:px-10 lg:pb-48 lg:pt-32">
        <span
          style={rise(0)}
          className="hero-rise inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white backdrop-blur"
        >
          <span className="h-2 w-2 rounded-full bg-green-500" aria-hidden="true" />
          Trusted steel manufacturer since 1991
        </span>

        <h1 style={rise(120)} className="hero-rise mt-6 max-w-3xl pb-2 text-5xl font-bold leading-[1.08] sm:text-6xl lg:text-7xl">
          Built for a <br />
          <span className="text-red-500">Stronger</span> Tomorrow
        </h1>
        <p style={rise(240)} className="hero-rise mt-6 max-w-xl text-base leading-[1.5] text-navy-100 sm:text-lg">
          High-quality TMT steel and steel products engineered for strength, safety and sustainability.
        </p>

        <div style={rise(360)} className="hero-rise mt-10 flex flex-col gap-3 sm:flex-row">
          <ButtonLink to="/our-products" className="group">
            Explore Products
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden="true" />
          </ButtonLink>
          <ButtonLink to="/about-us" variant="light">
            About SBF Rapid
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}

const PIN_PATTERN = /^\d{6}$/;

export function QuickPanel() {
  const navigate = useNavigate();
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState<string | undefined>();

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!PIN_PATTERN.test(pin)) {
      setPinError('Enter a valid six-digit PIN code, for example 110001.');
      return;
    }
    setPinError(undefined);
    navigate(`/find-dealers?q=${pin}`);
  };

  return (
    <div className="relative z-10 mx-auto -mt-28 max-w-7xl px-5 sm:px-8 lg:-mt-36 lg:px-10">
      <div className="grid overflow-hidden rounded-3xl bg-white text-navy-900 shadow-lift ring-1 ring-slate-200 lg:grid-cols-[1.25fr_1fr]">
        <div className="p-6 sm:p-8 lg:p-10">
          <TmtCalculator />
        </div>

        <div className="flex flex-col justify-between gap-8 border-t border-slate-200 bg-sky-100 p-6 sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
          <div className="space-y-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600 text-white shadow-[0_8px_20px_-6px_rgba(215,25,45,0.55)]">
              <MapPin className="h-5 w-5" aria-hidden="true" />
            </span>
            <h2 className="text-xl font-bold text-navy-900">Find Dealers Near You</h2>
            <p className="text-sm leading-[1.5] text-slate-600">
              Enter your six-digit PIN code to see the nearest authorised SBF Rapid dealers by road distance.
            </p>
          </div>

          <form onSubmit={handleSearch} noValidate className="space-y-3">
            <label htmlFor="quick-dealer-pin" className="sr-only">
              Six-digit PIN code
            </label>
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                id="quick-dealer-pin"
                type="text"
                inputMode="numeric"
                autoComplete="postal-code"
                maxLength={6}
                value={pin}
                onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit PIN code"
                aria-invalid={!!pinError}
                aria-describedby={pinError ? 'quick-dealer-error' : undefined}
                className={`${inputClass} pl-11`}
              />
            </div>
            {pinError && (
              <p id="quick-dealer-error" role="alert" className="text-sm text-red-600">
                {pinError}
              </p>
            )}
            <SubmitButton className="w-full">
              <Search className="h-4 w-4" aria-hidden="true" />
              Find Dealers
            </SubmitButton>
          </form>

          <button
            type="button"
            onClick={() => navigate('/find-dealers?locate=1')}
            className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-navy-900 underline-offset-4 transition hover:text-red-600 hover:underline"
          >
            <Crosshair className="h-4 w-4" aria-hidden="true" />
            Use My Current Location
          </button>
        </div>
      </div>
    </div>
  );
}
