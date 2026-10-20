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
  const base = binary ? 1024 : 1000;
  const units = binary ? IEC_UNITS : SI_UNITS;
  const magnitude = Math.floor(Math.log(Math.abs(bytes)) / Math.log(base));
  // log(0) is -Infinity; sub-byte and zero values stay in plain bytes.
  const exponent = Number.isFinite(magnitude) ? clamp(magnitude, 0, units.length - 1) : 0;
  const value = Number((bytes / base ** exponent).toFixed(decimals));
  return `${value} ${units[exponent]}`;
}
