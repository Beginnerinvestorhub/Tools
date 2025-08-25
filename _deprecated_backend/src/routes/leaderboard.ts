import { Router } from 'express';
import prisma from '../services/databaseService';
import { requireAuth } from '../utils/requireAuth';

export const leaderboardRouter = Router();

/**
 * GET /api/gamification/leaderboard
 * Get leaderboard data, sorted by points.
 * Supports `limit` and `timeframe` query parameters.
 */
leaderboardRouter.get('/', async (req, res) => {
  try {
    const { timeframe = 'all_time', limit = 50 } = req.query;
    const take = Math.min(Number(limit), 100); // Cap limit at 100 for performance

    // TODO: Implement more robust time-based filtering.
    // This currently uses `lastUpdated` as a simple filter. A better approach
    // would be to track points earned within specific periods.
    let whereClause = {};
    if (timeframe === 'week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      whereClause = { lastUpdated: { gte: oneWeekAgo } };
    }

    const leaderboardEntries = await prisma.leaderboardEntry.findMany({
      where: whereClause,
      orderBy: {
        points: 'desc',
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true, // Fallback display name
          },
        },
      },
      take,
    });

    const leaderboard = leaderboardEntries.map((entry, index) => ({
      rank: index + 1,
      userId: entry.userId,
      displayName: entry.user ? `${entry.user.firstName || ''} ${entry.user.lastName || ''}`.trim() || entry.user.email : 'Anonymous',
      points: entry.points,
      // Example of a dynamic level calculation based on points
      level: Math.floor(Math.sqrt(entry.points / 10)) + 1,
      lastUpdated: entry.lastUpdated,
    }));

    res.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard data' });
  }
});

/**
 * GET /api/gamification/leaderboard/position/:userId
 * Get a specific user's rank and points from the leaderboard.
 */
leaderboardRouter.get('/position/:userId', requireAuth(), async (req, res) => {
  try {
    const { userId } = req.params;

    // Use a raw query with a window function for efficient ranking.
    // This avoids fetching the entire table into memory.
    const result: Array<{ rank: BigInt; points: number }> = await prisma.$queryRaw`
      SELECT rank, points
      FROM (
        SELECT "userId", points, RANK() OVER (ORDER BY points DESC) as rank
        FROM "LeaderboardEntry"
      ) as ranked_users
      WHERE "userId" = ${userId}
    `;

    if (result.length === 0) {
      // User is not on the leaderboard yet
      return res.json({ rank: null, points: 0, level: 1 });
    }

    const userPosition = result[0];
    res.json({
      rank: Number(userPosition.rank),
      points: userPosition.points,
      level: Math.floor(Math.sqrt(userPosition.points / 10)) + 1, // Consistent level calculation
    });
  } catch (error) {
    console.error('Error fetching user position:', error);
    res.status(500).json({ error: 'Failed to fetch user leaderboard position' });
  }
});
