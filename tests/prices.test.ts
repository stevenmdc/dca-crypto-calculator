import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { calculateBuyTheDip, calculateDCA, prepareChartData, sampleChartData } from '../lib/dcaCalculator';
import { addDays, DAY_MS, utcDay } from '../lib/price-dates';

test('Chart keeps fractional crypto purchases on their dates and the quantity at the final valuation', () => {
  const startDate = new Date('2025-02-28');
  const endDate = new Date('2025-03-15');
  const prices = [
    { timestamp: startDate.getTime(), price: 102_400 },
    { timestamp: Date.parse('2025-03-01'), price: 51_200 },
    { timestamp: endDate.getTime(), price: 76_800 },
  ];
  const { dates, portfolioValues, investedCapital, cryptoQuantity } = calculateDCA(100, 50, startDate, endDate, prices);

  assert.deepEqual(prepareChartData(dates, portfolioValues, investedCapital, cryptoQuantity), [
    { date: '2025-02-28', portfolioValue: 100, investedCapital: 100, cryptoQuantity: 0.0009765625 },
    { date: '2025-03-01', portfolioValue: 100, investedCapital: 150, cryptoQuantity: 0.001953125 },
    { date: '2025-03-15', portfolioValue: 150, investedCapital: 150, cryptoQuantity: 0.001953125 },
  ]);
});

test('Contributions use weekly intervals, month starts, or annual anniversaries', () => {
  const startDate = new Date('2024-02-29');
  const endDate = new Date('2024-03-14');
  const prices = [
    { timestamp: startDate.getTime(), price: 100 },
    { timestamp: Date.parse('2024-03-01'), price: 200 },
    { timestamp: Date.parse('2024-03-07'), price: 50 },
    { timestamp: endDate.getTime(), price: 100 },
  ];

  const weekly = calculateDCA(100, 50, startDate, endDate, prices, { frequency: 'weekly' });
  assert.equal(weekly.contributionCount, 2);
  assert.deepEqual(weekly.investedCapital, [100, 150, 200]);
  assert.deepEqual(weekly.portfolioValues, [100, 100, 250]);

  const monthly = calculateDCA(100, 50, startDate, endDate, prices, { frequency: 'monthly' });
  assert.equal(monthly.contributionCount, 1);
  assert.deepEqual(monthly.portfolioValues, [100, 250, 125]);

  const yearly = calculateDCA(100, 50, startDate, new Date('2028-02-29'), prices, { frequency: 'yearly' });
  assert.deepEqual(yearly.dates.map((date) => utcDay(date.getTime())), [
    '2024-02-29', '2025-02-28', '2026-02-28', '2027-02-28', '2028-02-29',
  ]);
  assert.equal(yearly.contributionCount, 4);
  assert.equal(yearly.investedCapital.at(-1), 300);
});

test('Chart intervals sample daily valuations and retain the same final result', () => {
  const startDate = new Date('2025-01-28');
  const endDate = new Date('2025-02-05');
  const prices = Array.from({ length: 9 }, (_, index) => ({
    timestamp: startDate.getTime() + index * DAY_MS,
    price: 100 + index,
  }));
  const simulation = calculateDCA(100, 50, startDate, endDate, prices, { dailyValuations: true });
  const { dates, portfolioValues, investedCapital, cryptoQuantity } = simulation;
  const data = prepareChartData(dates, portfolioValues, investedCapital, cryptoQuantity);
  const daily = sampleChartData(data, 'daily');
  const weekly = sampleChartData(data, 'weekly');
  const monthly = sampleChartData(data, 'monthly');

  assert.equal(daily.length, 9);
  assert.equal(daily[1].portfolioValue, 101);
  assert.equal(daily[1].investedCapital, 100);
  assert.equal(daily[4].investedCapital, 150);
  assert.deepEqual(weekly.map(({ date }) => date), ['2025-01-28', '2025-02-02', '2025-02-05']);
  assert.deepEqual(monthly.map(({ date }) => date), ['2025-01-28', '2025-01-31', '2025-02-05']);
  assert.equal(weekly.at(-1), daily.at(-1));
  assert.equal(monthly.at(-1), daily.at(-1));
});

test('Buy the dip buys at the threshold once per dip and values the portfolio daily', () => {
  const startDate = new Date('2025-01-01');
  const prices = [100, 90, 80, 95, 120, 108, 100].map((price, index) => ({
    timestamp: startDate.getTime() + index * DAY_MS,
    price,
  }));
  const endDate = new Date(prices.at(-1)!.timestamp);
  const simulation = calculateBuyTheDip(100, 50, startDate, endDate, prices, 10);
  const finalQuantity = 1 + 50 / 90 + 50 / 108;

  assert.equal(simulation.dates.length, prices.length);
  assert.equal(simulation.contributionCount, 2);
  assert.deepEqual(simulation.investedCapital, [100, 150, 150, 150, 150, 200, 200]);
  assert.equal(simulation.cryptoQuantity.at(-1), finalQuantity);
  assert.equal(simulation.portfolioValues.at(-1), finalQuantity * 100);

  const withoutSignals = calculateBuyTheDip(100, 50, startDate, endDate, prices, 50);
  assert.equal(withoutSignals.contributionCount, 0);
  assert.equal(withoutSignals.investedCapital.at(-1), 100);

  const withoutContributions = calculateBuyTheDip(0, 0, startDate, endDate, prices, 10);
  assert.equal(withoutContributions.contributionCount, 0);
  assert.equal(withoutContributions.portfolioValues.at(-1), 0);
});

test('Buy the dip stops using prices older than 30 days', () => {
  const startDate = new Date('2025-01-01');
  const prices = Array.from({ length: 32 }, (_, index) => ({
    timestamp: startDate.getTime() + index * DAY_MS,
    price: index === 0 ? 100 : index < 30 ? 95 : index === 30 ? 90 : 85,
  }));

  const simulation = calculateBuyTheDip(0, 50, startDate, new Date('2025-02-01'), prices, 10);
  assert.equal(simulation.investedCapital[29], 0);
  assert.equal(simulation.investedCapital[30], 50);
  assert.equal(simulation.contributionCount, 1);

  // Had the first 10% dip waited until day 31, the original high would no longer trigger a purchase.
  prices[30].price = 95;
  prices[31].price = 90;
  const expired = calculateBuyTheDip(0, 50, startDate, new Date('2025-02-01'), prices, 10);
  assert.equal(expired.contributionCount, 0);
});

test('SQLite-backed DCA works without external calls and rejects missing history', async (t) => {
  const directory = await mkdtemp(path.join(tmpdir(), 'dca-prices-'));
  const keys = ['CRYPTO_DB_PATH', 'CRON_SECRET', 'TURSO_DATABASE_URL', 'TURSO_AUTH_TOKEN', 'VERCEL'];
  const previous = keys.map((key) => process.env[key]);
  for (const key of keys) delete process.env[key];
  process.env.CRYPTO_DB_PATH = path.join(directory, 'crypto.db');
  t.after(async () => {
    keys.forEach((key, index) => {
      const value = previous[index];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    });
    await rm(directory, { recursive: true, force: true });
  });
  t.mock.method(globalThis, 'fetch', () => {
    assert.fail('Price queries must not fetch from a provider');
  });
  const { GET } = await import('../app/api/prices/route');
  const { cryptoIds, initializePriceDatabase, openPriceDatabase, savePrices } = await import('../lib/db');
  const request = (from: string, to: string, currency?: string) => {
    const query = new URLSearchParams({ crypto: 'bitcoin', from, to });
    if (currency !== undefined) query.set('currency', currency);
    return GET(new Request(`http://localhost/api/prices?${query}`));
  };

  assert.equal((await request('2025-02-28', '2025-03-01')).status, 503);
  process.env.VERCEL = '1';
  assert.throws(() => openPriceDatabase(true), /TURSO_DATABASE_URL/);
  delete process.env.VERCEL;
  const db = await initializePriceDatabase();
  try {
    const rows = [
      { date: '2025-03-01', priceUsd: 500, priceEur: 200, source: 'coinmetrics-api' },
      { date: '2025-02-28', priceUsd: 125, priceEur: 100, source: 'coinmetrics-api' },
    ] as const;
    assert.equal(await savePrices(db, 'bitcoin', [...rows]), 2);
    assert.equal(await savePrices(db, 'bitcoin', [...rows]), 0);
    const today = utcDay(Date.now());
    for (const crypto of cryptoIds) {
      await savePrices(db, crypto, Array.from({ length: 7 }, (_, index) => ({
        date: addDays(today, -index - 1),
        priceUsd: 110, priceEur: 100, source: 'coinmetrics-api',
      })));
    }
  } finally {
    db.close();
  }

  const response = await request('2025-02-28', '2025-03-01');
  assert.equal(response.status, 200);
  const { prices } = await response.json();
  assert.deepEqual(prices, [
    { timestamp: Date.parse('2025-02-28'), price: 100 },
    { timestamp: Date.parse('2025-03-01'), price: 200 },
  ]);
  assert.equal((await request('2025-02-27', '2025-03-01')).status, 422);
  assert.equal((await request('2025-02-29', '2025-03-01')).status, 400);
  assert.equal((await request('1740700800', '1740787200')).status, 200);

  const simulation = calculateDCA(100, 50, new Date('2025-02-28'), new Date('2025-03-01'), prices);
  assert.deepEqual(simulation.investedCapital, [100, 150]);
  assert.deepEqual(simulation.portfolioValues, [100, 250]);

  const eurResponse = await request('2025-02-28', '2025-03-01', 'EUR');
  assert.equal(eurResponse.status, 200);
  assert.deepEqual((await eurResponse.json()).prices, prices);

  const usdResponse = await request('2025-02-28', '2025-03-01', 'USD');
  assert.equal(usdResponse.status, 200);
  const { prices: usdPrices } = await usdResponse.json();
  assert.deepEqual(usdPrices, [
    { timestamp: Date.parse('2025-02-28'), price: 125 },
    { timestamp: Date.parse('2025-03-01'), price: 500 },
  ]);
  const usdSimulation = calculateDCA(100, 50, new Date('2025-02-28'), new Date('2025-03-01'), usdPrices);
  assert.equal(usdSimulation.portfolioValues.at(-1), 450);
  assert.equal((await request('2025-02-28', '2025-03-01', 'GBP')).status, 400);

  const { GET: runCron } = await import('../app/api/cron/prices/route');
  const authorization = { authorization: 'Bearer test-secret' };
  const cronUrl = 'http://localhost/api/cron/prices';
  assert.equal((await runCron(new Request(cronUrl, { headers: authorization }))).status, 401);
  process.env.CRON_SECRET = 'test-secret';
  assert.equal((await runCron(new Request(cronUrl))).status, 401);
  assert.equal((await runCron(new Request(cronUrl, { headers: authorization }))).status, 200);
});
