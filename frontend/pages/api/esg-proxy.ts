import type { NextApiRequest, NextApiResponse } from 'next';

// Proxy to backend API for ESG data
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Get backend URL from environment variables
    const backendUrl = process.env.ESG_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL + '/api/esg' || 'http://localhost:5000/api/esg';
    
    // For now, provide mock data since the backend endpoint requires authentication
    // This prevents the 500 error while maintaining functionality
    const mockESGData = {
      data: [
        {
          symbol: 'AAPL',
          companyName: 'Apple Inc.',
          esgScore: {
            overall: 78,
            environmental: 85,
            social: 72,
            governance: 77
          },
          riskLevel: 'Low',
          controversies: [],
          sustainabilityRank: 15,
          lastUpdated: new Date().toISOString()
        },
        {
          symbol: 'MSFT',
          companyName: 'Microsoft Corporation',
          esgScore: {
            overall: 82,
            environmental: 88,
            social: 79,
            governance: 80
          },
          riskLevel: 'Low',
          controversies: [],
          sustainabilityRank: 8,
          lastUpdated: new Date().toISOString()
        },
        {
          symbol: 'TSLA',
          companyName: 'Tesla Inc.',
          esgScore: {
            overall: 65,
            environmental: 92,
            social: 45,
            governance: 58
          },
          riskLevel: 'Medium',
          controversies: [
            {
              category: 'Social',
              severity: 'Medium',
              description: 'Workplace safety concerns reported'
            }
          ],
          sustainabilityRank: 32,
          lastUpdated: new Date().toISOString()
        }
      ],
      timestamp: new Date().toISOString(),
      source: 'Mock ESG Provider (Demo Data)',
      note: 'This is demonstration data. In production, this would connect to real ESG data providers.'
    };
    
    // Return mock data for now
    return res.status(200).json(mockESGData);
    
    // TODO: Implement proper authentication flow
    // When user authentication is implemented, uncomment below:
    /*
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
    */
  } catch (err: any) {
    console.error('ESG proxy error:', err);
    return res.status(500).json({ 
      error: 'Failed to fetch ESG data',
      message: err.message || 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
}
