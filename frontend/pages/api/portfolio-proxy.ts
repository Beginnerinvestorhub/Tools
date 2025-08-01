import type { NextApiRequest, NextApiResponse } from 'next';

// Proxy to backend API for portfolio data
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    // Replace with your backend portfolio endpoint URL
    const backendUrl = process.env.PORTFOLIO_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL + '/api/portfolio' || 'http://localhost:5000/api/portfolio';
    const backendRes = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(req.headers.authorization ? { 'Authorization': req.headers.authorization } : {}),
      },
    });
    const data = await backendRes.json();
    if (!backendRes.ok) {
      return res.status(backendRes.status).json(data);
    }
    return res.status(200).json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
