/** Render scaled integer units as a plain decimal string, e.g. `(-5n, 2) -> '-0.05'`. */
export default function formatUnits(units: bigint, scale: number): string {
  const sign = units < 0n ? '-' : '';
  const digits = (units < 0n ? -units : units).toString().padStart(scale + 1, '0');
  if (scale === 0) {
    return sign + digits;
  }
  return `${sign}${digits.slice(0, -scale)}.${digits.slice(-scale)}`;
}
