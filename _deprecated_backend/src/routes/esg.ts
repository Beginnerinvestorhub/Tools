/**
 * ESG (Environmental, Social, Governance) Routes
 * Provides ESG data and screening functionality
 */

import { authenticateToken } from '../middleware/auth';
import { rateLimit } from 'express-rate-limit';

const router = Router();

// Rate limiting for ESG endpoints
const esgRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs
  message: { error: 'Too many ESG requests, please try again later.' }
});

// Apply rate limiting to all ESG routes
router.use(esgRateLimit);

/**
 * GET /api/esg
 * Get ESG data for companies
 */
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { symbol, symbols } = req.query;
    
    // Mock ESG data for now - replace with actual ESG data service
    const mockESGData = {
      data: symbol ? 
        generateMockESGData(symbol as string) : 
        (symbols as string)?.split(',').map(s => generateMockESGData(s.trim())) || [],
      timestamp: new Date().toISOString(),
      source: 'Mock ESG Provider'
    };

    res.json(mockESGData);
  } catch (error) {
    console.error('ESG data fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch ESG data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/esg/screen
 * Screen investments based on ESG criteria
 */
router.get('/screen', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { 
      minEnvironmentalScore = 0,
      minSocialScore = 0,
      minGovernanceScore = 0,
      excludeIndustries = '',
    } = req.query;

    // Mock screening results
    const screeningResults = {
      criteria: {
        minEnvironmentalScore: Number(minEnvironmentalScore),
        minSocialScore: Number(minSocialScore),
        minGovernanceScore: Number(minGovernanceScore),
        excludedIndustries: excludeIndustries ? (excludeIndustries as string).split(',') : []
      },
      results: generateMockScreeningResults(),
      totalScreened: 500,
      passed: 127,
      failed: 373,
      timestamp: new Date().toISOString()
    };

    res.json(screeningResults);
  } catch (error) {
    console.error('ESG screening error:', error);
    res.status(500).json({ 
      error: 'Failed to perform ESG screening',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/esg/industries
 * Get list of industries for ESG filtering
 */
router.get('/industries', authenticateToken, async (req: Request, res: Response) => {
  try {
    const industries = [
      { id: 'tobacco', name: 'Tobacco', category: 'controversial' },
      { id: 'weapons', name: 'Weapons & Defense', category: 'controversial' },
      { id: 'gambling', name: 'Gambling', category: 'controversial' },
      { id: 'fossil-fuels', name: 'Fossil Fuels', category: 'environmental' },
      { id: 'mining', name: 'Mining', category: 'environmental' },
      { id: 'alcohol', name: 'Alcohol', category: 'social' },
      { id: 'adult-entertainment', name: 'Adult Entertainment', category: 'social' }
    ];

    res.json({ industries });
  } catch (error) {
    console.error('ESG industries fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch ESG industries',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Helper function to generate mock ESG data
function generateMockESGData(symbol: string) {
  const baseScore = Math.random() * 40 + 30; // 30-70 base range
  
  return {
    symbol: symbol.toUpperCase(),
    companyName: `${symbol.toUpperCase()} Corporation`,
    esgScore: {
      overall: Math.round(baseScore + Math.random() * 20),
      environmental: Math.round(baseScore + Math.random() * 30),
      social: Math.round(baseScore + Math.random() * 25),
      governance: Math.round(baseScore + Math.random() * 20)
    },
    riskLevel: baseScore > 60 ? 'Low' : baseScore > 40 ? 'Medium' : 'High',
    controversies: Math.random() > 0.7 ? [
      {
        category: 'Environmental',
        severity: 'Medium',
        description: 'Environmental compliance issues reported'
      }
    ] : [],
    sustainabilityRank: Math.floor(Math.random() * 100) + 1,
    lastUpdated: new Date().toISOString()
  };
}

// Helper function to generate mock screening results
function generateMockScreeningResults() {
  const symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX'];
  
  return symbols.map(symbol => ({
    ...generateMockESGData(symbol),
    passed: Math.random() > 0.3,
    reasons: Math.random() > 0.5 ? ['Low governance score'] : []
  }));
}

export default router;
