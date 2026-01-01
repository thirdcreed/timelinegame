# Architectural TODOs

Last updated: 2026-01-01

This document tracks architectural improvements needed for stability and extensibility.

---

## P0 - CRITICAL (Do First)

### 1. Consolidate Dual Lobby/Game State Systems
**Files:** `server.js` lines 359-360, 522-528, 748-764

**Problem:** Two conflicting lobby implementations exist:
- `matchmakingQueue` (new ELO-based system)
- `lobbies` + `players` Maps (legacy system)

Two different `handleLeaveLobby()` functions with completely different implementations. On disconnect, only one gets called - leaving orphaned state. `handleLeaveGameLobby()` at line 609 is an empty stub.

**Impact:** Memory leaks, orphaned game state, unpredictable behavior

**Solution:**
- Choose ONE system (recommend matchmakingQueue pattern)
- Remove dead `handleLeaveGameLobby()` stub
- Ensure all state is cleaned up on disconnect

**Effort:** 1-2 days

---

### 2. Add Missing Database Indexes
**Files:** `migrations/001_initial_schema.sql`

**Missing indexes causing full table scans:**

| Table | Column | Query Impact |
|-------|--------|--------------|
| `users` | `username` | Every username availability check |
| `users` | `is_guest` | Leaderboard filters all users |
| `games` | `category_key` | Match history by category |
| `game_rounds` | `(game_id, round_number)` | Ordered round queries |

**Solution:** Create migration `004_add_indexes.sql`:
```sql
CREATE INDEX idx_users_username_lower ON users(LOWER(username));
CREATE INDEX idx_users_is_guest ON users(is_guest);
CREATE INDEX idx_games_category ON games(category_key);
CREATE INDEX idx_game_rounds_game_round ON game_rounds(game_id, round_number);
```

**Effort:** 1 hour

---

### 3. Add Database CHECK Constraints
**Files:** `migrations/001_initial_schema.sql`

**Bad data can currently enter:**
- Negative scores
- Negative ELO ratings
- Completed games with no winner
- Negative distance/year errors

**Solution:** Create migration `005_add_constraints.sql`:
```sql
ALTER TABLE games
  ADD CONSTRAINT check_scores_non_negative
    CHECK (player1_score >= 0 AND player2_score >= 0),
  ADD CONSTRAINT check_elo_positive
    CHECK (player1_elo_before > 0 AND player2_elo_before > 0),
  ADD CONSTRAINT check_completed_has_winner
    CHECK (completed_at IS NULL OR winner_id IS NOT NULL);

ALTER TABLE game_rounds
  ADD CONSTRAINT check_round_scores_non_negative
    CHECK (player1_score >= 0 AND player2_score >= 0),
  ADD CONSTRAINT check_distance_non_negative
    CHECK (player1_distance_km >= 0 AND player2_distance_km >= 0);

ALTER TABLE user_stats
  ADD CONSTRAINT check_stats_non_negative
    CHECK (wins >= 0 AND losses >= 0 AND draws >= 0 AND total_games >= 0);
```

**Effort:** 1 hour

---

## P1 - HIGH (Do Soon)

### 4. Extract Shared Utilities (DRY)
**Files:** `game.js`, `multiplayer.js`, `learning.js`, `daily.html`, `server.js`

**~400+ lines of duplicated code across files:**

| Function | Duplicated In | Lines |
|----------|---------------|-------|
| `calculateDistance()` | game.js:282, server.js:1287 | 10 lines × 2 |
| `calculateScore()` | game.js:294, server.js:1298 | 17 lines × 2 |
| `formatYear()` | game.js:548, daily.html:459 | 9 lines × 2 |
| Marker creation | 4 files | 8 lines × 4 |
| Polyline drawing | 4 files | 6 lines × 4 |
| Map fitBounds | 4 files | 4 lines × 4 |

**Solution:** Create `/src/utils/gameUtils.js`:
```javascript
// Shared between client and server
module.exports = {
    calculateDistance,
    calculateScore,
    formatYear,
    // Marker helpers (client-only)
    createUserMarker,
    createCorrectMarker,
    drawErrorLine,
    fitMapToBounds
};
```

**Effort:** 2-3 hours

---

### 5. Add WebSocket Error Responses
**Files:** `server.js` lines 413-470

**Problem:** Errors are logged but client never knows:
```javascript
} catch (err) {
    console.error('Error handling message:', err);  // Client never notified!
}
```

If `handleSubmitAnswer()` fails, the player's answer is silently lost.

**Solution:** Send error responses to client:
```javascript
} catch (err) {
    console.error('Error handling message:', err);
    ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to process request',
        originalType: message.type
    }));
}
```

**Effort:** 1-2 hours

---

### 6. Add Input Validation on Game Submissions
**Files:** `server.js` lines 830-876, 1176-1276

**Missing validation:**
- No check that coordinates are valid numbers
- No check for negative `timeLeft` values
- No validation of year ranges
- NaN/Infinity not rejected

**Solution:** Add validation helper:
```javascript
function validateSubmission({ guessLat, guessLng, guessYear, timeLeft }) {
    if (typeof guessLat !== 'number' || isNaN(guessLat) || guessLat < -90 || guessLat > 90) {
        return { valid: false, error: 'Invalid latitude' };
    }
    if (typeof guessLng !== 'number' || isNaN(guessLng) || guessLng < -180 || guessLng > 180) {
        return { valid: false, error: 'Invalid longitude' };
    }
    if (typeof guessYear !== 'number' || isNaN(guessYear)) {
        return { valid: false, error: 'Invalid year' };
    }
    if (timeLeft !== undefined && (typeof timeLeft !== 'number' || timeLeft < 0)) {
        return { valid: false, error: 'Invalid timeLeft' };
    }
    return { valid: true };
}
```

**Effort:** 2-3 hours

---

## P2 - MEDIUM (Do When Possible)

### 7. Implement Connection State Machine
**Files:** `server.js` lines 359-360, 1068

**Problem:** Three separate Maps track overlapping state:
```javascript
const lobbies = new Map();
const players = new Map();
const learningSessions = new Map();
```

A single connection can exist in multiple incompatible states (matchmaking AND learning mode).

**Solution:** Create state machine per connection:
```javascript
const connectionStates = new Map(); // ws -> { mode: 'idle'|'matchmaking'|'game'|'learning'|'practice' }

function setConnectionMode(ws, mode) {
    const current = connectionStates.get(ws);
    if (current?.mode === mode) return;

    // Clean up previous mode
    if (current?.mode === 'matchmaking') matchmakingQueue.remove(ws);
    if (current?.mode === 'learning') learningSessions.delete(ws);
    if (current?.mode === 'game') cleanupGameState(ws);

    connectionStates.set(ws, { mode, startedAt: Date.now() });
}
```

**Effort:** 1 day

---

### 8. Create Categories Table
**Files:** `migrations/`, `src/data/categories.js`

**Problem:** `category_key` is just a string - can insert invalid categories. Categories hardcoded in JS.

**Solution:** Create migration `006_categories_table.sql`:
```sql
CREATE TABLE categories (
    key VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    timeline_min INTEGER NOT NULL,
    timeline_max INTEGER NOT NULL,
    map_center_lat DECIMAL(10, 7),
    map_center_lng DECIMAL(10, 7),
    map_zoom INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE games
  ADD CONSTRAINT fk_games_category
  FOREIGN KEY (category_key) REFERENCES categories(key);
```

**Effort:** 3-4 hours

---

### 9. Add Rate Limiting
**Files:** `server.js`

**Problem:** No protection against:
- Submission flooding (1000 answers/second possible)
- Invite spam
- API abuse

**Solution:** Add simple rate limiter:
```javascript
const rateLimits = new Map(); // ws -> { lastSubmit, submitCount }

function checkRateLimit(ws, action, maxPerMinute = 60) {
    const now = Date.now();
    const limit = rateLimits.get(ws) || { count: 0, resetAt: now + 60000 };

    if (now > limit.resetAt) {
        limit.count = 0;
        limit.resetAt = now + 60000;
    }

    if (limit.count >= maxPerMinute) {
        return false; // Rate limited
    }

    limit.count++;
    rateLimits.set(ws, limit);
    return true;
}
```

**Effort:** 3-4 hours

---

### 10. Extract Shared CSS
**Files:** `daily.html`, `index.html`

**Problem:** daily.html has 372 lines of inline CSS, mostly duplicating main styles.

**Solution:** Create `/styles/shared.css` with common styles:
- Game container, header, timeline
- Buttons, overlays, modals
- Map markers, results display

**Effort:** 2-3 hours

---

## P3 - LOW (Future Improvements)

### 11. Create Events Table
**Files:** `migrations/`, game data

**Problem:** Events are hardcoded in JS. `game_rounds` stores event data redundantly.

**Solution:** Normalize to events table:
```sql
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_key VARCHAR(50) NOT NULL REFERENCES categories(key),
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    lat DECIMAL(10, 7) NOT NULL,
    lng DECIMAL(10, 7) NOT NULL,
    year INTEGER NOT NULL,
    UNIQUE(category_key, name)
);

-- Update game_rounds to reference events
ALTER TABLE game_rounds ADD COLUMN event_id UUID REFERENCES events(id);
```

**Effort:** 1 day

---

### 12. Add Audit Logging Table
**Files:** `migrations/`

**Problem:** No way to debug "my ELO was wrong" claims or track important events.

**Solution:** Create audit table:
```sql
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    details JSONB,
    ip_address INET,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_action ON audit_log(action);
CREATE INDEX idx_audit_created ON audit_log(created_at);
```

Log: ELO changes, login attempts, username changes, game disputes

**Effort:** 4-5 hours

---

### 13. Add Soft Deletes
**Files:** `migrations/`

**Problem:** Hard deletes lose data permanently. Can't audit deleted accounts.

**Solution:** Add `deleted_at` columns:
```sql
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP;
ALTER TABLE games ADD COLUMN deleted_at TIMESTAMP;

-- Update queries to filter: WHERE deleted_at IS NULL
```

**Effort:** 3-4 hours

---

### 14. Add Database Triggers for Stats Consistency
**Files:** `migrations/`

**Problem:** `user_stats` can become inconsistent if updates fail mid-transaction.

**Solution:** Add trigger to validate stats:
```sql
CREATE OR REPLACE FUNCTION validate_user_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.wins + NEW.losses + NEW.draws != NEW.total_games THEN
        RAISE EXCEPTION 'Stats inconsistency: wins + losses + draws must equal total_games';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_stats_consistency
BEFORE INSERT OR UPDATE ON user_stats
FOR EACH ROW EXECUTE FUNCTION validate_user_stats();
```

**Effort:** 2-3 hours

---

### 15. Fix View Migration Order
**Files:** `migrations/001_initial_schema.sql`

**Problem:** `user_computed_stats` view references `username_customized` which is added in migration 002.

**Solution:** Move view creation to after all required columns exist, or recreate view in migration 002.

**Effort:** 30 minutes

---

## Summary

| Priority | Count | Total Effort |
|----------|-------|--------------|
| P0 - Critical | 3 | 1-2 days |
| P1 - High | 3 | 5-8 hours |
| P2 - Medium | 4 | 2-3 days |
| P3 - Low | 5 | 2-3 days |

**Recommended order:**
1. Add missing indexes (P0, 1 hour) - immediate performance win
2. Add CHECK constraints (P0, 1 hour) - prevent bad data now
3. Extract shared utilities (P1, 2-3 hours) - reduce tech debt
4. Add WebSocket error responses (P1, 1-2 hours) - better UX
5. Consolidate lobby systems (P0, 1-2 days) - biggest stability fix
