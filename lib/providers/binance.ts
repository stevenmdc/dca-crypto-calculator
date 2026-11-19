import { DAY_MS, utcDay } from '@/lib/price-dates';
import { download, positivePrice } from './http';

type Candle = [number, string, string, string, string, string, number];

export async function fetchBinanceCloses(pair: string, start: string, end: string) {
  const endTime = Date.parse(end) + DAY_MS - 1;
  let startTime = Date.parse(start);
  const closes = new Map<string, number>();
  while (startTime <= endTime) {
    const url = new URL('https://data-api.binance.vision/api/v3/klines');
    url.search = new URLSearchParams({
      symbol: pair, interval: '1d', limit: '1000',
      startTime: String(startTime), endTime: String(endTime),
    }).toString();
    const candles = await download(url, (response) => response.json() as Promise<Candle[]>);
    for (const [openTime, , , , close, , closeTime] of candles) {
      const price = positivePrice(close);
      if (price && openTime >= startTime && openTime % DAY_MS === 0
        && closeTime === openTime + DAY_MS - 1 && closeTime <= endTime) {
        closes.set(utcDay(openTime), price);
      }
    }
    if (candles.length < 1000) break;
    const next = candles[candles.length - 1][0] + DAY_MS;
    if (next <= startTime) throw new Error('Binance pagination did not advance');
    startTime = next;
  }
  return closes;
}
