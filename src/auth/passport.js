const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const DiscordStrategy = require('passport-discord').Strategy;
const { userQueries } = require('../db/queries');

function initializePassport() {
    // Serialize user ID to session
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    // Deserialize user from session
    passport.deserializeUser(async (id, done) => {
        try {
            const user = await userQueries.findById(id);
            done(null, user);
        } catch (err) {
            done(err, null);
        }
    });

    // Google OAuth Strategy
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
        const googleCallbackURL = process.env.NODE_ENV === 'production'
            ? 'https://timelinegame.fly.dev/auth/google/callback'
            : '/auth/google/callback';
        passport.use(new GoogleStrategy({
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: googleCallbackURL,
            scope: ['profile', 'email']
        }, async (accessToken, refreshToken, profile, done) => {
            try {
                // Check if user exists
                let user = await userQueries.findByOAuth('google', profile.id);

                if (!user) {
                    // Create new user
                    const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
                    const avatar = profile.photos && profile.photos[0] ? profile.photos[0].value : null;
                    const username = profile.displayName.replace(/\s+/g, '_').substring(0, 50) || `User_${profile.id.substring(0, 8)}`;

                    user = await userQueries.createFromOAuth(
                        'google',
                        profile.id,
                        username,
                        profile.displayName,
                        email,
                        avatar
                    );
                }

                done(null, user);
            } catch (err) {
                done(err, null);
            }
        }));
    }

    // Discord OAuth Strategy
    if (process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET) {
        const discordCallbackURL = process.env.NODE_ENV === 'production'
            ? 'https://timelinegame.fly.dev/auth/discord/callback'
            : '/auth/discord/callback';
        passport.use(new DiscordStrategy({
            clientID: process.env.DISCORD_CLIENT_ID,
            clientSecret: process.env.DISCORD_CLIENT_SECRET,
            callbackURL: discordCallbackURL,
            scope: ['identify', 'email']
        }, async (accessToken, refreshToken, profile, done) => {
            try {
                // Check if user exists
                let user = await userQueries.findByOAuth('discord', profile.id);

                if (!user) {
                    // Create new user
                    const email = profile.email || null;
                    const avatar = profile.avatar
                        ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
                        : null;
                    const username = profile.username.substring(0, 50) || `User_${profile.id.substring(0, 8)}`;

                    user = await userQueries.createFromOAuth(
                        'discord',
                        profile.id,
                        username,
                        profile.global_name || profile.username,
                        email,
                        avatar
                    );
                }

                done(null, user);
            } catch (err) {
                done(err, null);
            }
        }));
    }

    return passport;
}

module.exports = { initializePassport, passport };
