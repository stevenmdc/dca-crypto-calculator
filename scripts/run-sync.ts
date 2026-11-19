import { syncPrices } from '@/lib/sync-prices';

export async function runSync(backfill: boolean) {
  try {
    if (!await syncPrices(backfill)) process.exitCode = 1;
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}
