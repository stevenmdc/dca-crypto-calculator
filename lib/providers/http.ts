import { setTimeout as delay } from 'node:timers/promises';

export async function download<T>(url: URL, decode: (response: Response) => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    let wait = 1000 * 2 ** attempt;
    try {
      const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(25_000) });
      if (response.ok) return await decode(response);
      await response.body?.cancel();
      if (attempt === 2 || (response.status < 500 && response.status !== 429)) {
        throw new Error(`${url.hostname} HTTP ${response.status}`);
      }
      const retryAfter = Number(response.headers.get('retry-after'));
      if (Number.isFinite(retryAfter)) wait = Math.max(wait, Math.min(retryAfter * 1000, 60_000));
    } catch (error) {
      if (!(error instanceof TypeError || (error instanceof Error && error.name === 'TimeoutError'))
        || attempt === 2) throw error;
    }
    await delay(wait);
  }
}

export function positivePrice(value: unknown): number | undefined {
  const price = typeof value === 'string' || typeof value === 'number' ? Number(value) : NaN;
  return Number.isFinite(price) && price > 0 ? price : undefined;
}
