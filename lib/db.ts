import { createClient } from '@libsql/client/web';
import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import type { CryptoType, PriceCoverage } from '@/types';

export const assets = {
  bitcoin: { symbol: 'BTC', name: 'Bitcoin', since: '2010-01-01' },
  ethereum: { symbol: 'ETH', name: 'Ethereum', since: '2015-01-01' },
  xrp: { symbol: 'XRP', name: 'XRP', since: '2013-01-01' },
  solana: { symbol: 'SOL', name: 'Solana', since: '2020-01-01' },
} satisfies Record<CryptoType, { symbol: string; name: string; since: string }>;

export const cryptoIds = Object.keys(assets) as CryptoType[];
export function localDatabasePath() {
  return path.resolve(process.env.CRYPTO_DB_PATH || 'data/crypto.db');
}

export interface StoredPrice {
  date: string;
  priceUsd: number;
  priceEur: number;
  source: 'coinmetrics-api' | 'coinmetrics-archive' | 'coinmetrics-archive+ecb'
    | 'binance-eur+ecb' | 'binance-btc';
}

type SqlValue = string | number | null;
type Statement = string | { sql: string; args: SqlValue[] };

export interface PriceDatabase {
  execute(statement: Statement): Promise<{ rows: Record<string, unknown>[]; rowsAffected: number }>;
  batch(statements: Statement[], mode: 'write'): Promise<{ rowsAffected: number }[]>;
  close(): void;
}

export function openPriceDatabase(existingOnly: false): PriceDatabase;
export function openPriceDatabase(existingOnly: true, access?: 'write'): PriceDatabase | null;
export function openPriceDatabase(existingOnly: boolean, access?: 'write'): PriceDatabase | null {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (url || authToken || process.env.VERCEL === '1') {
    if (!url || !authToken) throw new Error('TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are required');
    if (!/^(libsql|https):\/\//.test(url)) throw new Error('Expected a TLS-enabled Turso URL');
    return createClient({ url, authToken });
  }
  const file = localDatabasePath();
  if (existingOnly && !existsSync(file)) return null;
  if (!existingOnly) mkdirSync(path.dirname(file), { recursive: true });
  const local = new Database(file, { readonly: existingOnly && access !== 'write', fileMustExist: existingOnly });
  local.pragma('foreign_keys = ON');
  const execute = (statement: Statement) => {
    const sql = typeof statement === 'string' ? statement : statement.sql;
    const args = typeof statement === 'string' ? [] : statement.args;
    const prepared = local.prepare<SqlValue[], Record<string, unknown>>(sql);
    return prepared.reader
      ? { rows: prepared.all(...args), rowsAffected: 0 }
      : { rows: [], rowsAffected: prepared.run(...args).changes };
  };
  return {
    async execute(statement: Statement) { return execute(statement); },
    async batch(statements: Statement[]) {
      return local.transaction(() => statements.map(execute)).immediate();
    },
    close: () => local.close(),
  };
}

export async function initializePriceDatabase() {
  const db = openPriceDatabase(false);
  try {
    if (!process.env.TURSO_DATABASE_URL) await db.execute('PRAGMA journal_mode = WAL');
    await db.batch([
      `
      CREATE TABLE IF NOT EXISTS cryptocurrencies (
        id TEXT PRIMARY KEY,
        symbol TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL
      ) STRICT
      `,
      `
      CREATE TABLE IF NOT EXISTS historical_prices (
        crypto_id TEXT NOT NULL REFERENCES cryptocurrencies(id),
        date TEXT NOT NULL,
        price_usd REAL NOT NULL CHECK (price_usd > 0),
        price_eur REAL NOT NULL CHECK (price_eur > 0),
        source TEXT NOT NULL,
        PRIMARY KEY (crypto_id, date)
      ) STRICT, WITHOUT ROWID
      `,
      `
      CREATE TABLE IF NOT EXISTS price_sync (
        crypto_id TEXT PRIMARY KEY REFERENCES cryptocurrencies(id),
        synced_at TEXT NOT NULL
      ) STRICT
      `,
      ...cryptoIds.map((id) => ({
        sql: 'INSERT OR IGNORE INTO cryptocurrencies VALUES (?, ?, ?)',
        args: [id, assets[id].symbol, assets[id].name],
      })),
    ], 'write');
    return db;
  } catch (error) {
    db.close();
    throw error;
  }
}

export async function readCoverage(db: PriceDatabase, crypto?: CryptoType) {
  const { rows } = await db.execute({
    sql: `
      SELECT c.id,
        (SELECT date FROM historical_prices WHERE crypto_id = c.id ORDER BY date ASC LIMIT 1) AS firstDate,
        (SELECT date FROM historical_prices WHERE crypto_id = c.id ORDER BY date DESC LIMIT 1) AS lastDate,
        s.synced_at AS syncedAt
      FROM cryptocurrencies AS c
      LEFT JOIN price_sync AS s ON s.crypto_id = c.id
      WHERE ? IS NULL OR c.id = ?
    `,
    args: [crypto ?? null, crypto ?? null],
  });
  const history: Partial<Record<CryptoType, PriceCoverage>> = {};
  for (const { id, firstDate, lastDate, syncedAt } of rows) {
    if (typeof firstDate === 'string' && typeof lastDate === 'string') {
      history[id as CryptoType] = { firstDate, lastDate, syncedAt: syncedAt as string | null };
    }
  }
  return history;
}

export async function savePrices(db: PriceDatabase, crypto: CryptoType, rows: StoredPrice[]) {
  if (rows.length === 0) return 0;
  const statements = [];
  for (let offset = 0; offset < rows.length; offset += 150) {
    const chunk = rows.slice(offset, offset + 150);
    statements.push({
      sql: `
        INSERT INTO historical_prices (crypto_id, date, price_usd, price_eur, source)
        VALUES ${chunk.map(() => '(?, ?, ?, ?, ?)').join(', ')}
        ON CONFLICT (crypto_id, date) DO UPDATE SET
          price_usd = excluded.price_usd, price_eur = excluded.price_eur, source = excluded.source
        WHERE excluded.source LIKE 'coinmetrics%' AND historical_prices.source LIKE 'binance%'
      `,
      args: chunk.flatMap((row) => [crypto, row.date, row.priceUsd, row.priceEur, row.source]),
    }, {
      sql: `
        INSERT INTO price_sync SELECT ?, ? WHERE changes() > 0
        ON CONFLICT (crypto_id) DO UPDATE SET synced_at = MAX(price_sync.synced_at, excluded.synced_at)
      `,
      args: [crypto, new Date().toISOString()],
    });
  }
  const results = await db.batch(statements, 'write');
  return results.reduce((changes, result, index) => index % 2 === 0 ? changes + result.rowsAffected : changes, 0);
}
