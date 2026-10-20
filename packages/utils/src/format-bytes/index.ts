import clamp from '../clamp/index.ts';

export interface FormatBytesOptions {
  /** Maximum fraction digits; trailing zeros are dropped. Defaults to 1. */
  readonly decimals?: number;
  /** Use 1024-based IEC units (KiB, MiB, ...) instead of 1000-based SI units. */
  readonly binary?: boolean;
}

const SI_UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'] as const;
const IEC_UNITS = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB'] as const;

/** Format a byte count for humans, e.g. `formatBytes(1536) === '1.5 KB'`. */
export default function formatBytes(
  bytes: number,
  { decimals = 1, binary = false }: FormatBytesOptions = {},
): string {
  if (!Number.isFinite(bytes)) {
    throw new RangeError(`bytes must be a finite number, got ${bytes}`);
  }

  const base = binary ? 1024 : 1000;
  const units = binary ? IEC_UNITS : SI_UNITS;
  const lastExponent = units.length - 1;
  const round = (exponent: number): number => Number((bytes / base ** exponent).toFixed(decimals));

  const magnitude = Math.floor(Math.log(Math.abs(bytes)) / Math.log(base));
  // log(0) is -Infinity; sub-byte and zero values stay in plain bytes.
  let exponent = Number.isFinite(magnitude) ? clamp(magnitude, 0, lastExponent) : 0;
  let value = round(exponent);
  // Rounding can carry into the next unit (999_950 -> 1000 KB), so step up once.
  if (Math.abs(value) >= base && exponent < lastExponent) {
    exponent += 1;
    value = round(exponent);
  }
  return `${value} ${units[exponent]}`;
}
