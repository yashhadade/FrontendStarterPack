const indianNumberFormatter = new Intl.NumberFormat("en-IN");

export function formatIndianNumber(value: unknown, fallback = "-"): string {
  if (value == null) return fallback;

  if (typeof value === "number") {
    if (!Number.isFinite(value)) return fallback;
    return indianNumberFormatter.format(value);
  }

  if (typeof value === "bigint") {
    // BigInt supports toLocaleString in modern runtimes.
    return value.toLocaleString("en-IN");
  }

  if (typeof value === "string") {
    const s = value.trim();
    if (!s) return fallback;

    // Prefer BigInt for large integer token counts.
    if (/^\d+$/.test(s)) {
      try {
        return BigInt(s).toLocaleString("en-IN");
      } catch {
        // Fall through to Number parsing.
      }
    }

    const n = Number(s);
    if (Number.isFinite(n)) return indianNumberFormatter.format(n);
    return fallback;
  }

  return fallback;
}

