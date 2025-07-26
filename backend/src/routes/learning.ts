import { Router, Request } from 'express';
import { pool } from '../config/database';
import { requireAuth } from '../utils/requireAuth';
import rateLimit from 'express-rate-limit';

// Extend Express Request type to include user
interface AuthRequest extends Request {
  user?: any;
}

export const learningRouter = Router();

// Rate limiter: maximum 200 requests per 15 minutes for learning endpoints
const learningRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Higher limit for learning activities
});

// POST /api/learning/onboarding-profile - Create/update user learning profile
learningRouter.post('/onboarding-profile', learningRateLimiter, requireAuth(['user', 'admin', 'paiduser']), async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.uid;
    const {
      riskProfileScore,
      investmentGoals,
      timeHorizon,
      learningStyle,
      preferredTopics
    } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Validate required fields
    if (typeof riskProfileScore !== 'number' || !investmentGoals || !timeHorizon || !learningStyle) {
      return res.status(400).json({ error: 'Missing required onboarding data' });
    }

    const client = await pool.connect();

    try {
      // Determine risk profile based on score
      const riskProfileResult = await client.query(
        'SELECT id FROM risk_profiles WHERE $1 BETWEEN min_score AND max_score',
        [riskProfileScore]
      );

      if (riskProfileResult.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid risk profile score' });
      }

      const riskProfileId = riskProfileResult.rows[0].id;

      // Find appropriate learning path based on risk profile
      const learningPathResult = await client.query(
        'SELECT id FROM learning_paths WHERE target_risk_profile = (SELECT name FROM risk_profiles WHERE id = $1) AND is_active = true ORDER BY id LIMIT 1',
        [riskProfileId]
      );

      let currentLearningPathId = null;
      if (learningPathResult.rows.length > 0) {
        currentLearningPathId = learningPathResult.rows[0].id;
      } else {
        // Fallback to general fundamentals path
        const fallbackResult = await client.query(
          'SELECT id FROM learning_paths WHERE target_risk_profile IS NULL AND is_active = true ORDER BY id LIMIT 1'
        );
        if (fallbackResult.rows.length > 0) {
          currentLearningPathId = fallbackResult.rows[0].id;
        }
      }

      // Insert or update user learning profile
      await client.query(`
        INSERT INTO user_learning_profiles 
        (user_id, risk_profile_id, investment_goals, time_horizon, learning_style, preferred_topics, current_learning_path_id, onboarding_completed, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, true, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id) 
        DO UPDATE SET 
          risk_profile_id = $2,
          investment_goals = $3,
          time_horizon = $4,
          learning_style = $5,
          preferred_topics = $6,
          current_learning_path_id = $7,
          onboarding_completed = true,
          updated_at = CURRENT_TIMESTAMP
      `, [userId, riskProfileId, JSON.stringify(investmentGoals), timeHorizon, learningStyle, JSON.stringify(preferredTopics || []), currentLearningPathId]);

      // Log behavioral analytics
      await client.query(`
        INSERT INTO user_behavioral_analytics (user_id, event_type, event_data)
        VALUES ($1, 'onboarding_completed', $2)
      `, [userId, JSON.stringify({ riskProfileScore, timeHorizon, learningStyle })]);

      client.release();
      res.json({ 
        success: true, 
        message: 'Learning profile created successfully',
        currentLearningPathId 
      });

    } catch (error) {
      client.release();
      throw error;
    }

  } catch (error) {
    console.error('Error creating learning profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/learning/personalized-path - Get user's personalized learning path
learningRouter.get('/personalized-path', learningRateLimiter, requireAuth(['user', 'admin', 'paiduser']), async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const client = await pool.connect();

    try {
      // Get user's learning profile and current path
      const profileResult = await client.query(`
        SELECT 
          ulp.*,
          lp.name as path_name,
          lp.description as path_description,
          lp.estimated_duration_hours,
          rp.name as risk_profile_name
        FROM user_learning_profiles ulp
        LEFT JOIN learning_paths lp ON ulp.current_learning_path_id = lp.id
        LEFT JOIN risk_profiles rp ON ulp.risk_profile_id = rp.id
        WHERE ulp.user_id = $1
      `, [userId]);

      if (profileResult.rows.length === 0) {
        return res.status(404).json({ error: 'User learning profile not found. Please complete onboarding first.' });
      }

      const profile = profileResult.rows[0];

      // Get learning content for current path with progress
      const contentResult = await client.query(`
        SELECT 
          lc.*,
          lpc.sequence_order,
          lpc.is_required,
          COALESCE(ulp.status, 'not_started') as progress_status,
          COALESCE(ulp.progress_percentage, 0) as progress_percentage,
          ulp.completed_at
        FROM learning_path_content lpc
        JOIN learning_content lc ON lpc.learning_content_id = lc.id
        LEFT JOIN user_learning_progress ulp ON lc.id = ulp.learning_content_id AND ulp.user_id = $1
        WHERE lpc.learning_path_id = $2 AND lc.is_active = true
        ORDER BY lpc.sequence_order
      `, [userId, profile.current_learning_path_id]);

      // Get next recommended content
      const nextContent = contentResult.rows.find(content => 
        content.progress_status === 'not_started' || content.progress_status === 'in_progress'
      );

      // Calculate overall progress
      const completedContent = contentResult.rows.filter(content => content.progress_status === 'completed').length;
      const totalContent = contentResult.rows.length;
      const overallProgress = totalContent > 0 ? Math.round((completedContent / totalContent) * 100) : 0;

      client.release();

      res.json({
        profile: {
          riskProfile: profile.risk_profile_name,
          investmentGoals: profile.investment_goals,
          timeHorizon: profile.time_horizon,
          learningStyle: profile.learning_style,
          preferredTopics: profile.preferred_topics
        },
        currentPath: {
          id: profile.current_learning_path_id,
          name: profile.path_name,
          description: profile.path_description,
          estimatedDurationHours: profile.estimated_duration_hours,
          overallProgress
        },
        content: contentResult.rows,
        nextRecommended: nextContent || null,
        stats: {
          completedLessons: completedContent,
          totalLessons: totalContent,
          progressPercentage: overallProgress
        }
      });

    } catch (error) {
      client.release();
      throw error;
    }

  } catch (error) {
    console.error('Error fetching personalized path:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/learning/lesson-completed - Mark lesson as completed
learningRouter.post('/lesson-completed', learningRateLimiter, requireAuth(['user', 'admin', 'paiduser']), async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.uid;
    const { contentId, timeSpentMinutes } = req.body;

    if (!userId || !contentId) {
      return res.status(400).json({ error: 'Missing userId or contentId' });
    }

    const client = await pool.connect();

    try {
      // Get content details
      const contentResult = await client.query(
        'SELECT * FROM learning_content WHERE id = $1 AND is_active = true',
        [contentId]
      );

      if (contentResult.rows.length === 0) {
        return res.status(404).json({ error: 'Learning content not found' });
      }

      const content = contentResult.rows[0];

      // Update or insert progress
      await client.query(`
        INSERT INTO user_learning_progress 
        (user_id, learning_content_id, status, progress_percentage, time_spent_minutes, started_at, completed_at, last_accessed_at)
        VALUES ($1, $2, 'completed', 100, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id, learning_content_id)
        DO UPDATE SET 
          status = 'completed',
          progress_percentage = 100,
          time_spent_minutes = user_learning_progress.time_spent_minutes + $3,
          completed_at = CURRENT_TIMESTAMP,
          last_accessed_at = CURRENT_TIMESTAMP
      `, [userId, contentId, timeSpentMinutes || 0]);

      // Update user's completed lessons array
      await client.query(`
        UPDATE user_learning_profiles 
        SET completed_lessons = COALESCE(completed_lessons, '[]'::jsonb) || $2::jsonb,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1 AND NOT (completed_lessons @> $2::jsonb)
      `, [userId, JSON.stringify([contentId])]);

      // Award points via gamification system (if exists)
      await client.query(`
        INSERT INTO user_progress (user_id, total_points, experience_points, updated_at) 
        VALUES ($1, $2, $2, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id) 
        DO UPDATE SET 
          total_points = user_progress.total_points + $2,
          experience_points = user_progress.experience_points + $2,
          updated_at = CURRENT_TIMESTAMP
      `, [userId, content.points_value || 0]);

      // Log behavioral analytics
      await client.query(`
        INSERT INTO user_behavioral_analytics (user_id, event_type, event_data)
        VALUES ($1, 'lesson_completed', $2)
      `, [userId, JSON.stringify({ 
        contentId, 
        contentType: content.content_type, 
        timeSpentMinutes: timeSpentMinutes || 0,
        pointsAwarded: content.points_value || 0
      })]);

      client.release();
      res.json({ 
        success: true, 
        message: 'Lesson completed successfully',
        pointsAwarded: content.points_value || 0
      });

    } catch (error) {
      client.release();
      throw error;
    }

  } catch (error) {
    console.error('Error completing lesson:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/learning/challenge-completed - Mark challenge as completed
learningRouter.post('/challenge-completed', learningRateLimiter, requireAuth(['user', 'admin', 'paiduser']), async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.uid;
    const { contentId, score, timeSpentMinutes } = req.body;

    if (!userId || !contentId) {
      return res.status(400).json({ error: 'Missing userId or contentId' });
    }

    const client = await pool.connect();

    try {
      // Get content details
      const contentResult = await client.query(
        'SELECT * FROM learning_content WHERE id = $1 AND content_type = \'challenge\' AND is_active = true',
        [contentId]
      );

      if (contentResult.rows.length === 0) {
        return res.status(404).json({ error: 'Challenge not found' });
      }

      const content = contentResult.rows[0];

      // Update or insert progress
      await client.query(`
        INSERT INTO user_learning_progress 
        (user_id, learning_content_id, status, progress_percentage, time_spent_minutes, started_at, completed_at, last_accessed_at)
        VALUES ($1, $2, 'completed', 100, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id, learning_content_id)
        DO UPDATE SET 
          status = 'completed',
          progress_percentage = 100,
          time_spent_minutes = user_learning_progress.time_spent_minutes + $3,
          completed_at = CURRENT_TIMESTAMP,
          last_accessed_at = CURRENT_TIMESTAMP
      `, [userId, contentId, timeSpentMinutes || 0]);

      // Update user's completed challenges array
      await client.query(`
        UPDATE user_learning_profiles 
        SET completed_challenges = COALESCE(completed_challenges, '[]'::jsonb) || $2::jsonb,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1 AND NOT (completed_challenges @> $2::jsonb)
      `, [userId, JSON.stringify([contentId])]);

      // Award points (bonus for high scores)
      const basePoints = content.points_value || 0;
      const bonusPoints = score && score >= 80 ? Math.round(basePoints * 0.2) : 0;
      const totalPoints = basePoints + bonusPoints;

      await client.query(`
        INSERT INTO user_progress (user_id, total_points, experience_points, updated_at) 
        VALUES ($1, $2, $2, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id) 
        DO UPDATE SET 
          total_points = user_progress.total_points + $2,
          experience_points = user_progress.experience_points + $2,
          updated_at = CURRENT_TIMESTAMP
      `, [userId, totalPoints]);

      // Log behavioral analytics
      await client.query(`
        INSERT INTO user_behavioral_analytics (user_id, event_type, event_data)
        VALUES ($1, 'challenge_completed', $2)
      `, [userId, JSON.stringify({ 
        contentId, 
        score: score || null,
        timeSpentMinutes: timeSpentMinutes || 0,
        pointsAwarded: totalPoints
      })]);

      client.release();
      res.json({ 
        success: true, 
        message: 'Challenge completed successfully',
        pointsAwarded: totalPoints,
        bonusPoints
      });

    } catch (error) {
      client.release();
      throw error;
    }

  } catch (error) {
    console.error('Error completing challenge:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/learning/recommendations - Get AI-generated learning recommendations
learningRouter.get('/recommendations', learningRateLimiter, requireAuth(['user', 'admin', 'paiduser']), async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const client = await pool.connect();

    try {
      // Get active recommendations for user
      const recommendationsResult = await client.query(`
        SELECT 
          lr.*,
          lc.title as content_title,
          lc.content_type,
          lc.difficulty_level,
          lc.estimated_duration_minutes,
          lp.name as path_name
        FROM learning_recommendations lr
        LEFT JOIN learning_content lc ON lr.recommended_content_id = lc.id
        LEFT JOIN learning_paths lp ON lr.recommended_path_id = lp.id
        WHERE lr.user_id = $1 
          AND lr.is_active = true 
          AND (lr.expires_at IS NULL OR lr.expires_at > CURRENT_TIMESTAMP)
        ORDER BY lr.priority_score DESC, lr.confidence_score DESC
        LIMIT 10
      `, [userId]);

      client.release();
      res.json(recommendationsResult.rows);

    } catch (error) {
      client.release();
      throw error;
    }

  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/learning/nudge-feedback - Log user response to AI nudges
learningRouter.post('/nudge-feedback', learningRateLimiter, requireAuth(['user', 'admin', 'paiduser']), async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.uid;
    const { nudgeId, response } = req.body;

    if (!userId || !nudgeId || !response) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const client = await pool.connect();

    try {
      // Update nudge log with user response
      await client.query(`
        UPDATE nudge_logs 
        SET user_response = $1, response_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND user_id = $3
      `, [response, nudgeId, userId]);

      // Log behavioral analytics
      await client.query(`
        INSERT INTO user_behavioral_analytics (user_id, event_type, event_data)
        VALUES ($1, 'nudge_response', $2)
      `, [userId, JSON.stringify({ nudgeId, response })]);

      client.release();
      res.json({ success: true, message: 'Nudge feedback recorded' });

    } catch (error) {
      client.release();
      throw error;
    }

  } catch (error) {
    console.error('Error recording nudge feedback:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
