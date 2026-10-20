/**
 * Move `units` from `fromScale` to `toScale` decimal places. Scaling up is exact;
 * scaling down rounds half away from zero (`0.125 -> 0.13`, `-0.125 -> -0.13`).
 */
export default function roundToScale(units: bigint, fromScale: number, toScale: number): bigint {
  if (toScale >= fromScale) {
    return units * 10n ** BigInt(toScale - fromScale);
  }

  const divisor = 10n ** BigInt(fromScale - toScale);
  // BigInt division truncates toward zero, so only the remainder decides rounding.
  const quotient = units / divisor;
  const remainder = units % divisor;
  const absRemainder = remainder < 0n ? -remainder : remainder;
  if (absRemainder * 2n < divisor) {
    return quotient;
  }
  return units < 0n ? quotient - 1n : quotient + 1n;
}
