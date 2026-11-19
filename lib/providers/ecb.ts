import { addDays } from '@/lib/price-dates';
import { download, positivePrice } from './http';

export async function fetchEcbRates() {
  const url = new URL('https://www.ecb.europa.eu/stats/eurofxref/eurofxref-hist.xml');
  const xml = await download(url, (response) => response.text());
  const rates = new Map<string, number>();
  for (const [, date, quotes] of xml.matchAll(/<Cube time="(\d{4}-\d{2}-\d{2})">([\s\S]*?)<\/Cube>/g)) {
    const rate = positivePrice(quotes.match(/<Cube currency="USD" rate="([^"]+)"/)?.[1]);
    if (rate) rates.set(date, rate);
  }
  if (!rates.size) throw new Error('No USD exchange rates in the ECB download');
  return (date: string) => {
    // On weekends and holidays, use the latest already-published reference rate.
    for (let offset = 0; offset <= 7; offset++) {
      const rate = rates.get(addDays(date, -offset));
      if (rate) return rate;
    }
  };
}
