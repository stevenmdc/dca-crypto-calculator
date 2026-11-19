import { DcaSimulator } from '@/components/DcaSimulator';
import { openPriceDatabase, readCoverage } from '@/lib/db';
import type { CryptoType, PriceCoverage } from '@/types';

export const dynamic = 'force-dynamic';

export default async function Home() {
  let history: Partial<Record<CryptoType, PriceCoverage>> = {};
  try {
    const db = openPriceDatabase(true);
    if (db) {
      try {
        history = await readCoverage(db);
      } finally {
        db.close();
      }
    }
  } catch (error) {
    console.error('Price coverage lookup failed', error);
  }
  return <DcaSimulator history={history} />;
}
