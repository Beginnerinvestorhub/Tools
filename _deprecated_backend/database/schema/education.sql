-- Education tables for Investor Bootcamp

-- Master lessons table (optional future use)
CREATE TABLE IF NOT EXISTS lessons (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL,
    module_id VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    points INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User progress per lesson
CREATE TABLE IF NOT EXISTS user_lessons (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    lesson_slug VARCHAR(100) NOT NULL,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, lesson_slug)
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_user_lessons_user_id ON user_lessons(user_id);
