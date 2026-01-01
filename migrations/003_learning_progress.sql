-- Timeline Game Database Schema
-- Migration 003: Learning Mode Progress (Spaced Repetition)

-- User event progress table (SM-2 algorithm data)
CREATE TABLE IF NOT EXISTS user_event_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    category_key VARCHAR(50) NOT NULL,
    event_name VARCHAR(255) NOT NULL,

    -- SM-2 algorithm fields
    ease_factor DECIMAL(4, 2) DEFAULT 2.5,
    interval_days INTEGER DEFAULT 1,
    repetitions INTEGER DEFAULT 0,

    -- Scheduling
    next_review TIMESTAMP,
    last_review TIMESTAMP,

    -- Last attempt details
    last_quality INTEGER, -- 0-5 SM-2 quality rating
    last_year_error INTEGER,
    last_distance_km DECIMAL(10, 2),

    -- Stats
    total_attempts INTEGER DEFAULT 0,
    successful_attempts INTEGER DEFAULT 0, -- quality >= 3

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(user_id, category_key, event_name)
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_event_progress_user ON user_event_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_event_progress_next_review ON user_event_progress(user_id, next_review);
CREATE INDEX IF NOT EXISTS idx_user_event_progress_category ON user_event_progress(user_id, category_key);

-- View for learning stats per category
CREATE OR REPLACE VIEW user_learning_stats AS
SELECT
    user_id,
    category_key,
    COUNT(*) as total_events_seen,
    COUNT(*) FILTER (WHERE repetitions >= 3 AND ease_factor >= 2.5) as mastered_count,
    COUNT(*) FILTER (WHERE repetitions > 0 AND (repetitions < 3 OR ease_factor < 2.5)) as learning_count,
    COUNT(*) FILTER (WHERE next_review <= NOW()) as due_count,
    COUNT(*) FILTER (WHERE repetitions = 0) as new_count
FROM user_event_progress
GROUP BY user_id, category_key;
