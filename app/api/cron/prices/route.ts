import { syncPrices } from '@/lib/sync-prices';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (await syncPrices(false, false)) return Response.json({ ok: true });
  } catch (error) {
    console.error('Scheduled price sync failed', error);
  }
  return Response.json({ error: 'Price sync incomplete' }, { status: 503 });
}
