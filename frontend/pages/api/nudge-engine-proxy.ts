import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Get the backend API URL from environment variables
  const backendApiUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;
  
  if (!backendApiUrl) {
    console.error('CRITICAL: Backend API URL is not configured (NEXT_PUBLIC_BACKEND_API_URL).');
    return res.status(503).json({ 
      error: 'Service Unavailable', 
      message: 'The backend API service is not configured correctly.' 
    });
  }

  try {
    // Forward the request to the backend nudge engine endpoint
    const backendRes = await fetch(`${backendApiUrl}/api/nudge-engine/behavioral-nudges`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        // The backend will handle authentication via the user's session
      },
      body: JSON.stringify(req.body),
    });

    const data = await backendRes.json();
    
    if (!backendRes.ok) {
      console.error('Nudge engine backend service returned an error:', { 
        status: backendRes.status, 
        body: data 
      });
      return res.status(backendRes.status).json(data);
    }
    
    return res.status(200).json(data);
  } catch (err: any) {
    console.error('Nudge engine proxy internal error:', { 
      error: err.message, 
      stack: err.stack 
    });
    return res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'An unexpected error occurred while processing your request.' 
    });
  }
}
