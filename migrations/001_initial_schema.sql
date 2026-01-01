-- Timeline Game Database Schema
-- Migration 001: Initial Schema

-- Users table (OAuth + Guest support)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    oauth_provider VARCHAR(20),
    oauth_id VARCHAR(255),
    username VARCHAR(50) NOT NULL,
    display_name VARCHAR(100),
    avatar_url TEXT,
    email VARCHAR(255),
    elo_rating INTEGER DEFAULT 1000,
    games_played INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_guest BOOLEAN DEFAULT FALSE,

    UNIQUE(oauth_provider, oauth_id)
);

-- Index for OAuth lookups
CREATE INDEX IF NOT EXISTS idx_users_oauth ON users(oauth_provider, oauth_id);
CREATE INDEX IF NOT EXISTS idx_users_elo ON users(elo_rating);

-- Games table (match records)
CREATE TABLE IF NOT EXISTS games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_key VARCHAR(50) NOT NULL,
    player1_id UUID REFERENCES users(id),
    player2_id UUID REFERENCES users(id),
    player1_score INTEGER NOT NULL,
    player2_score INTEGER NOT NULL,
    winner_id UUID REFERENCES users(id),
    player1_elo_before INTEGER,
    player2_elo_before INTEGER,
    player1_elo_after INTEGER,
    player2_elo_after INTEGER,
    rounds_played INTEGER DEFAULT 10,
    is_ranked BOOLEAN DEFAULT TRUE,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Index for user game history
CREATE INDEX IF NOT EXISTS idx_games_player1 ON games(player1_id);
CREATE INDEX IF NOT EXISTS idx_games_player2 ON games(player2_id);
CREATE INDEX IF NOT EXISTS idx_games_completed ON games(completed_at);

-- Round details table (per-round stats)
CREATE TABLE IF NOT EXISTS game_rounds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    event_name VARCHAR(255) NOT NULL,
    event_lat DECIMAL(10, 7) NOT NULL,
    event_lng DECIMAL(10, 7) NOT NULL,
    event_year INTEGER NOT NULL,

    -- Player 1 stats
    player1_guess_lat DECIMAL(10, 7),
    player1_guess_lng DECIMAL(10, 7),
    player1_guess_year INTEGER,
    player1_distance_km DECIMAL(10, 2),
    player1_year_error INTEGER,
    player1_time_left INTEGER,
    player1_score INTEGER,

    -- Player 2 stats
    player2_guess_lat DECIMAL(10, 7),
    player2_guess_lng DECIMAL(10, 7),
    player2_guess_year INTEGER,
    player2_distance_km DECIMAL(10, 2),
    player2_year_error INTEGER,
    player2_time_left INTEGER,
    player2_score INTEGER,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_game_rounds_game ON game_rounds(game_id);

-- User stats (aggregated, updated after each game)
CREATE TABLE IF NOT EXISTS user_stats (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    total_games INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    draws INTEGER DEFAULT 0,
    total_score BIGINT DEFAULT 0,
    total_distance_error DECIMAL(15, 2) DEFAULT 0,
    total_year_error BIGINT DEFAULT 0,
    total_rounds INTEGER DEFAULT 0,
    best_round_score INTEGER DEFAULT 0,
    best_game_score INTEGER DEFAULT 0,
    current_win_streak INTEGER DEFAULT 0,
    best_win_streak INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table for refresh tokens
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_hash VARCHAR(64) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- View for computed stats
CREATE OR REPLACE VIEW user_computed_stats AS
SELECT
    u.id,
    u.username,
    u.display_name,
    u.avatar_url,
    u.elo_rating,
    u.is_guest,
    u.username_customized,
    COALESCE(s.total_games, 0) as total_games,
    COALESCE(s.wins, 0) as wins,
    COALESCE(s.losses, 0) as losses,
    CASE WHEN COALESCE(s.total_games, 0) > 0
         THEN ROUND((s.wins::DECIMAL / s.total_games) * 100, 1)
         ELSE 0 END AS win_rate,
    CASE WHEN COALESCE(s.total_rounds, 0) > 0
         THEN ROUND(s.total_score::DECIMAL / s.total_rounds, 1)
         ELSE 0 END AS avg_round_score,
    CASE WHEN COALESCE(s.total_rounds, 0) > 0
         THEN ROUND(s.total_distance_error / s.total_rounds, 1)
         ELSE 0 END AS avg_distance_error,
    CASE WHEN COALESCE(s.total_rounds, 0) > 0
         THEN ROUND(s.total_year_error::DECIMAL / s.total_rounds, 1)
         ELSE 0 END AS avg_year_error,
    COALESCE(s.best_round_score, 0) as best_round_score,
    COALESCE(s.best_game_score, 0) as best_game_score,
    COALESCE(s.current_win_streak, 0) as current_win_streak,
    COALESCE(s.best_win_streak, 0) as best_win_streak
FROM users u
LEFT JOIN user_stats s ON u.id = s.user_id;

-- Function to initialize user_stats when user is created
CREATE OR REPLACE FUNCTION create_user_stats()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_stats (user_id) VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create user_stats
DROP TRIGGER IF EXISTS trigger_create_user_stats ON users;
CREATE TRIGGER trigger_create_user_stats
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_stats();
