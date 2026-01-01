require('dotenv').config();

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const cors = require('cors');
const url = require('url');

// Auth modules
const { initializePassport, passport } = require('./src/auth/passport');
const { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken, invalidateSession, authMiddleware } = require('./src/auth/jwt');
const { userQueries, gameQueries, roundQueries, statsQueries, learningQueries } = require('./src/db/queries');
const { calculateGameEloChanges } = require('./src/matchmaking/elo');
const MatchmakingQueue = require('./src/matchmaking/queue');
const sm2 = require('./src/learning/sm2');
const { categories } = require('./src/data/categories');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Initialize matchmaking queue
const matchmakingQueue = new MatchmakingQueue();

// Middleware
app.use(helmet({
    contentSecurityPolicy: false // Disable for development
}));
app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? 'https://timelinegame.fly.dev' : true,
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(session({
    secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Initialize Passport
initializePassport();
app.use(passport.initialize());
app.use(passport.session());

// Serve static files
app.use(express.static(__dirname));

// =============================================================================
// AUTH ROUTES
// =============================================================================

// Google OAuth
app.get('/auth/google', (req, res, next) => {
    if (!process.env.GOOGLE_CLIENT_ID) {
        return res.status(503).send('Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env');
    }
    passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/?error=auth_failed' }),
    async (req, res) => {
        try {
            const accessToken = generateAccessToken(req.user);
            const { token: refreshToken } = await generateRefreshToken(req.user);
            res.redirect(`/?token=${accessToken}&refresh=${refreshToken}`);
        } catch (err) {
            console.error('Google callback error:', err);
            res.redirect('/?error=auth_failed');
        }
    }
);

// Discord OAuth
app.get('/auth/discord', (req, res, next) => {
    if (!process.env.DISCORD_CLIENT_ID) {
        return res.status(503).send('Discord OAuth not configured. Set DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET in .env');
    }
    passport.authenticate('discord')(req, res, next);
});

app.get('/auth/discord/callback',
    passport.authenticate('discord', { failureRedirect: '/?error=auth_failed' }),
    async (req, res) => {
        try {
            const accessToken = generateAccessToken(req.user);
            const { token: refreshToken } = await generateRefreshToken(req.user);
            res.redirect(`/?token=${accessToken}&refresh=${refreshToken}`);
        } catch (err) {
            console.error('Discord callback error:', err);
            res.redirect('/?error=auth_failed');
        }
    }
);

// Guest login
app.post('/auth/guest', async (req, res) => {
    try {
        const username = `Guest_${Math.floor(Math.random() * 10000)}`;
        const user = await userQueries.createGuest(username);
        const accessToken = generateAccessToken(user);
        const { token: refreshToken } = await generateRefreshToken(user);
        res.json({ accessToken, refreshToken, user: { id: user.id, username: user.username, isGuest: true } });
    } catch (err) {
        console.error('Guest login error:', err);
        res.status(500).json({ error: 'Failed to create guest session' });
    }
});

// Refresh token
app.post('/auth/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(401).json({ error: 'No refresh token' });
        }

        const result = await verifyRefreshToken(refreshToken);
        if (!result) {
            return res.status(401).json({ error: 'Invalid refresh token' });
        }

        const user = await userQueries.findById(result.userId);
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        const accessToken = generateAccessToken(user);
        res.json({ accessToken });
    } catch (err) {
        console.error('Token refresh error:', err);
        res.status(500).json({ error: 'Failed to refresh token' });
    }
});

// Logout
app.post('/auth/logout', authMiddleware, async (req, res) => {
    try {
        // Invalidate all sessions for user
        await invalidateSession(req.user.sessionId);
        res.json({ success: true });
    } catch (err) {
        console.error('Logout error:', err);
        res.status(500).json({ error: 'Failed to logout' });
    }
});

// =============================================================================
// API ROUTES
// =============================================================================

// Get current user profile with stats
app.get('/api/me', authMiddleware, async (req, res) => {
    try {
        const user = await userQueries.getWithStats(req.user.sub);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        console.error('Get user error:', err);
        res.status(500).json({ error: 'Failed to get user' });
    }
});

// Set username
app.post('/api/set-username', authMiddleware, async (req, res) => {
    try {
        const { username } = req.body;

        // Validate username
        if (!username || username.length < 3 || username.length > 20) {
            return res.status(400).json({ error: 'Username must be 3-20 characters' });
        }

        // Only alphanumeric and underscores
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            return res.status(400).json({ error: 'Username can only contain letters, numbers, and underscores' });
        }

        // Check availability
        const available = await userQueries.isUsernameAvailable(username);
        if (!available) {
            return res.status(400).json({ error: 'Username is already taken' });
        }

        // Update username
        const user = await userQueries.setUsername(req.user.sub, username);

        // Generate new tokens with updated info
        const accessToken = generateAccessToken(user);
        const { token: refreshToken } = await generateRefreshToken(user);

        res.json({
            success: true,
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                username: user.username,
                display_name: user.display_name,
                elo_rating: user.elo_rating,
                username_customized: true
            }
        });
    } catch (err) {
        console.error('Set username error:', err);
        res.status(500).json({ error: 'Failed to set username' });
    }
});

// Check username availability
app.get('/api/check-username/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const available = await userQueries.isUsernameAvailable(username);
        res.json({ available });
    } catch (err) {
        res.status(500).json({ error: 'Failed to check username' });
    }
});

// Get leaderboard
app.get('/api/leaderboard', async (req, res) => {
    try {
        const leaderboard = await userQueries.getLeaderboard(50);
        res.json(leaderboard);
    } catch (err) {
        console.error('Get leaderboard error:', err);
        res.status(500).json({ error: 'Failed to get leaderboard' });
    }
});

// Get user's recent games
app.get('/api/games', authMiddleware, async (req, res) => {
    try {
        const games = await gameQueries.getRecentByUser(req.user.sub, 20);
        res.json(games);
    } catch (err) {
        console.error('Get games error:', err);
        res.status(500).json({ error: 'Failed to get games' });
    }
});

// =============================================================================
// GAME STATE
// =============================================================================

const lobbies = new Map(); // lobbyId -> { players, status, currentRound, currentEvent, gameDbId, ... }
const players = new Map(); // ws -> { id, name, lobby, score, roundAnswers, userId, elo, isGuest, ... }

let lobbyIdCounter = 0;

function generateLobbyId() {
    return `lobby_${++lobbyIdCounter}_${Date.now()}`;
}

// =============================================================================
// WEBSOCKET AUTHENTICATION
// =============================================================================

function authenticateWebSocket(req) {
    const parsedUrl = url.parse(req.url, true);
    const token = parsedUrl.query.token;

    if (token) {
        const decoded = verifyAccessToken(token);
        if (decoded) {
            // Use custom username if set, otherwise fall back to display name
            const displayName = decoded.needsUsername === false
                ? (decoded.username || decoded.displayName || 'Player')
                : (decoded.displayName || decoded.username || 'Player');
            return {
                userId: decoded.sub,
                username: displayName,
                elo: decoded.elo || 1000,
                isGuest: decoded.isGuest || false,
                avatarUrl: decoded.avatarUrl
            };
        }
    }

    // Anonymous/guest connection (for practice mode without auth)
    return {
        userId: null,
        username: `Guest_${Math.floor(Math.random() * 10000)}`,
        elo: 1000,
        isGuest: true,
        avatarUrl: null
    };
}

// =============================================================================
// WEBSOCKET HANDLING
// =============================================================================

wss.on('connection', (ws, req) => {
    const auth = authenticateWebSocket(req);
    ws.auth = auth;

    console.log(`New client connected: ${auth.username} (guest: ${auth.isGuest})`);

    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data);
            console.log('Received message:', message.type);

            switch (message.type) {
                case 'join_lobby':
                    handleJoinLobby(ws, message);
                    break;
                case 'leave_lobby':
                    handleLeaveLobby(ws);
                    break;
                case 'set_ready':
                    handleSetReady(ws, message);
                    break;
                case 'send_invite':
                    handleSendInvite(ws, message);
                    break;
                case 'respond_invite':
                    handleRespondInvite(ws, message);
                    break;
                case 'start_practice':
                    handleStartPractice(ws, message);
                    break;
                case 'submit_answer':
                    handleSubmitAnswer(ws, message);
                    break;
                case 'ready_for_round':
                    handleReadyForRound(ws);
                    break;
                case 'ready_next_round':
                    handleReadyNextRound(ws);
                    break;
                case 'ping':
                    ws.send(JSON.stringify({ type: 'pong' }));
                    break;
                // Learning mode
                case 'learning_start':
                    handleLearningStart(ws, message);
                    break;
                case 'learning_next':
                    handleLearningNext(ws, message);
                    break;
                case 'learning_submit':
                    handleLearningSubmit(ws, message);
                    break;
                // Legacy support
                case 'join_queue':
                    handleJoinLobby(ws, message);
                    break;
                case 'leave_queue':
                    handleLeaveLobby(ws);
                    break;
            }
        } catch (err) {
            console.error('Error handling message:', err);
        }
    });

    ws.on('close', () => {
        handleLeaveLobby(ws);
        handleLeaveGameLobby(ws);
        cleanupLearningSession(ws);
        console.log(`Client disconnected: ${auth.username}`);
    });
});

// =============================================================================
// MATCHMAKING
// =============================================================================

// Set up matchmaking callback for auto-matched ready players
matchmakingQueue.setMatchCallback(async (categoryKey, match) => {
    await createMatchLobby(categoryKey, match.player1, match.player2);
    matchmakingQueue.broadcastLobbyUpdate(categoryKey);
});

// Join the lobby (not ready by default)
function handleJoinLobby(ws, message) {
    const { categoryKey, playerName } = message;
    const auth = ws.auth;
    const displayName = playerName || auth.username;

    // Store category key on websocket for later reference
    ws.categoryKey = categoryKey;

    // Add to lobby (not ready)
    matchmakingQueue.addToLobby(
        categoryKey,
        ws,
        auth.userId,
        auth.elo,
        auth.isGuest,
        displayName,
        auth.avatarUrl
    );

    // Send lobby joined confirmation
    ws.send(JSON.stringify({
        type: 'lobby_joined',
        categoryKey,
        ready: false
    }));

    // Broadcast updated player list to all players in this lobby
    matchmakingQueue.broadcastLobbyUpdate(categoryKey);
}

// Leave the lobby
function handleLeaveLobby(ws) {
    const result = matchmakingQueue.removeFromLobby(ws);
    if (result) {
        matchmakingQueue.broadcastLobbyUpdate(result.categoryKey);
    }
    ws.categoryKey = null;
}

// Toggle ready status
function handleSetReady(ws, message) {
    const { ready } = message;
    const result = matchmakingQueue.setReady(ws, ready);

    if (!result) {
        ws.send(JSON.stringify({ type: 'error', message: 'Not in a lobby' }));
        return;
    }

    // Confirm ready status to player
    ws.send(JSON.stringify({
        type: 'ready_status',
        ready
    }));

    // If a match was found, create the game
    if (result.match) {
        createMatchLobby(result.categoryKey, result.match.player1, result.match.player2);
    }

    // Broadcast updated lobby to all players
    matchmakingQueue.broadcastLobbyUpdate(result.categoryKey);
}

// Send game invite to another player
function handleSendInvite(ws, message) {
    const { targetPlayerId } = message;
    const categoryKey = ws.categoryKey;

    if (!categoryKey) {
        ws.send(JSON.stringify({ type: 'error', message: 'Not in a lobby' }));
        return;
    }

    const result = matchmakingQueue.sendInvite(categoryKey, ws, targetPlayerId);

    if (result.success) {
        ws.send(JSON.stringify({
            type: 'invite_sent',
            to: targetPlayerId
        }));
    } else {
        ws.send(JSON.stringify({
            type: 'error',
            message: result.error
        }));
    }
}

// Respond to a game invite
function handleRespondInvite(ws, message) {
    const { fromUserId, accept } = message;
    const categoryKey = ws.categoryKey;

    if (!categoryKey) {
        ws.send(JSON.stringify({ type: 'error', message: 'Not in a lobby' }));
        return;
    }

    if (accept) {
        const result = matchmakingQueue.acceptInvite(categoryKey, ws, fromUserId);

        if (result.success) {
            // Create match lobby
            createMatchLobby(categoryKey, result.match.player1, result.match.player2);
            matchmakingQueue.broadcastLobbyUpdate(categoryKey);
        } else {
            ws.send(JSON.stringify({
                type: 'error',
                message: result.error
            }));
        }
    } else {
        matchmakingQueue.declineInvite(categoryKey, ws, fromUserId);
    }
}

// Leave a game lobby (different from matchmaking lobby)
function handleLeaveGameLobby(ws) {
    // This handles leaving an active game lobby
    // (previously handleLeaveLobby in old code)
}

async function createMatchLobby(categoryKey, player1, player2) {
    const lobbyId = generateLobbyId();

    // Determine if this is a ranked game (both players are registered)
    const isRanked = !player1.isGuest && !player2.isGuest && player1.userId && player2.userId;

    // Create game record in database if ranked
    let gameDbId = null;
    if (isRanked) {
        try {
            const game = await gameQueries.create(
                categoryKey,
                player1.userId,
                player2.userId,
                player1.elo,
                player2.elo,
                true
            );
            gameDbId = game.id;
        } catch (err) {
            console.error('Failed to create game record:', err);
        }
    }

    const lobby = {
        id: lobbyId,
        categoryKey,
        players: [player1.ws, player2.ws],
        status: 'waiting',
        currentRound: 0,
        currentEvent: null,
        roundStartTime: null,
        gameDbId,
        isRanked
    };

    lobbies.set(lobbyId, lobby);

    // Set up player objects
    [player1, player2].forEach((p, idx) => {
        players.set(p.ws, {
            id: `player_${idx + 1}`,
            name: p.username,
            lobby: lobbyId,
            score: 0,
            roundAnswers: [],
            userId: p.userId,
            elo: p.elo,
            isGuest: p.isGuest,
            gamesPlayed: 0 // Will be fetched from DB if needed
        });
    });

    // Notify both players
    [player1.ws, player2.ws].forEach(ws => {
        const isPlayer1 = ws === player1.ws;
        const myId = isPlayer1 ? 'player_1' : 'player_2';

        ws.send(JSON.stringify({
            type: 'match_found',
            lobbyId,
            isRanked,
            playerId: myId,
            opponent: {
                username: isPlayer1 ? player2.username : player1.username,
                elo: isPlayer1 ? player2.elo : player1.elo,
                isGuest: isPlayer1 ? player2.isGuest : player1.isGuest
            }
        }));

        // Send lobby update with both players
        ws.send(JSON.stringify({
            type: 'lobby_update',
            status: 'matched',
            players: [
                { id: 'player_1', name: player1.username, score: 0, elo: player1.elo },
                { id: 'player_2', name: player2.username, score: 0, elo: player2.elo }
            ],
            currentRound: 0
        }));
    });

    // Start game after brief delay
    setTimeout(() => startGame(lobbyId), 2000);
}

// =============================================================================
// PRACTICE MODE (Solo)
// =============================================================================

function handleStartPractice(ws, message) {
    const { categoryKey, playerName } = message;
    const auth = ws.auth;

    const lobbyId = generateLobbyId();

    const lobby = {
        id: lobbyId,
        categoryKey,
        players: [ws],
        status: 'waiting',
        currentRound: 0,
        currentEvent: null,
        roundStartTime: null,
        gameDbId: null,
        isRanked: false,
        isPractice: true
    };

    lobbies.set(lobbyId, lobby);

    players.set(ws, {
        id: 'player_1',
        name: playerName || auth.username,
        lobby: lobbyId,
        score: 0,
        roundAnswers: [],
        userId: auth.userId,
        elo: auth.elo,
        isGuest: auth.isGuest
    });

    ws.send(JSON.stringify({
        type: 'practice_started',
        lobbyId
    }));

    setTimeout(() => startGame(lobbyId), 1000);
}

// =============================================================================
// LEGACY LOBBY HANDLING (for backwards compatibility)
// =============================================================================

function handleLeaveLobby(ws) {
    const player = players.get(ws);
    if (!player) return;

    const lobby = lobbies.get(player.lobby);
    if (!lobby) return;

    lobby.players = lobby.players.filter(p => p !== ws);

    if (lobby.players.length === 0) {
        lobbies.delete(player.lobby);
    } else if (lobby.status === 'playing') {
        endGame(player.lobby);
    }

    players.delete(ws);
}

// =============================================================================
// GAME LOGIC
// =============================================================================

function broadcastToLobby(lobbyId, message) {
    const lobby = lobbies.get(lobbyId);
    if (!lobby) return;

    lobby.players.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
        }
    });
}

function startGame(lobbyId) {
    const lobby = lobbies.get(lobbyId);
    if (!lobby) return;

    lobby.status = 'playing';
    lobby.currentRound = 0;

    lobby.players.forEach(ws => {
        const p = players.get(ws);
        if (p) {
            p.score = 0;
            p.roundAnswers = [];
        }
    });

    broadcastToLobby(lobbyId, { type: 'game_starting' });

    setTimeout(() => startNextRound(lobbyId), 1000);
}

function startNextRound(lobbyId) {
    const lobby = lobbies.get(lobbyId);
    if (!lobby) return;

    lobby.currentRound++;

    const category = categories[lobby.categoryKey];
    if (!category) {
        console.error(`Category ${lobby.categoryKey} not found`);
        return;
    }

    const event = category.events[Math.floor(Math.random() * category.events.length)];
    lobby.currentEvent = event;

    lobby.players.forEach(ws => {
        const p = players.get(ws);
        if (p) p.readyForRound = false;
    });

    broadcastToLobby(lobbyId, {
        type: 'prepare_round',
        round: lobby.currentRound,
        event: event
    });

    lobby.roundStartTime = null;
}

function handleSubmitAnswer(ws, message) {
    const player = players.get(ws);
    if (!player) return;

    const lobby = lobbies.get(player.lobby);
    if (!lobby || lobby.status !== 'playing') return;

    const { guessLat, guessLng, guessYear, timeLeft } = message;

    const event = lobby.currentEvent;
    const distance = calculateDistance(guessLat, guessLng, event.lat, event.lng);
    const yearError = Math.abs(guessYear - event.year);
    let roundScore = calculateScore(distance, yearError, timeLeft);

    if (timeLeft <= 0) roundScore -= 50;

    player.roundAnswers[lobby.currentRound - 1] = {
        guessLat,
        guessLng,
        guessYear,
        timeLeft,
        timestamp: Date.now(),
        roundScore,
        distance,
        yearError
    };

    player.score += roundScore;

    ws.send(JSON.stringify({
        type: 'answer_received',
        roundScore,
        totalScore: player.score,
        distance,
        yearError
    }));

    // Check if all players answered (or practice mode)
    const allAnswered = lobby.players.every(playerWs => {
        const p = players.get(playerWs);
        return p && p.roundAnswers[lobby.currentRound - 1] !== undefined;
    });

    if (allAnswered) {
        showRoundResults(player.lobby);
    }
}

function handleReadyForRound(ws) {
    const player = players.get(ws);
    if (!player) return;

    const lobby = lobbies.get(player.lobby);
    if (!lobby) return;

    player.readyForRound = true;

    const allReady = lobby.players.every(playerWs => {
        const p = players.get(playerWs);
        return p && p.readyForRound === true;
    });

    if (allReady) {
        broadcastToLobby(player.lobby, {
            type: 'round_start',
            round: lobby.currentRound
        });
        lobby.roundStartTime = Date.now();
    }
}

function handleReadyNextRound(ws) {
    const player = players.get(ws);
    if (!player) return;

    const lobby = lobbies.get(player.lobby);
    if (!lobby) return;

    player.readyForNext = true;

    const allReady = lobby.players.every(playerWs => {
        const p = players.get(playerWs);
        return p && p.readyForNext === true;
    });

    if (allReady) {
        lobby.players.forEach(playerWs => {
            const p = players.get(playerWs);
            if (p) p.readyForNext = false;
        });

        if (lobby.currentRound >= 10) {
            endGame(player.lobby);
        } else {
            startNextRound(player.lobby);
        }
    }
}

function showRoundResults(lobbyId) {
    const lobby = lobbies.get(lobbyId);
    if (!lobby) return;

    const results = lobby.players.map(ws => {
        const p = players.get(ws);
        const answer = p.roundAnswers[lobby.currentRound - 1];

        return {
            playerId: p.id,
            playerName: p.name,
            totalScore: p.score,
            roundScore: answer.roundScore,
            guess: {
                lat: answer.guessLat,
                lng: answer.guessLng,
                year: answer.guessYear
            },
            distance: Math.round(answer.distance),
            yearError: answer.yearError
        };
    });

    broadcastToLobby(lobbyId, {
        type: 'round_results',
        results,
        correctAnswer: lobby.currentEvent
    });
}

async function endGame(lobbyId) {
    const lobby = lobbies.get(lobbyId);
    if (!lobby) return;

    const playerData = lobby.players.map(ws => {
        const p = players.get(ws);
        return { ws, ...p };
    });

    const finalScores = playerData
        .map(p => ({
            playerId: p.id,
            playerName: p.name,
            totalScore: p.score,
            userId: p.userId
        }))
        .sort((a, b) => b.totalScore - a.totalScore);

    // Calculate ELO changes if ranked game
    let eloChanges = null;
    if (lobby.isRanked && playerData.length === 2) {
        const p1 = playerData[0];
        const p2 = playerData[1];

        try {
            // Get current games played count
            const user1 = await userQueries.findById(p1.userId);
            const user2 = await userQueries.findById(p2.userId);

            eloChanges = calculateGameEloChanges(
                p1.elo, p2.elo,
                p1.score, p2.score,
                user1?.games_played || 0,
                user2?.games_played || 0
            );

            // Update ELOs in database
            await userQueries.updateElo(p1.userId, eloChanges.player1.newElo);
            await userQueries.updateElo(p2.userId, eloChanges.player2.newElo);

            // Determine winner
            const winnerId = p1.score > p2.score ? p1.userId : (p2.score > p1.score ? p2.userId : null);

            // Complete game record
            if (lobby.gameDbId) {
                await gameQueries.complete(
                    lobby.gameDbId,
                    p1.score, p2.score,
                    winnerId,
                    eloChanges.player1.newElo,
                    eloChanges.player2.newElo
                );
            }

            // Update user stats
            const p1RoundStats = calculateRoundStats(p1.roundAnswers);
            const p2RoundStats = calculateRoundStats(p2.roundAnswers);

            await statsQueries.updateAfterGame(p1.userId, p1.score, p1.score > p2.score, p1RoundStats);
            await statsQueries.updateAfterGame(p2.userId, p2.score, p2.score > p1.score, p2RoundStats);

        } catch (err) {
            console.error('Error updating game stats:', err);
        }
    }

    broadcastToLobby(lobbyId, {
        type: 'game_over',
        finalScores,
        eloChanges: eloChanges ? {
            player1: { change: eloChanges.player1.change, newElo: eloChanges.player1.newElo },
            player2: { change: eloChanges.player2.change, newElo: eloChanges.player2.newElo }
        } : null
    });

    // Clean up
    lobby.players.forEach(ws => players.delete(ws));
    lobbies.delete(lobbyId);
}

function calculateRoundStats(roundAnswers) {
    let totalScore = 0;
    let totalDistanceError = 0;
    let totalYearError = 0;
    let bestRoundScore = 0;

    for (const answer of roundAnswers) {
        if (answer) {
            totalScore += answer.roundScore || 0;
            totalDistanceError += answer.distance || 0;
            totalYearError += answer.yearError || 0;
            bestRoundScore = Math.max(bestRoundScore, answer.roundScore || 0);
        }
    }

    return {
        totalScore,
        totalDistanceError,
        totalYearError,
        roundCount: roundAnswers.filter(a => a).length,
        bestRoundScore
    };
}

// =============================================================================
// LEARNING MODE HANDLERS
// =============================================================================

// Store active learning sessions: ws -> { categoryKey, userId, currentEvent }
const learningSessions = new Map();

// Start a learning session
async function handleLearningStart(ws, message) {
    const { categoryKey } = message;
    const userId = ws.auth?.userId;

    console.log('Learning start:', { categoryKey, userId, isGuest: ws.auth?.isGuest });

    if (!userId || ws.auth?.isGuest) {
        ws.send(JSON.stringify({ type: 'error', message: 'Must be logged in (not guest) for learning mode' }));
        return;
    }

    if (!categories[categoryKey]) {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid category' }));
        return;
    }

    // Get user's progress for this category
    let progressRecords = [];
    try {
        progressRecords = await learningQueries.getProgressByCategory(userId, categoryKey);
    } catch (err) {
        console.error('Failed to get learning progress:', err);
    }

    // Calculate stats
    const allEvents = categories[categoryKey].events;
    const stats = {
        totalEvents: allEvents.length,
        seen: progressRecords.length,
        mastered: progressRecords.filter(r => r.repetitions >= 3 && parseFloat(r.ease_factor) >= 2.5).length,
        due: progressRecords.filter(r => new Date(r.next_review) <= new Date()).length,
        categoryLearnedness: sm2.calculateCategoryLearnedness(allEvents, progressRecords)
    };

    // Store session
    learningSessions.set(ws, {
        categoryKey,
        userId,
        currentEvent: null,
        progressRecords
    });

    ws.send(JSON.stringify({
        type: 'learning_started',
        categoryKey,
        category: categories[categoryKey],
        stats
    }));
}

// Get next event for learning
async function handleLearningNext(ws, message) {
    const session = learningSessions.get(ws);

    if (!session) {
        ws.send(JSON.stringify({ type: 'error', message: 'No active learning session' }));
        return;
    }

    const { categoryKey, userId } = session;
    const allEvents = categories[categoryKey].events;

    // Refresh progress records
    let progressRecords = [];
    try {
        progressRecords = await learningQueries.getProgressByCategory(userId, categoryKey);
        session.progressRecords = progressRecords;
    } catch (err) {
        console.error('Failed to get learning progress:', err);
    }

    // Select next event using SM-2 algorithm
    const selection = sm2.selectNextEvent(allEvents, progressRecords);

    if (!selection || !selection.event) {
        ws.send(JSON.stringify({ type: 'error', message: 'No events available' }));
        return;
    }

    session.currentEvent = selection.event;
    const learnedness = sm2.calculateLearnedness(selection.progress);

    ws.send(JSON.stringify({
        type: 'learning_event',
        event: {
            name: selection.event.name,
            // Don't send location/year yet - that's the answer!
        },
        progress: selection.progress ? {
            repetitions: selection.progress.repetitions,
            easeFactor: parseFloat(selection.progress.ease_factor),
            lastQuality: selection.progress.last_quality,
            totalAttempts: selection.progress.total_attempts
        } : null,
        learnedness,
        category: {
            timelineMin: categories[categoryKey].timelineMin,
            timelineMax: categories[categoryKey].timelineMax,
            mapCenter: categories[categoryKey].mapCenter,
            mapZoom: categories[categoryKey].mapZoom
        }
    }));
}

// Submit learning answer
async function handleLearningSubmit(ws, message) {
    console.log('Learning submit received:', message);
    const session = learningSessions.get(ws);

    if (!session || !session.currentEvent) {
        console.log('No active session or event:', { session: !!session, currentEvent: session?.currentEvent });
        ws.send(JSON.stringify({ type: 'error', message: 'No active learning event' }));
        return;
    }

    const { categoryKey, userId, currentEvent } = session;
    const { guessLat, guessLng, guessYear } = message;

    // Calculate errors
    const distanceKm = calculateDistance(guessLat, guessLng, currentEvent.lat, currentEvent.lng);
    const yearError = Math.abs(guessYear - currentEvent.year);

    // Calculate quality for SM-2 (0-5)
    const quality = sm2.calculateQuality(yearError, distanceKm);

    // Get current progress
    let currentProgress = null;
    try {
        currentProgress = await learningQueries.getEventProgress(userId, categoryKey, currentEvent.name);
    } catch (err) {
        console.error('Failed to get event progress:', err);
    }

    // Calculate next review parameters
    const nextParams = sm2.calculateNextReview(currentProgress, quality);

    // Save progress to database
    try {
        await learningQueries.upsertProgress(
            userId,
            categoryKey,
            currentEvent.name,
            quality,
            yearError,
            distanceKm,
            nextParams.ease_factor,
            nextParams.interval_days,
            nextParams.repetitions,
            nextParams.next_review
        );
    } catch (err) {
        console.error('Failed to save learning progress:', err);
    }

    // Calculate learnedness for display
    const learnedness = sm2.calculateLearnedness({
        ease_factor: nextParams.ease_factor,
        repetitions: nextParams.repetitions
    });

    // Get updated stats
    let stats = { totalEvents: 0, seen: 0, mastered: 0, due: 0, categoryLearnedness: 0 };
    try {
        const progressRecords = await learningQueries.getProgressByCategory(userId, categoryKey);
        const allEvents = categories[categoryKey].events;
        stats = {
            totalEvents: allEvents.length,
            seen: progressRecords.length,
            mastered: progressRecords.filter(r => r.repetitions >= 3 && parseFloat(r.ease_factor) >= 2.5).length,
            due: progressRecords.filter(r => new Date(r.next_review) <= new Date()).length,
            categoryLearnedness: sm2.calculateCategoryLearnedness(allEvents, progressRecords)
        };
    } catch (err) {
        console.error('Failed to get updated stats:', err);
    }

    // Send result with correct answer
    console.log('Sending learning_result:', { distanceKm: Math.round(distanceKm), yearError, quality });
    ws.send(JSON.stringify({
        type: 'learning_result',
        correct: {
            lat: currentEvent.lat,
            lng: currentEvent.lng,
            year: currentEvent.year,
            location: currentEvent.location
        },
        guess: {
            lat: guessLat,
            lng: guessLng,
            year: guessYear
        },
        distanceKm: Math.round(distanceKm),
        yearError,
        quality,
        learnedness,
        nextReview: {
            days: nextParams.interval_days,
            date: nextParams.next_review
        },
        stats
    }));
    console.log('Learning result sent successfully');

    // Clear current event
    session.currentEvent = null;
}

// Clean up learning session on disconnect
function cleanupLearningSession(ws) {
    learningSessions.delete(ws);
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function calculateScore(distanceKm, yearError, timeLeft) {
    const maxDistance = 20000;
    const distanceScore = Math.max(0, 497.5 * (1 - distanceKm / maxDistance));

    const maxYearError = 2000;
    const yearScore = Math.max(0, 497.5 * (1 - Math.abs(yearError) / maxYearError));

    const speedBonus = Math.max(0, 5 * (timeLeft / 30));

    return Math.round(distanceScore + yearScore + speedBonus);
}

// =============================================================================
// START SERVER
// =============================================================================

const PORT = process.env.PORT || 3001;
const HOST = '0.0.0.0';
server.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
