import { useMemo, useState, type ChangeEvent, type ComponentProps } from 'react';
import { Calculator, CircleDot, IndianRupee, Info, Layers, Ruler, Scale, Wallet } from 'lucide-react';
import { calculateTmtEstimate } from '@/lib/calculator';
import { Field, inputClass } from '@/components/ui/FormField';
import type { LucideIcon } from 'lucide-react';

const MIN_DIAMETER_MM = 8;
const MAX_DIAMETER_MM = 40;
const MAX_LENGTH_M = 1000;
const MAX_QUANTITY = 10000;

type Values = { diameter: string; length: string; quantity: string; rate: string };

const INITIAL_VALUES: Values = { diameter: '12', length: '12', quantity: '10', rate: '' };

function parseNumber(value: string) {
  const trimmed = value.trim();
  if (trimmed === '') return Number.NaN;
  return Number(trimmed);
}

function validate(values: Values) {
  const errors: Partial<Record<keyof Values, string>> = {};
  const diameter = parseNumber(values.diameter);
  const length = parseNumber(values.length);
  const quantity = parseNumber(values.quantity);
  const rate = parseNumber(values.rate);

  if (!(diameter >= MIN_DIAMETER_MM && diameter <= MAX_DIAMETER_MM)) {
    errors.diameter = `Enter a bar diameter between ${MIN_DIAMETER_MM} and ${MAX_DIAMETER_MM} mm.`;
  }
  if (!(length > 0 && length <= MAX_LENGTH_M)) {
    errors.length = `Enter a length greater than 0 and up to ${MAX_LENGTH_M} m.`;
  }
  if (!(Number.isInteger(quantity) && quantity >= 1 && quantity <= MAX_QUANTITY)) {
    errors.quantity = `Enter a whole number of bars between 1 and ${MAX_QUANTITY.toLocaleString('en-IN')}.`;
  }
  if (values.rate.trim() !== '' && !(rate >= 0)) {
    errors.rate = 'Enter a rate of zero or more, or leave this blank.';
  }

  return { errors, diameter, length, quantity, rate: values.rate.trim() === '' ? undefined : rate };
}

const numberFormat = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 });
const currencyFormat = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

type IconInputProps = ComponentProps<'input'> & { icon: LucideIcon };

function IconInput({ icon: Icon, ...inputProps }: IconInputProps) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
      <input {...inputProps} className={`${inputClass} pl-11`} />
    </div>
  );
}

type ResultTileProps = { icon: LucideIcon; label: string; value: string; accent?: boolean };

function ResultTile({ icon: Icon, label, value, accent = false }: ResultTileProps) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-card">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <Icon className={`h-4 w-4 ${accent ? 'text-red-600' : 'text-navy-700'}`} aria-hidden="true" />
        {label}
      </div>
      <p className={`mt-2 text-2xl font-bold tabular-nums ${accent ? 'text-red-600' : 'text-navy-900'}`}>{value}</p>
    </div>
  );
}

export function TmtCalculator() {
  const [values, setValues] = useState<Values>(INITIAL_VALUES);
  const [touched, setTouched] = useState(false);

  const checked = useMemo(() => validate(values), [values]);
  const hasErrors = Object.keys(checked.errors).length > 0;
  const result = hasErrors
    ? null
    : calculateTmtEstimate({
        diameterMm: checked.diameter,
        lengthM: checked.length,
        quantity: checked.quantity,
        ratePerKg: checked.rate,
      });

  const update = (field: keyof Values) => (event: ChangeEvent<HTMLInputElement>) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
  };

  const resultKey = `${values.diameter}|${values.length}|${values.quantity}|${values.rate}`;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-navy-900 text-white shadow-card">
          <Calculator className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h3 className="text-lg font-bold text-navy-900">TMT Weight Calculator</h3>
          <p className="text-sm leading-[1.5] text-slate-600">Estimate bar weight from diameter, length and quantity.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="calc-diameter" label="Bar diameter (mm)" required error={touched ? checked.errors.diameter : undefined}>
          <IconInput
            icon={CircleDot}
            id="calc-diameter"
            type="number"
            inputMode="decimal"
            min={MIN_DIAMETER_MM}
            max={MAX_DIAMETER_MM}
            step="any"
            value={values.diameter}
            onChange={update('diameter')}
            onBlur={() => setTouched(true)}
            aria-invalid={touched && !!checked.errors.diameter}
          />
        </Field>
        <Field id="calc-length" label="Length per bar (m)" required error={touched ? checked.errors.length : undefined}>
          <IconInput
            icon={Ruler}
            id="calc-length"
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            value={values.length}
            onChange={update('length')}
            onBlur={() => setTouched(true)}
            aria-invalid={touched && !!checked.errors.length}
          />
        </Field>
        <Field id="calc-quantity" label="Number of bars" required error={touched ? checked.errors.quantity : undefined}>
          <IconInput
            icon={Layers}
            id="calc-quantity"
            type="number"
            inputMode="numeric"
            min="1"
            step="1"
            value={values.quantity}
            onChange={update('quantity')}
            onBlur={() => setTouched(true)}
            aria-invalid={touched && !!checked.errors.quantity}
          />
        </Field>
        <Field id="calc-rate" label="Rate per kg (₹)" error={touched ? checked.errors.rate : undefined}>
          <IconInput
            icon={IndianRupee}
            id="calc-rate"
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            placeholder="Add to see cost"
            value={values.rate}
            onChange={update('rate')}
            onBlur={() => setTouched(true)}
            aria-invalid={touched && !!checked.errors.rate}
          />
        </Field>
      </div>

      <div className="rounded-2xl bg-sky-100 p-5" aria-live="polite">
        {result ? (
          <div key={resultKey} className="result-pop grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ResultTile icon={Ruler} label="Total length" value={`${numberFormat.format(result.totalLengthM)} m`} />
            <ResultTile icon={Scale} label="Estimated weight" value={`${numberFormat.format(result.totalWeightKg)} kg`} accent />
            {result.totalCost !== undefined && (
              <div className="sm:col-span-2">
                <ResultTile icon={Wallet} label="Estimated material cost" value={currencyFormat.format(result.totalCost)} />
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-600">Fix the highlighted fields to see your estimate.</p>
        )}
      </div>

      <p className="flex items-start gap-2 text-xs leading-[1.5] text-slate-500">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Theoretical estimate using weight (kg/m) = diameter² ÷ 162. Actual weight varies within manufacturing tolerances. This
        is not a quote or an engineering certificate.
      </p>
    </div>
  );
}
