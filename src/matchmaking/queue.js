// ELO-based matchmaking with lobby system

class MatchmakingQueue {
    constructor() {
        // Lobby by category: categoryKey -> [{ ws, userId, elo, isGuest, username, avatarUrl, ready, joinedAt }]
        this.lobbies = new Map();

        // Pending invites: userId -> { from, to, categoryKey, timestamp }
        this.pendingInvites = new Map();

        // ELO range expansion settings (for auto-matching ready players)
        this.initialRange = 100;
        this.expansionRate = 50;
        this.expansionInterval = 5000;
        this.maxRange = 500;

        // Invite expiration
        this.inviteExpiration = 60000; // 60 seconds

        // Start periodic queue processing
        this.startQueueProcessor();
    }

    /**
     * Add a player to the lobby (not ready by default)
     */
    addToLobby(categoryKey, ws, userId, elo, isGuest, username, avatarUrl = null) {
        if (!this.lobbies.has(categoryKey)) {
            this.lobbies.set(categoryKey, []);
        }

        const lobby = this.lobbies.get(categoryKey);

        // Remove any existing entries for this user (handles reconnects/refreshes)
        // Also remove stale entries with closed WebSockets
        for (let i = lobby.length - 1; i >= 0; i--) {
            const p = lobby[i];
            if (p.userId === userId || p.ws.readyState !== 1) { // 1 = OPEN
                lobby.splice(i, 1);
            }
        }

        const player = {
            ws,
            userId,
            elo: isGuest ? 1000 : elo,
            isGuest,
            username,
            avatarUrl,
            ready: false,
            readyAt: null,
            joinedAt: Date.now()
        };

        lobby.push(player);
        return player;
    }

    /**
     * Remove a player from the lobby
     */
    removeFromLobby(ws) {
        for (const [categoryKey, lobby] of this.lobbies) {
            const idx = lobby.findIndex(p => p.ws === ws);
            if (idx !== -1) {
                const player = lobby[idx];
                lobby.splice(idx, 1);
                // Cancel any pending invites
                this.cancelInvitesForPlayer(player.userId);
                return { categoryKey, player };
            }
        }
        return null;
    }

    /**
     * Toggle ready status for a player
     */
    setReady(ws, ready) {
        for (const [categoryKey, lobby] of this.lobbies) {
            const player = lobby.find(p => p.ws === ws);
            if (player) {
                player.ready = ready;
                player.readyAt = ready ? Date.now() : null;

                // If becoming ready, try to find a match
                if (ready) {
                    const match = this.findMatchForReadyPlayer(categoryKey, player);
                    if (match) {
                        return { categoryKey, match };
                    }
                }
                return { categoryKey, match: null };
            }
        }
        return null;
    }

    /**
     * Find a match for a newly ready player
     */
    findMatchForReadyPlayer(categoryKey, player) {
        const lobby = this.lobbies.get(categoryKey);
        if (!lobby) return null;

        // Get other ready players
        const readyPlayers = lobby.filter(p => p !== player && p.ready);
        if (readyPlayers.length === 0) return null;

        const waitTime = 0; // Just became ready
        const currentRange = this.calculateCurrentRange(waitTime);

        // Find opponent within range
        const candidates = readyPlayers
            .filter(p => {
                if (player.isGuest || p.isGuest) return true;
                return Math.abs(p.elo - player.elo) <= currentRange;
            })
            .sort((a, b) => {
                // Prefer non-guests, then by ELO closeness
                if (a.isGuest && !b.isGuest) return 1;
                if (!a.isGuest && b.isGuest) return -1;
                if (a.isGuest && b.isGuest) return a.readyAt - b.readyAt;
                return Math.abs(a.elo - player.elo) - Math.abs(b.elo - player.elo);
            });

        if (candidates.length > 0) {
            const opponent = candidates[0];
            // Remove both from lobby
            this.removePlayerFromLobby(categoryKey, player);
            this.removePlayerFromLobby(categoryKey, opponent);
            return { player1: player, player2: opponent };
        }

        return null;
    }

    /**
     * Remove specific player from lobby
     */
    removePlayerFromLobby(categoryKey, player) {
        const lobby = this.lobbies.get(categoryKey);
        if (lobby) {
            const idx = lobby.indexOf(player);
            if (idx !== -1) {
                lobby.splice(idx, 1);
            }
        }
    }

    /**
     * Send an invite from one player to another
     */
    sendInvite(categoryKey, fromWs, toUserId) {
        const lobby = this.lobbies.get(categoryKey);
        if (!lobby) return { success: false, error: 'Lobby not found' };

        const fromPlayer = lobby.find(p => p.ws === fromWs);
        const toPlayer = lobby.find(p => p.userId === toUserId);

        if (!fromPlayer) return { success: false, error: 'You are not in the lobby' };
        if (!toPlayer) return { success: false, error: 'Player not found in lobby' };
        if (fromPlayer === toPlayer) return { success: false, error: 'Cannot invite yourself' };

        // Check if invite already exists
        const inviteKey = `${fromPlayer.userId}-${toUserId}`;
        if (this.pendingInvites.has(inviteKey)) {
            return { success: false, error: 'Invite already sent' };
        }

        const invite = {
            from: fromPlayer,
            to: toPlayer,
            categoryKey,
            timestamp: Date.now()
        };

        this.pendingInvites.set(inviteKey, invite);

        // Notify the target player
        try {
            toPlayer.ws.send(JSON.stringify({
                type: 'game_invite',
                from: {
                    userId: fromPlayer.userId,
                    username: fromPlayer.username,
                    elo: fromPlayer.elo,
                    avatarUrl: fromPlayer.avatarUrl
                }
            }));
        } catch (e) {
            this.pendingInvites.delete(inviteKey);
            return { success: false, error: 'Failed to send invite' };
        }

        return { success: true, invite };
    }

    /**
     * Accept an invite
     */
    acceptInvite(categoryKey, acceptingWs, fromUserId) {
        const lobby = this.lobbies.get(categoryKey);
        if (!lobby) return { success: false, error: 'Lobby not found' };

        const acceptingPlayer = lobby.find(p => p.ws === acceptingWs);
        const invitingPlayer = lobby.find(p => p.userId === fromUserId);

        if (!acceptingPlayer || !invitingPlayer) {
            return { success: false, error: 'Player not found' };
        }

        const inviteKey = `${fromUserId}-${acceptingPlayer.userId}`;
        const invite = this.pendingInvites.get(inviteKey);

        if (!invite) {
            return { success: false, error: 'Invite not found or expired' };
        }

        // Check if invite expired
        if (Date.now() - invite.timestamp > this.inviteExpiration) {
            this.pendingInvites.delete(inviteKey);
            return { success: false, error: 'Invite expired' };
        }

        // Remove both from lobby and start game
        this.removePlayerFromLobby(categoryKey, acceptingPlayer);
        this.removePlayerFromLobby(categoryKey, invitingPlayer);
        this.pendingInvites.delete(inviteKey);

        return {
            success: true,
            match: { player1: invitingPlayer, player2: acceptingPlayer }
        };
    }

    /**
     * Decline an invite
     */
    declineInvite(categoryKey, decliningWs, fromUserId) {
        const lobby = this.lobbies.get(categoryKey);
        if (!lobby) return { success: false };

        const decliningPlayer = lobby.find(p => p.ws === decliningWs);
        if (!decliningPlayer) return { success: false };

        const inviteKey = `${fromUserId}-${decliningPlayer.userId}`;
        const invite = this.pendingInvites.get(inviteKey);

        if (invite) {
            this.pendingInvites.delete(inviteKey);

            // Notify the inviting player
            try {
                invite.from.ws.send(JSON.stringify({
                    type: 'invite_declined',
                    by: {
                        userId: decliningPlayer.userId,
                        username: decliningPlayer.username
                    }
                }));
            } catch (e) {
                // Ignore send errors
            }
        }

        return { success: true };
    }

    /**
     * Cancel all invites for a player
     */
    cancelInvitesForPlayer(userId) {
        for (const [key, invite] of this.pendingInvites) {
            if (invite.from.userId === userId || invite.to.userId === userId) {
                this.pendingInvites.delete(key);
            }
        }
    }

    /**
     * Calculate current ELO range based on wait time
     */
    calculateCurrentRange(waitTime) {
        const expansions = Math.floor(waitTime / this.expansionInterval);
        return Math.min(
            this.initialRange + (expansions * this.expansionRate),
            this.maxRange
        );
    }

    /**
     * Process ready players periodically to find matches
     */
    startQueueProcessor() {
        setInterval(() => {
            for (const [categoryKey, lobby] of this.lobbies) {
                // Clean up stale WebSocket connections first
                let needsBroadcast = false;
                for (let i = lobby.length - 1; i >= 0; i--) {
                    if (lobby[i].ws.readyState !== 1) { // 1 = OPEN
                        lobby.splice(i, 1);
                        needsBroadcast = true;
                    }
                }

                // Broadcast if we cleaned up stale connections
                if (needsBroadcast) {
                    this.broadcastLobbyUpdate(categoryKey);
                }

                // Get ready players
                const readyPlayers = lobby.filter(p => p.ready);
                if (readyPlayers.length < 2) continue;

                const matches = [];
                const matched = new Set();

                // Sort by ready time (longest waiting first)
                const sorted = [...readyPlayers].sort((a, b) => a.readyAt - b.readyAt);

                for (const player of sorted) {
                    if (matched.has(player)) continue;

                    const match = this.findMatchAmongReady(categoryKey, player, matched);
                    if (match) {
                        matches.push(match);
                        matched.add(match.player1);
                        matched.add(match.player2);
                    }
                }

                // Emit matches
                for (const match of matches) {
                    if (this.onMatch) {
                        this.onMatch(categoryKey, match);
                    }
                }
            }

            // Clean up expired invites
            const now = Date.now();
            for (const [key, invite] of this.pendingInvites) {
                if (now - invite.timestamp > this.inviteExpiration) {
                    this.pendingInvites.delete(key);
                }
            }
        }, 2000);
    }

    /**
     * Find match among ready players excluding already matched
     */
    findMatchAmongReady(categoryKey, player, excludeSet) {
        const lobby = this.lobbies.get(categoryKey);
        if (!lobby) return null;

        const waitTime = Date.now() - player.readyAt;
        const currentRange = this.calculateCurrentRange(waitTime);

        const candidates = lobby
            .filter(p => p !== player && p.ready && !excludeSet.has(p))
            .filter(p => {
                if (player.isGuest || p.isGuest) return true;
                return Math.abs(p.elo - player.elo) <= currentRange;
            })
            .sort((a, b) => {
                if (player.isGuest) return 0;
                if (a.isGuest && !b.isGuest) return 1;
                if (!a.isGuest && b.isGuest) return -1;
                return Math.abs(a.elo - player.elo) - Math.abs(b.elo - player.elo);
            });

        if (candidates.length > 0) {
            const opponent = candidates[0];
            this.removePlayerFromLobby(categoryKey, player);
            this.removePlayerFromLobby(categoryKey, opponent);
            return { player1: player, player2: opponent };
        }

        return null;
    }

    /**
     * Set callback for when a match is found
     */
    setMatchCallback(callback) {
        this.onMatch = callback;
    }

    /**
     * Get all players in a category lobby for broadcasting (sorted by ELO)
     */
    getPlayersInLobby(categoryKey) {
        const lobby = this.lobbies.get(categoryKey);
        if (!lobby) return [];

        return lobby
            .map(p => ({
                userId: p.userId,
                username: p.username,
                elo: p.elo || 1000,
                isGuest: p.isGuest,
                avatarUrl: p.avatarUrl || null,
                ready: p.ready
            }))
            .sort((a, b) => b.elo - a.elo); // Sort by ELO descending
    }

    /**
     * Broadcast player list to all players in a category lobby
     */
    broadcastLobbyUpdate(categoryKey) {
        const lobby = this.lobbies.get(categoryKey);
        if (!lobby) return;

        const players = this.getPlayersInLobby(categoryKey);
        const readyCount = players.filter(p => p.ready).length;

        for (const player of lobby) {
            try {
                player.ws.send(JSON.stringify({
                    type: 'lobby_players',
                    players,
                    readyCount,
                    totalCount: players.length
                }));
            } catch (e) {
                // WebSocket might be closed
            }
        }
    }

    /**
     * Get lobby size
     */
    getLobbySize(categoryKey) {
        const lobby = this.lobbies.get(categoryKey);
        return lobby ? lobby.length : 0;
    }

    /**
     * Get ready count
     */
    getReadyCount(categoryKey) {
        const lobby = this.lobbies.get(categoryKey);
        return lobby ? lobby.filter(p => p.ready).length : 0;
    }

    /**
     * Find player by WebSocket
     */
    findPlayerByWs(ws) {
        for (const [categoryKey, lobby] of this.lobbies) {
            const player = lobby.find(p => p.ws === ws);
            if (player) {
                return { categoryKey, player };
            }
        }
        return null;
    }

    /**
     * Find player by userId in a category
     */
    findPlayerById(categoryKey, userId) {
        const lobby = this.lobbies.get(categoryKey);
        if (!lobby) return null;
        return lobby.find(p => p.userId === userId);
    }

    /**
     * Get category key for a player
     */
    getCategoryForPlayer(ws) {
        for (const [categoryKey, lobby] of this.lobbies) {
            if (lobby.find(p => p.ws === ws)) {
                return categoryKey;
            }
        }
        return null;
    }

    // Legacy compatibility
    removePlayer(ws) {
        return this.removeFromLobby(ws);
    }

    getQueueSize(categoryKey) {
        return this.getReadyCount(categoryKey);
    }
}

module.exports = MatchmakingQueue;
