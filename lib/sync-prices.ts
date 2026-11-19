import { assets, cryptoIds, initializePriceDatabase, openPriceDatabase, readCoverage, savePrices } from '@/lib/db';
import type { PriceDatabase, StoredPrice } from '@/lib/db';
import { addDays, isUtcDay, utcDay } from '@/lib/price-dates';
import { fetchBinanceCloses } from '@/lib/providers/binance';
import { fetchCoinMetricsArchive, fetchCoinMetricsPrices, referencePrice } from '@/lib/providers/coinmetrics';
import { fetchEcbRates } from '@/lib/providers/ecb';
import { positivePrice } from '@/lib/providers/http';

function findMissing(start: string, end: string, dates: Set<string>) {
  const missing = [];
  for (let day = start; day <= end; day = addDays(day, 1)) {
    if (!dates.has(day)) missing.push(day);
  }
  return missing;
}

export async function syncPrices(backfill: boolean, allowBootstrap = true) {
  const db = allowBootstrap ? await initializePriceDatabase() : openPriceDatabase(true, 'write');
  if (!db) throw new Error('Import the price history before enabling scheduled updates');
  const end = addDays(utcDay(Date.now()), -1);
  let hadErrors = false;
  let rates: ReturnType<typeof fetchEcbRates> | undefined;
  const rateLookup = () => rates ??= fetchEcbRates();
  try {
    const history = await readCoverage(db);
    if (!allowBootstrap && cryptoIds.some((crypto) => !history[crypto])) {
      throw new Error('Import the four price histories before enabling scheduled updates');
    }
    for (const crypto of cryptoIds) {
      const { symbol, since } = assets[crypto];
      const existing = history[crypto];
      // Retry recent gaps left by a delayed provider, without downloading dates already present.
      const recentStart = existing ? addDays(existing.lastDate, -6) : since;
      const start = backfill || recentStart < since ? since : recentStart;
      const dateQuery = {
        sql: 'SELECT date FROM historical_prices WHERE crypto_id = ? AND date BETWEEN ? AND ?',
        args: [crypto, start, end],
      };
      const stored = new Set((await db.execute(dateQuery)).rows.map(({ date }) => String(date)));
      const missingBeforeSync = findMissing(start, end, stored);
      if (!backfill && missingBeforeSync.length === 0) {
        log(`${symbol} already current through ${end}`);
        continue;
      }
      const prices = new Map<string, StoredPrice>();
      const collect = (row: StoredPrice) => {
        if (row.date >= start && row.date <= end) prices.set(row.date, row);
      };

      try {
        for (const row of await fetchCoinMetricsPrices(symbol, missingBeforeSync[0] ?? start, end)) {
          if (backfill || !stored.has(row.date)) collect(row);
        }
      } catch (error) {
        log(`${symbol} Coin Metrics API: ${error}`);
      }

      if (backfill || !existing) {
        try {
          for (const metric of await fetchCoinMetricsArchive(symbol)) {
            const reference = referencePrice(metric, 'coinmetrics-archive');
            if (reference && !prices.has(reference.date)) collect(reference);

            const date = metric.time;
            const priceUsd = positivePrice(metric.PriceUSD);
            if (!priceUsd || !isUtcDay(date) || date < start || date > end || prices.has(date)) continue;
            const rate = (await rateLookup())(date);
            if (rate) collect({ date, priceUsd, priceEur: priceUsd / rate, source: 'coinmetrics-archive+ecb' });
          }
        } catch (error) {
          hadErrors = true;
          log(`${symbol} Coin Metrics archive / ECB: ${error}`);
        }
      }

      const missingAfterPrimary = findMissing(start, end, new Set([...stored, ...prices.keys()]));
      if (missingAfterPrimary.length > 0) {
        const first = missingAfterPrimary[0];
        const last = missingAfterPrimary[missingAfterPrimary.length - 1];
        try {
          const closes = await fetchBinanceCloses(`${symbol}EUR`, first, last);
          if (closes.size > 0) {
            const usdPerEur = await rateLookup();
            for (const date of missingAfterPrimary) {
              const priceEur = closes.get(date);
              const rate = usdPerEur(date);
              if (priceEur && rate) collect({ date, priceUsd: priceEur * rate, priceEur, source: 'binance-eur+ecb' });
            }
          }
        } catch (error) {
          hadErrors = true;
          log(`${symbol} Binance EUR / ECB: ${error}`);
        }
        if (crypto === 'solana') {
          const missingSol = missingAfterPrimary.filter((date) => !prices.has(date));
          try {
            for (const row of await fillSolanaWithBtc(db, missingSol)) collect(row);
          } catch (error) {
            hadErrors = true;
            log(`SOL Binance BTC: ${error}`);
          }
        }
      }

      const changed = await savePrices(db, crypto, [...prices.values()]);
      const coverage = (await readCoverage(db, crypto))[crypto];
      if (!coverage) {
        log(`${symbol} no prices available`);
        hadErrors = true;
        continue;
      }
      const dates = new Set((await db.execute(dateQuery)).rows.map(({ date }) => String(date)));
      const effectiveStart = coverage.firstDate > start ? coverage.firstDate : start;
      const missing = findMissing(effectiveStart, end, dates);
      log(`${symbol} ${changed} inserted or upgraded, ${coverage.firstDate} to ${coverage.lastDate}, ${missing.length} missing days in checked period`);
      if (missing.length > 0) log(`${symbol} missing: ${missing.slice(0, 12).join(', ')}${missing.length > 12 ? ', …' : ''}`);
      if (coverage.lastDate < end || (!backfill && missing.length > 0)) hadErrors = true;
      const { rows: outliers } = await db.execute({
        sql: `
          SELECT current.date FROM historical_prices AS current
          JOIN historical_prices AS previous ON previous.crypto_id = current.crypto_id
            AND previous.date = date(current.date, '-1 day')
          WHERE current.crypto_id = ? AND current.date BETWEEN ? AND ?
            AND (current.price_usd > previous.price_usd * 5 OR current.price_usd * 5 < previous.price_usd)
          ORDER BY current.date
        `,
        args: [crypto, start, end],
      });
      if (outliers.length) log(`${symbol} daily changes above 5× to review: ${outliers.map(({ date }) => date).join(', ')}`);
    }
  } finally {
    db.close();
  }
  return !hadErrors;
}

async function fillSolanaWithBtc(db: PriceDatabase, missing: string[]): Promise<StoredPrice[]> {
  if (missing.length === 0) return [];
  const first = missing[0];
  const last = missing[missing.length - 1];
  const closes = await fetchBinanceCloses('SOLBTC', first, last);
  const { rows: quotes } = await db.execute({
    sql: `
      SELECT date, price_usd AS priceUsd, price_eur AS priceEur
      FROM historical_prices WHERE crypto_id = 'bitcoin' AND date BETWEEN ? AND ?
    `,
    args: [first, last],
  });
  const btcByDay = new Map(quotes.map((quote) => [quote.date, quote]));
  const rows: StoredPrice[] = [];
  for (const date of missing) {
    const close = closes.get(date);
    const btc = btcByDay.get(date);
    if (close && btc) rows.push({
      date, priceUsd: close * Number(btc.priceUsd), priceEur: close * Number(btc.priceEur), source: 'binance-btc',
    });
  }
  return rows;
}

function log(message: string) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

