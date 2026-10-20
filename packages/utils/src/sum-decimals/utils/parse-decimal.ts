export interface ScaledDecimal {
  /** The value multiplied by `10 ** scale`, so it is always a whole number. */
  readonly units: bigint;
  readonly scale: number;
}

// Matches plain and exponent notation, e.g. `-1.5`, `.25`, `3.`, `1e-7`, `+2.5E3`.
const DECIMAL_PATTERN = /^([+-]?)(\d*)(?:\.(\d*))?(?:e([+-]?\d+))?$/i;

/**
 * Parse a number or numeric string into an exact scaled integer, avoiding the
 * binary floating point error that plain `number` arithmetic introduces.
 */
export default function parseDecimal(value: number | string): ScaledDecimal {
  const text = typeof value === 'number' ? String(value) : value.trim();
  const match = DECIMAL_PATTERN.exec(text);
  const integer = match?.[2] ?? '';
  const fraction = match?.[3] ?? '';
  if (match === null || integer + fraction === '') {
    throw new RangeError(`Invalid decimal: ${String(value)}`);
  }

  const sign = match[1] === '-' ? -1n : 1n;
  const digits = BigInt(integer + fraction) * sign;
  const scale = fraction.length - Number(match[4] ?? 0);
  // A negative scale (e.g. `1e21`) means trailing zeros; fold them into the units.
  return scale < 0 ? { units: digits * 10n ** BigInt(-scale), scale: 0 } : { units: digits, scale };
}
