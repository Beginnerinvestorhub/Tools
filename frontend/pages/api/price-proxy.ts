import type { NextApiRequest, NextApiResponse } from 'next';

// Proxy to backend or external API for live stock price
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { symbol } = req.query;
  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid symbol parameter' });
  }
  try {
    // Replace with your backend price endpoint or direct API call
    const apiKey = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY;
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
    const apiRes = await fetch(url);
    const data = await apiRes.json();
    if (!apiRes.ok || !data["Global Quote"] || !data["Global Quote"]["05. price"]) {
      return res.status(500).json({ error: 'Failed to fetch price' });
    }
    return res.status(200).json({ price: parseFloat(data["Global Quote"]["05. price"]) });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
