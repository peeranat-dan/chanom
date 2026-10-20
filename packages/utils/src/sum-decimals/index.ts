import formatUnits from './utils/format-units.ts';
import parseDecimal from './utils/parse-decimal.ts';
import roundToScale from './utils/round-to-scale.ts';

/**
 * Sum decimals without floating point drift (`sumDecimals([0.1, 0.2]) === 0.3`).
 * Values may be numbers or numeric strings. When `precision` is given, the exact
 * total is rounded half away from zero to that many decimal places.
 */
export default function sumDecimals(
  values: readonly (number | string)[],
  precision?: number,
): number {
  if (precision !== undefined && (!Number.isInteger(precision) || precision < 0)) {
    throw new RangeError(`precision must be a non-negative integer, got ${precision}`);
  }

  const decimals = values.map((value) => parseDecimal(value));
  // reduce rather than Math.max(...spread), which overflows the stack on huge inputs.
  const scale = decimals.reduce((max, decimal) => Math.max(max, decimal.scale), 0);
  const total = decimals.reduce(
    (sum, decimal) => sum + roundToScale(decimal.units, decimal.scale, scale),
    0n,
  );

  if (precision === undefined) {
    return Number(formatUnits(total, scale));
  }
  return Number(formatUnits(roundToScale(total, scale, precision), precision));
}
