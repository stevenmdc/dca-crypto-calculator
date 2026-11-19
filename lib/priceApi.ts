import type { Currency, PriceData, CryptoType } from '@/types';

export async function fetchHistoricalPrices(
  crypto: CryptoType,
  startDate: Date,
  endDate: Date,
  currency: Currency = 'EUR',
): Promise<PriceData[]> {
  const from = Math.floor(startDate.getTime() / 1000);
  const to = Math.floor(endDate.getTime() / 1000);

  try {
    const response = await fetch(
      `/api/prices?crypto=${crypto}&from=${from}&to=${to}&currency=${currency}`
    );

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error ?? 'Impossible de lire l’historique des prix.');
    }

    const data = await response.json();
    return data.prices || [];
  } catch (error) {
    console.error('Error fetching historical prices:', error);
    throw error;
  }
}
