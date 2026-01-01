const pool = require('./pool');

// User queries
const userQueries = {
    // Find user by OAuth provider and ID
    findByOAuth: async (provider, oauthId) => {
        const result = await pool.query(
            'SELECT * FROM users WHERE oauth_provider = $1 AND oauth_id = $2',
            [provider, oauthId]
        );
        return result.rows[0];
    },

    // Find user by ID
    findById: async (id) => {
        const result = await pool.query(
            'SELECT * FROM users WHERE id = $1',
            [id]
        );
        return result.rows[0];
    },

    // Create new user from OAuth
    createFromOAuth: async (provider, oauthId, username, displayName, email, avatarUrl) => {
        const result = await pool.query(
            `INSERT INTO users (oauth_provider, oauth_id, username, display_name, email, avatar_url)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [provider, oauthId, username, displayName, email, avatarUrl]
        );
        return result.rows[0];
    },

    // Create guest user
    createGuest: async (username) => {
        const result = await pool.query(
            `INSERT INTO users (username, is_guest)
             VALUES ($1, TRUE)
             RETURNING *`,
            [username]
        );
        return result.rows[0];
    },

    // Update user ELO
    updateElo: async (userId, newElo) => {
        const result = await pool.query(
            `UPDATE users SET elo_rating = $1, games_played = games_played + 1, updated_at = NOW()
             WHERE id = $2
             RETURNING *`,
            [newElo, userId]
        );
        return result.rows[0];
    },

    // Get user with computed stats
    getWithStats: async (userId) => {
        const result = await pool.query(
            'SELECT * FROM user_computed_stats WHERE id = $1',
            [userId]
        );
        return result.rows[0];
    },

    // Get leaderboard
    getLeaderboard: async (limit = 50) => {
        const result = await pool.query(
            `SELECT id, username, display_name, avatar_url, elo_rating, games_played
             FROM users
             WHERE is_guest = FALSE AND games_played > 0
             ORDER BY elo_rating DESC
             LIMIT $1`,
            [limit]
        );
        return result.rows;
    },

    // Set custom username
    setUsername: async (userId, username) => {
        const result = await pool.query(
            `UPDATE users SET username = $2, username_customized = TRUE, updated_at = NOW()
             WHERE id = $1
             RETURNING *`,
            [userId, username]
        );
        return result.rows[0];
    },

    // Check if username is available
    isUsernameAvailable: async (username) => {
        const result = await pool.query(
            'SELECT id FROM users WHERE LOWER(username) = LOWER($1)',
            [username]
        );
        return result.rows.length === 0;
    }
};

// Game queries
const gameQueries = {
    // Create new game
    create: async (categoryKey, player1Id, player2Id, player1EloBefore, player2EloBefore, isRanked = true) => {
        const result = await pool.query(
            `INSERT INTO games (category_key, player1_id, player2_id, player1_score, player2_score,
                                player1_elo_before, player2_elo_before, is_ranked)
             VALUES ($1, $2, $3, 0, 0, $4, $5, $6)
             RETURNING *`,
            [categoryKey, player1Id, player2Id, player1EloBefore, player2EloBefore, isRanked]
        );
        return result.rows[0];
    },

    // Complete game with final results
    complete: async (gameId, player1Score, player2Score, winnerId, player1EloAfter, player2EloAfter) => {
        const result = await pool.query(
            `UPDATE games
             SET player1_score = $2, player2_score = $3, winner_id = $4,
                 player1_elo_after = $5, player2_elo_after = $6, completed_at = NOW()
             WHERE id = $1
             RETURNING *`,
            [gameId, player1Score, player2Score, winnerId, player1EloAfter, player2EloAfter]
        );
        return result.rows[0];
    },

    // Get user's recent games
    getRecentByUser: async (userId, limit = 10) => {
        const result = await pool.query(
            `SELECT g.*,
                    u1.username as player1_username, u2.username as player2_username
             FROM games g
             JOIN users u1 ON g.player1_id = u1.id
             JOIN users u2 ON g.player2_id = u2.id
             WHERE (g.player1_id = $1 OR g.player2_id = $1) AND g.completed_at IS NOT NULL
             ORDER BY g.completed_at DESC
             LIMIT $2`,
            [userId, limit]
        );
        return result.rows;
    }
};

// Round queries
const roundQueries = {
    // Save round result
    save: async (gameId, roundNumber, eventName, eventLat, eventLng, eventYear,
                 p1GuessLat, p1GuessLng, p1GuessYear, p1DistanceKm, p1YearError, p1TimeLeft, p1Score,
                 p2GuessLat, p2GuessLng, p2GuessYear, p2DistanceKm, p2YearError, p2TimeLeft, p2Score) => {
        const result = await pool.query(
            `INSERT INTO game_rounds
             (game_id, round_number, event_name, event_lat, event_lng, event_year,
              player1_guess_lat, player1_guess_lng, player1_guess_year, player1_distance_km, player1_year_error, player1_time_left, player1_score,
              player2_guess_lat, player2_guess_lng, player2_guess_year, player2_distance_km, player2_year_error, player2_time_left, player2_score)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
             RETURNING *`,
            [gameId, roundNumber, eventName, eventLat, eventLng, eventYear,
             p1GuessLat, p1GuessLng, p1GuessYear, p1DistanceKm, p1YearError, p1TimeLeft, p1Score,
             p2GuessLat, p2GuessLng, p2GuessYear, p2DistanceKm, p2YearError, p2TimeLeft, p2Score]
        );
        return result.rows[0];
    },

    // Get rounds for a game
    getByGame: async (gameId) => {
        const result = await pool.query(
            'SELECT * FROM game_rounds WHERE game_id = $1 ORDER BY round_number',
            [gameId]
        );
        return result.rows;
    }
};

// Stats queries
const statsQueries = {
    // Update user stats after a game
    updateAfterGame: async (userId, gameScore, won, roundStats) => {
        // roundStats: { totalScore, totalDistanceError, totalYearError, roundCount, bestRoundScore }
        const result = await pool.query(
            `UPDATE user_stats SET
                total_games = total_games + 1,
                wins = wins + $2,
                losses = losses + $3,
                total_score = total_score + $4,
                total_distance_error = total_distance_error + $5,
                total_year_error = total_year_error + $6,
                total_rounds = total_rounds + $7,
                best_round_score = GREATEST(best_round_score, $8),
                best_game_score = GREATEST(best_game_score, $9),
                current_win_streak = CASE WHEN $2 = 1 THEN current_win_streak + 1 ELSE 0 END,
                best_win_streak = GREATEST(best_win_streak, CASE WHEN $2 = 1 THEN current_win_streak + 1 ELSE current_win_streak END),
                updated_at = NOW()
             WHERE user_id = $1
             RETURNING *`,
            [userId, won ? 1 : 0, won ? 0 : 1, roundStats.totalScore, roundStats.totalDistanceError,
             roundStats.totalYearError, roundStats.roundCount, roundStats.bestRoundScore, gameScore]
        );
        return result.rows[0];
    }
};

// Learning progress queries (SM-2 spaced repetition)
const learningQueries = {
    // Get user's progress for all events in a category
    getProgressByCategory: async (userId, categoryKey) => {
        const result = await pool.query(
            `SELECT * FROM user_event_progress
             WHERE user_id = $1 AND category_key = $2`,
            [userId, categoryKey]
        );
        return result.rows;
    },

    // Get single event progress
    getEventProgress: async (userId, categoryKey, eventName) => {
        const result = await pool.query(
            `SELECT * FROM user_event_progress
             WHERE user_id = $1 AND category_key = $2 AND event_name = $3`,
            [userId, categoryKey, eventName]
        );
        return result.rows[0];
    },

    // Create or update event progress after learning attempt
    upsertProgress: async (userId, categoryKey, eventName, quality, yearError, distanceKm, easeFactor, intervalDays, repetitions, nextReview) => {
        const result = await pool.query(
            `INSERT INTO user_event_progress
             (user_id, category_key, event_name, last_quality, last_year_error, last_distance_km,
              ease_factor, interval_days, repetitions, next_review, last_review,
              total_attempts, successful_attempts)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), 1, CASE WHEN $4 >= 3 THEN 1 ELSE 0 END)
             ON CONFLICT (user_id, category_key, event_name)
             DO UPDATE SET
                last_quality = $4,
                last_year_error = $5,
                last_distance_km = $6,
                ease_factor = $7,
                interval_days = $8,
                repetitions = $9,
                next_review = $10,
                last_review = NOW(),
                total_attempts = user_event_progress.total_attempts + 1,
                successful_attempts = user_event_progress.successful_attempts + CASE WHEN $4 >= 3 THEN 1 ELSE 0 END,
                updated_at = NOW()
             RETURNING *`,
            [userId, categoryKey, eventName, quality, yearError, distanceKm, easeFactor, intervalDays, repetitions, nextReview]
        );
        return result.rows[0];
    },

    // Get learning stats for a category
    getLearningStats: async (userId, categoryKey) => {
        const result = await pool.query(
            `SELECT * FROM user_learning_stats
             WHERE user_id = $1 AND category_key = $2`,
            [userId, categoryKey]
        );
        return result.rows[0];
    },

    // Get all user learning stats
    getAllLearningStats: async (userId) => {
        const result = await pool.query(
            `SELECT * FROM user_learning_stats WHERE user_id = $1`,
            [userId]
        );
        return result.rows;
    },

    // Get due events count
    getDueCount: async (userId, categoryKey) => {
        const result = await pool.query(
            `SELECT COUNT(*) as due_count FROM user_event_progress
             WHERE user_id = $1 AND category_key = $2 AND next_review <= NOW()`,
            [userId, categoryKey]
        );
        return parseInt(result.rows[0].due_count);
    }
};

// Session queries
const sessionQueries = {
    // Create session
    create: async (userId, refreshTokenHash, expiresAt) => {
        const result = await pool.query(
            `INSERT INTO sessions (user_id, refresh_token_hash, expires_at)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [userId, refreshTokenHash, expiresAt]
        );
        return result.rows[0];
    },

    // Find session by ID
    findById: async (sessionId) => {
        const result = await pool.query(
            'SELECT * FROM sessions WHERE id = $1 AND expires_at > NOW()',
            [sessionId]
        );
        return result.rows[0];
    },

    // Delete session
    delete: async (sessionId) => {
        await pool.query('DELETE FROM sessions WHERE id = $1', [sessionId]);
    },

    // Delete all user sessions
    deleteAllForUser: async (userId) => {
        await pool.query('DELETE FROM sessions WHERE user_id = $1', [userId]);
    },

    // Clean up expired sessions
    cleanExpired: async () => {
        await pool.query('DELETE FROM sessions WHERE expires_at < NOW()');
    }
};

module.exports = {
    pool,
    userQueries,
    gameQueries,
    roundQueries,
    statsQueries,
    learningQueries,
    sessionQueries
};
