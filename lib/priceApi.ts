import { PriceData, CryptoType } from '@/types';

export async function fetchHistoricalPrices(
  crypto: CryptoType,
  startDate: Date,
  endDate: Date
): Promise<PriceData[]> {
  const from = Math.floor(startDate.getTime() / 1000);
  const to = Math.floor(endDate.getTime() / 1000);

  const cryptoId = crypto === 'bitcoin' ? 'bitcoin' : 'ethereum';

  try {
    const response = await fetch(
      `/api/crypto-prices?crypto=${cryptoId}&from=${from}&to=${to}`
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.prices || [];
  } catch (error) {
    console.error('Error fetching historical prices:', error);
    throw error;
  }
}
