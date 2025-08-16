import type { NextApiRequest, NextApiResponse } from 'next';

// Proxy to backend or external API for live stock price
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  const { symbol } = req.query;
  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid symbol parameter' });
  }

  const apiKey = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY;
  if (!apiKey) {
    console.error('CRITICAL: Alpha Vantage API key (NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY) is not configured.');
    return res.status(503).json({ error: 'Service Unavailable', message: 'The price service is not configured correctly.' });
  }

  try {
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
    const apiRes = await fetch(url);
    const data = await apiRes.json();

    // Handle cases where Alpha Vantage API returns an error or no data
    if (!apiRes.ok || data['Error Message'] || !data['Global Quote'] || Object.keys(data['Global Quote']).length === 0) {
      const errorMessage = data['Error Message'] || `No data returned for symbol: ${symbol}`;
      console.error(`Alpha Vantage API Error for symbol '${symbol}': ${errorMessage}`, { responseStatus: apiRes.status, responseBody: data });

      // If the symbol is invalid, it often returns an empty "Global Quote". A 404 is appropriate.
      if (errorMessage.includes('Invalid API call') || Object.keys(data['Global Quote'] || {}).length === 0) {
        return res.status(404).json({ error: 'Not Found', message: `Price data not found for symbol '${symbol}'.` });
      }

      // For other upstream errors (e.g., rate limiting), return a 502 Bad Gateway.
      return res.status(502).json({ error: 'Bad Gateway', message: 'Failed to retrieve data from the price provider.' });
    }

    const price = data['Global Quote']['05. price'];
    if (!price) {
      console.error(`Price not found in Alpha Vantage response for symbol '${symbol}'`, { responseBody: data });
      return res.status(404).json({ error: 'Not Found', message: `Price data not found for symbol '${symbol}'.` });
    }

    return res.status(200).json({ price: parseFloat(price) });
  } catch (err: any) {
    console.error(`Price proxy internal error for symbol '${symbol}':`, { error: err.message, stack: err.stack });
    return res.status(500).json({ error: 'Internal Server Error', message: 'An unexpected error occurred while fetching the price.' });
  }
}
