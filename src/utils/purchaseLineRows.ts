import type { PurchaseSummaryLineRow } from '@/types/purchase';

function looksLikeLine(o: Record<string, unknown>): boolean {
  return (
    'rate' in o ||
    'quantity' in o ||
    'total' in o ||
    'total_price' in o ||
    ('name' in o && ('productId' in o || '_id' in o))
  );
}

function mapRaw(raw: unknown, index: number): PurchaseSummaryLineRow {
  const r = raw as Record<string, unknown>;
  const rate = Number(r.rate) || 0;
  const quantity = Number(r.quantity) || 0;
  const totalRaw = r.total ?? r.total_price;
  const totalNum = Number(totalRaw);
  const total = Number.isFinite(totalNum) ? Math.ceil(totalNum) : Math.ceil(rate * quantity);
  const idRaw = r.id ?? r.productId ?? r._id;
  return {
    id: typeof idRaw === 'string' ? idRaw : undefined,
    _id: typeof r._id === 'string' ? r._id : undefined,
    name: typeof r.name === 'string' && r.name.trim() ? r.name.trim() : `Item ${index + 1}`,
    rate,
    quantity,
    total,
  };
}

/**
 * Coerce API `lineRows` / `item_details` into rows for the summary table.
 * (Backend may send an array, a single line object, or a keyed map.)
 */
export function normalizeSummaryLineRows(input: unknown): PurchaseSummaryLineRow[] {
  if (input == null) return [];
  if (Array.isArray(input)) {
    return input.filter((x) => x != null && typeof x === 'object').map((x, i) => mapRaw(x, i));
  }
  if (typeof input === 'object' && !Array.isArray(input)) {
    const o = input as Record<string, unknown>;
    if (looksLikeLine(o)) return [mapRaw(o, 0)];
    const vals = Object.values(o);
    if (vals.every((x) => x != null && typeof x === 'object' && !Array.isArray(x))) {
      return vals.map((x, i) => mapRaw(x, i));
    }
  }
  return [];
}
