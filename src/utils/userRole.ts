import { getStorageItem } from '@/utils/storageUtils';

export type UserRole = 'ADMIN' | 'SUB_ADMIN';

/** Normalize API / storage role strings so routing matches reliably. */
export function normalizeRoleString(role: unknown): UserRole | undefined {
  if (typeof role !== 'string') return undefined;
  const normalized = role
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');
  if (normalized === 'ADMIN') return 'ADMIN';
  if (normalized === 'SUB_ADMIN' || normalized === 'SUBADMIN') return 'SUB_ADMIN';
  return undefined;
}

export function getNormalizedUserRole(): UserRole | undefined {
  try {
    const raw = getStorageItem('user');
    if (!raw) return undefined;
    const user = JSON.parse(raw) as { role?: unknown };
    return normalizeRoleString(user?.role);
  } catch {
    return undefined;
  }
}
