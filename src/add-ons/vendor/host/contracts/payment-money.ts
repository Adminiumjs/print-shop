/*
 * VENDORED from add-ons/packages/host/src/contracts/payment-money.ts — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the monorepo and re-run `sync-add-ons.sh sync`.
 * The shared contract the add-ons the works mounts are written against.
 */
/**
 * COPIED VERBATIM from `@adminium/add-on-contracts` (`src/payment-money.ts`).
 *
 * Decimal text ↔ a provider's smallest unit, exactly.
 *
 * Money never passes through a float here. A provider half converts with its
 * OWN exponent table (Stripe treats MGA as zero-decimal; PayPal sends HUF, JPY
 * and TWD with no decimals), so these helpers take the exponent as an argument
 * and the table is the provider's. An amount with more non-zero decimals than
 * the exponent allows is refused (null), never rounded: rounding a customer's
 * amount is taking a different amount.
 */

/** "120.50" at exponent 2 → "12050". "12000.00" at 0 → "12000". "45.2505" at 3 → null. */
export function decimalToMinor(amount: string, exponent: number): string | null {
  if (!Number.isInteger(exponent) || exponent < 0 || exponent > 6) return null;
  const match = /^(\d+)(?:\.(\d+))?$/.exec(amount);
  if (match === null) return null;
  const whole = match[1] ?? '0';
  const fraction = match[2] ?? '';
  const kept = fraction.slice(0, exponent);
  const rest = fraction.slice(exponent);
  if (/[1-9]/.test(rest)) return null;
  const digits = `${whole}${kept.padEnd(exponent, '0')}`.replace(/^0+(?=\d)/, '');
  return digits === '' ? '0' : digits;
}

/** "12050" at exponent 2 → "120.50". "12000" at 0 → "12000". */
export function minorToDecimal(minor: string, exponent: number): string | null {
  if (!Number.isInteger(exponent) || exponent < 0 || exponent > 6) return null;
  if (!/^\d+$/.test(minor)) return null;
  const digits = minor.replace(/^0+(?=\d)/, '');
  if (exponent === 0) return digits;
  const padded = digits.padStart(exponent + 1, '0');
  return `${padded.slice(0, -exponent)}.${padded.slice(-exponent)}`;
}

/** True when two decimal texts are the same number ("120" and "120.00"). */
export function sameAmount(a: string, b: string): boolean {
  const norm = (text: string): string | null => {
    const match = /^(\d+)(?:\.(\d+))?$/.exec(text);
    if (match === null) return null;
    const whole = (match[1] ?? '0').replace(/^0+(?=\d)/, '');
    const fraction = (match[2] ?? '').replace(/0+$/, '');
    return fraction === '' ? whole : `${whole}.${fraction}`;
  };
  const left = norm(a);
  return left !== null && left === norm(b);
}

/** Compares two decimal texts: -1, 0 or 1. Null when either is not a decimal. */
export function compareAmounts(a: string, b: string): -1 | 0 | 1 | null {
  const scale = 6;
  const left = decimalToMinor(a, scale);
  const right = decimalToMinor(b, scale);
  if (left === null || right === null) return null;
  const x = BigInt(left);
  const y = BigInt(right);
  return x < y ? -1 : x > y ? 1 : 0;
}

/** a + b as decimal text at `exponent` places. Null when either cannot be held there. */
export function addAmounts(a: string, b: string, exponent: number): string | null {
  const left = decimalToMinor(a, exponent);
  const right = decimalToMinor(b, exponent);
  if (left === null || right === null) return null;
  return minorToDecimal((BigInt(left) + BigInt(right)).toString(), exponent);
}

/** a − b as decimal text at `exponent` places. Null when either cannot be held there or b > a. */
export function subtractAmounts(a: string, b: string, exponent: number): string | null {
  const left = decimalToMinor(a, exponent);
  const right = decimalToMinor(b, exponent);
  if (left === null || right === null) return null;
  const result = BigInt(left) - BigInt(right);
  return result < 0n ? null : minorToDecimal(result.toString(), exponent);
}

const ZERO_DECIMAL = new Set([
  'BIF', 'CLP', 'DJF', 'GNF', 'ISK', 'JPY', 'KMF', 'KRW', 'PYG', 'RWF', 'UGX', 'UYI', 'VND', 'VUV', 'XAF', 'XOF', 'XPF',
]);
const THREE_DECIMAL = new Set(['BHD', 'IQD', 'JOD', 'KWD', 'LYD', 'OMR', 'TND']);

/**
 * ISO 4217's minor units. The demo provider's table, and a starting point a
 * real provider OVERRIDES with its own exceptions; never the engine's
 * authority on what a provider takes.
 */
export function isoExponent(currency: string): number | null {
  if (!/^[A-Z]{3}$/.test(currency)) return null;
  if (ZERO_DECIMAL.has(currency)) return 0;
  if (THREE_DECIMAL.has(currency)) return 3;
  return 2;
}
