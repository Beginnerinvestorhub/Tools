-- Personalized Learning Path with AI Behavioral Nudge System
-- Database Schema for Phase 1: Backend & Database Foundation

-- Risk Profile table for user investment risk assessment
CREATE TABLE IF NOT EXISTS risk_profiles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL, -- conservative, moderate, aggressive
    description TEXT NOT NULL,
    min_score INTEGER NOT NULL,
    max_score INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Learning Paths table (master list of available learning paths)
CREATE TABLE IF NOT EXISTS learning_paths (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    difficulty_level VARCHAR(20) NOT NULL, -- beginner, intermediate, advanced
    estimated_duration_hours INTEGER DEFAULT 0,
    target_risk_profile VARCHAR(50), -- can be null for universal paths
    prerequisites JSONB DEFAULT '[]', -- array of required lesson/path IDs
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Learning Content table (individual lessons, articles, videos, etc.)
CREATE TABLE IF NOT EXISTS learning_content (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content_type VARCHAR(50) NOT NULL, -- lesson, article, video, quiz, challenge
    content_url VARCHAR(500), -- URL to content or null for embedded content
    content_body TEXT, -- embedded content or null for external content
    difficulty_level VARCHAR(20) NOT NULL,
    estimated_duration_minutes INTEGER DEFAULT 0,
    points_value INTEGER DEFAULT 0,
    tags JSONB DEFAULT '[]', -- array of topic tags
    prerequisites JSONB DEFAULT '[]', -- array of required content IDs
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Learning Path Content mapping (which content belongs to which paths)
CREATE TABLE IF NOT EXISTS learning_path_content (
    id SERIAL PRIMARY KEY,
    learning_path_id INTEGER NOT NULL,
    learning_content_id INTEGER NOT NULL,
    sequence_order INTEGER NOT NULL,
    is_required BOOLEAN DEFAULT true,
    FOREIGN KEY (learning_path_id) REFERENCES learning_paths(id) ON DELETE CASCADE,
    FOREIGN KEY (learning_content_id) REFERENCES learning_content(id) ON DELETE CASCADE,
    UNIQUE(learning_path_id, learning_content_id)
);

-- Enhanced User Profile for personalized learning
CREATE TABLE IF NOT EXISTS user_learning_profiles (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) UNIQUE NOT NULL, -- Firebase UID
    risk_profile_id INTEGER,
    investment_goals JSONB DEFAULT '[]', -- array of goals: retirement, house, emergency, etc.
    time_horizon VARCHAR(50), -- short_term, medium_term, long_term
    learning_style VARCHAR(50), -- visual, auditory, kinesthetic, reading
    preferred_topics JSONB DEFAULT '[]', -- array of topic preferences
    current_learning_path_id INTEGER,
    completed_lessons JSONB DEFAULT '[]', -- array of completed lesson IDs
    completed_challenges JSONB DEFAULT '[]', -- array of completed challenge IDs
    behavioral_tendencies JSONB DEFAULT '{}', -- AI-analyzed behavioral patterns
    onboarding_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (risk_profile_id) REFERENCES risk_profiles(id),
    FOREIGN KEY (current_learning_path_id) REFERENCES learning_paths(id)
);

-- User Learning Content Progress tracking
CREATE TABLE IF NOT EXISTS user_learning_progress (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    learning_content_id INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'not_started', -- not_started, in_progress, completed, skipped
    progress_percentage INTEGER DEFAULT 0,
    time_spent_minutes INTEGER DEFAULT 0,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    last_accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (learning_content_id) REFERENCES learning_content(id) ON DELETE CASCADE,
    UNIQUE(user_id, learning_content_id)
);

-- AI Behavioral Nudge Log for tracking nudge effectiveness
CREATE TABLE IF NOT EXISTS nudge_logs (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    nudge_type VARCHAR(100) NOT NULL, -- learning_reminder, path_suggestion, challenge_prompt, etc.
    nudge_message TEXT NOT NULL,
    nudge_data JSONB DEFAULT '{}', -- additional nudge context/data
    delivery_method VARCHAR(50) NOT NULL, -- dashboard, email, push_notification, in_app
    delivered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_response VARCHAR(50), -- clicked, dismissed, ignored, completed_action
    response_at TIMESTAMP,
    effectiveness_score DECIMAL(3,2), -- 0.00 to 1.00, calculated by AI
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Behavioral Analytics for AI learning
CREATE TABLE IF NOT EXISTS user_behavioral_analytics (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    session_id VARCHAR(255),
    event_type VARCHAR(100) NOT NULL, -- page_view, lesson_start, lesson_complete, quiz_attempt, etc.
    event_data JSONB DEFAULT '{}',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_duration_seconds INTEGER,
    user_agent TEXT,
    ip_address INET
);

-- Learning Recommendations generated by AI
CREATE TABLE IF NOT EXISTS learning_recommendations (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    recommendation_type VARCHAR(50) NOT NULL, -- next_lesson, skill_gap, review_content, challenge
    recommended_content_id INTEGER,
    recommended_path_id INTEGER,
    confidence_score DECIMAL(3,2) NOT NULL, -- 0.00 to 1.00
    reasoning TEXT, -- AI explanation for the recommendation
    priority_score INTEGER DEFAULT 0, -- higher = more important
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recommended_content_id) REFERENCES learning_content(id),
    FOREIGN KEY (recommended_path_id) REFERENCES learning_paths(id)
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_user_learning_profiles_user_id ON user_learning_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_learning_profiles_risk_profile ON user_learning_profiles(risk_profile_id);
CREATE INDEX IF NOT EXISTS idx_user_learning_profiles_current_path ON user_learning_profiles(current_learning_path_id);

CREATE INDEX IF NOT EXISTS idx_user_learning_progress_user_id ON user_learning_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_learning_progress_content_id ON user_learning_progress(learning_content_id);
CREATE INDEX IF NOT EXISTS idx_user_learning_progress_status ON user_learning_progress(status);
CREATE INDEX IF NOT EXISTS idx_user_learning_progress_completed_at ON user_learning_progress(completed_at);

CREATE INDEX IF NOT EXISTS idx_learning_path_content_path_id ON learning_path_content(learning_path_id);
CREATE INDEX IF NOT EXISTS idx_learning_path_content_sequence ON learning_path_content(learning_path_id, sequence_order);

CREATE INDEX IF NOT EXISTS idx_nudge_logs_user_id ON nudge_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_nudge_logs_delivered_at ON nudge_logs(delivered_at);
CREATE INDEX IF NOT EXISTS idx_nudge_logs_nudge_type ON nudge_logs(nudge_type);
CREATE INDEX IF NOT EXISTS idx_nudge_logs_effectiveness ON nudge_logs(effectiveness_score);

CREATE INDEX IF NOT EXISTS idx_behavioral_analytics_user_id ON user_behavioral_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_behavioral_analytics_event_type ON user_behavioral_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_behavioral_analytics_timestamp ON user_behavioral_analytics(timestamp);
CREATE INDEX IF NOT EXISTS idx_behavioral_analytics_session_id ON user_behavioral_analytics(session_id);

CREATE INDEX IF NOT EXISTS idx_learning_recommendations_user_id ON learning_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_recommendations_active ON learning_recommendations(is_active);
CREATE INDEX IF NOT EXISTS idx_learning_recommendations_priority ON learning_recommendations(priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_learning_recommendations_expires_at ON learning_recommendations(expires_at);

CREATE INDEX IF NOT EXISTS idx_learning_content_difficulty ON learning_content(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_learning_content_type ON learning_content(content_type);
CREATE INDEX IF NOT EXISTS idx_learning_content_active ON learning_content(is_active);
CREATE INDEX IF NOT EXISTS idx_learning_paths_difficulty ON learning_paths(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_learning_paths_active ON learning_paths(is_active);
