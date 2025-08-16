import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const backendUrl = process.env.RISK_ENGINE_URL || (process.env.NEXT_PUBLIC_PYTHON_ENGINE_URL ? `${process.env.NEXT_PUBLIC_PYTHON_ENGINE_URL}/assess-risk` : null);

  if (!backendUrl) {
    console.error('CRITICAL: Risk Engine URL is not configured (RISK_ENGINE_URL or NEXT_PUBLIC_PYTHON_ENGINE_URL).');
    return res.status(503).json({ error: 'Service Unavailable', message: 'The risk assessment service is not configured correctly.' });
  }

  try {
    const backendRes = await fetch(backendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });

    const data = await backendRes.json();
    if (!backendRes.ok) {
      console.error('Risk assessment backend service returned an error:', { status: backendRes.status, body: data });
      return res.status(backendRes.status).json(data);
    }
    return res.status(200).json(data);
  } catch (err: any) {
    console.error('Risk assessment proxy internal error:', { error: err.message, stack: err.stack });
    return res.status(500).json({ error: 'Internal Server Error', message: 'An unexpected error occurred while submitting the assessment.' });
  }
}
