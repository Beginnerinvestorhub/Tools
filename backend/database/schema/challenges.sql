-- Challenges and leaderboard tables

-- User challenges completion tracking
CREATE TABLE IF NOT EXISTS user_challenges (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    challenge_id VARCHAR(100) NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, challenge_id)
);

-- Gamification events for tracking user activities
CREATE TABLE IF NOT EXISTS gamification_events (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB DEFAULT '{}',
    points_awarded INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_challenges_user_id ON user_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_challenges_completed ON user_challenges(completed);
CREATE INDEX IF NOT EXISTS idx_gamification_events_user_id ON gamification_events(user_id);
CREATE INDEX IF NOT EXISTS idx_gamification_events_type ON gamification_events(event_type);
CREATE INDEX IF NOT EXISTS idx_gamification_events_created_at ON gamification_events(created_at);
