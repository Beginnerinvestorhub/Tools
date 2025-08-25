import { Router } from 'express';
import { pool } from '../config/database';

export const educationRouter = Router();

// Get user's completed lessons
educationRouter.get('/user/:userId/lessons', async (req, res) => {
  try {
    const { userId } = req.params;
    const client = await pool.connect();
    
    const result = await client.query(
      'SELECT lesson_slug, completed_at FROM user_lessons WHERE user_id = $1',
      [userId]
    );
    
    client.release();
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching user lessons:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark lesson as complete
educationRouter.post('/complete', async (req, res) => {
  try {
    const { userId, lessonSlug } = req.body;
    
    if (!userId || !lessonSlug) {
      return res.status(400).json({ error: 'Missing userId or lessonSlug' });
    }

    const client = await pool.connect();
    
    // Insert lesson completion (ignore if already exists)
    await client.query(
      'INSERT INTO user_lessons (user_id, lesson_slug) VALUES ($1, $2) ON CONFLICT (user_id, lesson_slug) DO NOTHING',
      [userId, lessonSlug]
    );

    // Award points via gamification system
    await client.query(
      'INSERT INTO user_progress (user_id, points, xp) VALUES ($1, 50, 50) ON CONFLICT (user_id) DO UPDATE SET points = user_progress.points + 50, xp = user_progress.xp + 50',
      [userId]
    );

    // Check for lesson completion badge
    const lessonCount = await client.query(
      'SELECT COUNT(*) FROM user_lessons WHERE user_id = $1',
      [userId]
    );

    if (parseInt(lessonCount.rows[0].count) === 1) {
      // First lesson badge
      await client.query(
        'INSERT INTO user_badges (user_id, badge_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [userId, 'first_lesson']
      );
    }

    client.release();
    
    res.json({ 
      success: true, 
      pointsAwarded: 50,
      message: 'Lesson completed successfully!' 
    });
  } catch (error) {
    console.error('Error completing lesson:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
