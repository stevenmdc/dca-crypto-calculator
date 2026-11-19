import { cryptoIds, openPriceDatabase } from '@/lib/db';
import { DAY_MS, isUtcDay, utcDay } from '@/lib/price-dates';
import type { CryptoType } from '@/types';

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams;
  const crypto = query.get('crypto') as CryptoType | null;
  const currency = query.get('currency') ?? 'EUR';
  const from = parseDate(query.get('from'));
  const to = parseDate(query.get('to'));
  if (!crypto || !cryptoIds.includes(crypto) || !from || !to || from > to) {
    return Response.json({ error: 'Crypto ou période invalide.' }, { status: 400 });
  }
  if (currency !== 'EUR' && currency !== 'USD') {
    return Response.json({ error: 'Devise invalide.' }, { status: 400 });
  }

  try {
    const db = openPriceDatabase(true);
    if (!db) {
      return Response.json({ error: 'L’historique des prix n’a pas encore été importé.' }, { status: 503 });
    }
    try {
      const { rows } = await db.execute({
        sql: `
          SELECT date, CASE WHEN ? = 'USD' THEN price_usd ELSE price_eur END AS price
          FROM historical_prices
          WHERE crypto_id = ? AND date BETWEEN ? AND ? ORDER BY date
        `,
        args: [currency, crypto, from, to],
      });
      const expectedCount = (Date.parse(to) - Date.parse(from)) / DAY_MS + 1;
      if (rows.length !== expectedCount) {
        return Response.json({
          error: 'L’historique est incomplet sur cette période. Choisis des dates couvertes par la base.',
        }, { status: 422 });
      }
      return Response.json({
        crypto,
        prices: rows.map(({ date, price }) => ({ timestamp: Date.parse(String(date)), price: Number(price) })),
      });
    } finally {
      db.close();
    }
  } catch (error) {
    console.error('Price lookup failed', error);
    return Response.json({ error: 'La base des prix est momentanément indisponible.' }, { status: 503 });
  }
}

function parseDate(value: string | null) {
  if (!value) return;
  if (isUtcDay(value)) return value;
  // Preserve Unix-second inputs supported by the original endpoint.
  if (/^\d{1,10}$/.test(value)) return utcDay(Number(value) * 1000);
}
