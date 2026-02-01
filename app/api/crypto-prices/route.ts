 const API_KEY = process.env.CRYPTOCOMPARE_API_KEY;
// Use CryptoCompare API for historical data
const CRYPTOCOMPARE_API_BASE = 'https://min-api.cryptocompare.com/data';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const crypto = searchParams.get('crypto');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    // Validation
    if (!crypto || !from || !to) {
      return Response.json(
        { error: 'Missing required parameters: crypto, from, to' },
        { status: 400 }
      );
    }

    if (!['bitcoin', 'ethereum'].includes(crypto)) {
      return Response.json(
        { error: 'Invalid crypto. Must be bitcoin or ethereum' },
        { status: 400 }
      );
    }

    // Calculate days difference for limit
    const startTimestamp = parseInt(from);
    const endTimestamp = parseInt(to);
    const daysDiff = Math.ceil((endTimestamp - startTimestamp) / (60 * 60 * 24));

    // Fetch from CryptoCompare (historical daily data)
    const fsym = crypto === 'bitcoin' ? 'BTC' : 'ETH';
    const url = new URL(`${CRYPTOCOMPARE_API_BASE}/histoday`);
    url.searchParams.append('fsym', fsym);
    url.searchParams.append('tsym', 'EUR');
    url.searchParams.append('limit', daysDiff.toString());
    url.searchParams.append('toTs', endTimestamp.toString());
    if (API_KEY) {
      url.searchParams.append('api_key', API_KEY);
    }

    console.log('Fetching from URL:', url.toString());

    const response = await fetch(url.toString());

    console.log('Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('CryptoCompare error response:', errorText);
      throw new Error(`CryptoCompare API error: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();

    if (data.Response !== 'Success') {
      console.error('CryptoCompare API error:', data.Message);
      throw new Error(`CryptoCompare API error: ${data.Message}`);
    }

    // Transform to our format
    const prices = data.Data.map((point: { time: number; close: number }) => ({
      timestamp: point.time * 1000,
      price: point.close,
    }));

    return Response.json(
      { prices, crypto },
      {
        headers: {
          'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('API error:', errorMessage);

    // Return more detailed error for debugging
    return Response.json(
      {
        error: 'Failed to fetch crypto prices',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
