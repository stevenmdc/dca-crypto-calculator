import { parse } from 'csv-parse/sync';
import type { StoredPrice } from '@/lib/db';
import { addDays, isUtcDay } from '@/lib/price-dates';
import { download, positivePrice } from './http';

interface Metrics {
  time: string;
  ReferenceRateUSD?: string;
  ReferenceRateEUR?: string;
  PriceUSD?: string;
}

interface MetricsPage {
  data: Metrics[];
  next_page_token?: string;
}

export async function fetchCoinMetricsArchive(symbol: string) {
  const url = new URL(`https://raw.githubusercontent.com/coinmetrics/data/master/csv/${symbol.toLowerCase()}.csv`);
  const csv = await download(url, (response) => response.text());
  return parse<Metrics>(csv, { columns: true, skip_empty_lines: true });
}

export async function fetchCoinMetricsPrices(symbol: string, start: string, end: string) {
  const url = new URL('https://community-api.coinmetrics.io/v4/timeseries/asset-metrics');
  url.search = new URLSearchParams({
    assets: symbol.toLowerCase(),
    metrics: 'ReferenceRateUSD,ReferenceRateEUR',
    frequency: '1d',
    start_time: addDays(start, 1),
    end_time: addDays(end, 1),
    page_size: '1000',
  }).toString();
  const rows: StoredPrice[] = [];
  const seen = new Set<string>();
  let token: string | undefined;
  do {
    if (token) url.searchParams.set('next_page_token', token);
    const page = await download(url, (response) => response.json() as Promise<MetricsPage>);
    for (const metric of page.data) {
      const row = referencePrice(metric, 'coinmetrics-api');
      if (row && row.date >= start && row.date <= end) rows.push(row);
    }
    token = page.next_page_token;
    if (token) {
      if (seen.has(token)) throw new Error('Coin Metrics returned a repeated page token');
      seen.add(token);
    }
  } while (token);
  return rows;
}

export function referencePrice(
  metric: Metrics,
  source: 'coinmetrics-api' | 'coinmetrics-archive',
): StoredPrice | undefined {
  const day = metric.time.slice(0, 10);
  const priceUsd = positivePrice(metric.ReferenceRateUSD);
  const priceEur = positivePrice(metric.ReferenceRateEUR);
  if (isUtcDay(day) && priceUsd && priceEur) {
    // References timestamped at midnight measure the preceding UTC day's close.
    return { date: addDays(day, -1), priceUsd, priceEur, source };
  }
}
