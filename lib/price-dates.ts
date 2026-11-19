export const DAY_MS = 86_400_000;

export function utcDay(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}

export function addDays(day: string, count: number): string {
  return utcDay(Date.parse(day) + count * DAY_MS);
}

export function isUtcDay(day: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(day)
    && Number.isFinite(Date.parse(day)) && utcDay(Date.parse(day)) === day;
}
