import { UserRole, EXPORT_LIMITS } from '../types';

export const getTodayKey = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `export_usage_${year}-${month}-${day}`;
};

export const getTodayExportUsed = (userRole: UserRole): number => {
  const key = getTodayKey();
  const val = localStorage.getItem(key);
  if (!val) return 0;
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? 0 : parsed;
};

export const addTodayExportUsed = (userRole: UserRole, count: number): void => {
  const key = getTodayKey();
  const current = getTodayExportUsed(userRole);
  localStorage.setItem(key, (current + count).toString());
};

export const resetTodayExportUsed = (): void => {
  localStorage.removeItem(getTodayKey());
};

export const getExportQuota = (
  userRole: UserRole,
  totalItems: number
) => {
  const dailyLimit = EXPORT_LIMITS[userRole] ?? 0;
  const usedToday = getTodayExportUsed(userRole);
  const remainingToday = Math.max(0, dailyLimit - usedToday);
  const maxExportable = Math.min(remainingToday, totalItems);

  return {
    dailyLimit,
    usedToday,
    remainingToday,
    maxExportable,
  };
};
