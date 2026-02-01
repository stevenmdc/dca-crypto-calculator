import { PriceData, CryptoType } from '@/types';

// Use Pro API URL if API key is available, otherwise use free API
const API_KEY = process.env.NEXT_PUBLIC_COINGECKO_API_KEY || process.env.COINGECKO_API_KEY;
const COINGECKO_API_BASE = API_KEY
  ? 'https://pro-api.coingecko.com/api/v3'
  : 'https://api.coingecko.com/api/v3';

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

export async function fetchCoinGeckoData(
  crypto: CryptoType,
  from: number,
  to: number
): Promise<PriceData[]> {
  const cryptoId = crypto === 'bitcoin' ? 'bitcoin' : 'ethereum';

  const url = new URL(`${COINGECKO_API_BASE}/coins/${cryptoId}/market_chart/range`);
  url.searchParams.append('vs_currency', 'eur');
  url.searchParams.append('from', from.toString());
  url.searchParams.append('to', to.toString());

  // Add API key if available (for Pro API)
  if (API_KEY) {
    url.searchParams.append('x_cg_pro_api_key', API_KEY);
  }

  try {
    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Transform CoinGecko data to our format
    return data.prices.map((price: [number, number]) => ({
      timestamp: price[0],
      price: price[1],
    }));
  } catch (error) {
    console.error('Error fetching from CoinGecko:', error);
    throw error;
  }
}
