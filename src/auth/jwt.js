const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sessionQueries } = require('../db/queries');

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

/**
 * Generate access token
 */
function generateAccessToken(user) {
    return jwt.sign(
        {
            sub: user.id,
            username: user.username,
            displayName: user.display_name,
            elo: user.elo_rating,
            isGuest: user.is_guest,
            avatarUrl: user.avatar_url,
            needsUsername: !user.is_guest && !user.username_customized
        },
        process.env.JWT_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRY }
    );
}

/**
 * Generate refresh token and store session in database
 */
async function generateRefreshToken(user) {
    const refreshToken = crypto.randomBytes(32).toString('hex');
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);

    const session = await sessionQueries.create(user.id, refreshTokenHash, expiresAt);

    // Return token with session ID embedded
    const token = jwt.sign(
        {
            sub: user.id,
            sessionId: session.id
        },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: REFRESH_TOKEN_EXPIRY }
    );

    return { token, sessionId: session.id };
}

/**
 * Verify access token
 */
function verifyAccessToken(token) {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        return null;
    }
}

/**
 * Verify refresh token and check session is valid
 */
async function verifyRefreshToken(token) {
    try {
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        const session = await sessionQueries.findById(decoded.sessionId);

        if (!session) {
            return null;
        }

        return { userId: decoded.sub, sessionId: decoded.sessionId };
    } catch (err) {
        return null;
    }
}

/**
 * Invalidate a session (logout)
 */
async function invalidateSession(sessionId) {
    await sessionQueries.delete(sessionId);
}

/**
 * Invalidate all sessions for a user
 */
async function invalidateAllSessions(userId) {
    await sessionQueries.deleteAllForUser(userId);
}

/**
 * Express middleware to verify JWT from Authorization header
 */
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);

    if (!decoded) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = decoded;
    next();
}

/**
 * Optional auth middleware - doesn't fail if no token
 */
function optionalAuthMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const decoded = verifyAccessToken(token);
        if (decoded) {
            req.user = decoded;
        }
    }

    next();
}

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
    invalidateSession,
    invalidateAllSessions,
    authMiddleware,
    optionalAuthMiddleware
};
