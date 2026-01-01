// ELO calculation utilities

/**
 * Calculate ELO change after a game
 * @param {number} playerElo - Current player ELO
 * @param {number} opponentElo - Opponent's ELO
 * @param {boolean} won - Whether the player won
 * @param {number} gamesPlayed - Number of games the player has played
 * @returns {{ newElo: number, change: number }}
 */
function calculateEloChange(playerElo, opponentElo, won, gamesPlayed) {
    // K-factor: 32 for new players (< 30 games), 16 for established
    const K = gamesPlayed < 30 ? 32 : 16;

    // Expected score using ELO formula
    const expectedScore = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));

    // Actual score: 1 for win, 0 for loss
    const actualScore = won ? 1 : 0;

    // Calculate ELO change
    const change = Math.round(K * (actualScore - expectedScore));

    return {
        newElo: playerElo + change,
        change: change
    };
}

/**
 * Calculate ELO changes for both players after a game
 * @param {number} player1Elo
 * @param {number} player2Elo
 * @param {number} player1Score
 * @param {number} player2Score
 * @param {number} player1GamesPlayed
 * @param {number} player2GamesPlayed
 * @returns {{ player1: { newElo, change }, player2: { newElo, change } }}
 */
function calculateGameEloChanges(player1Elo, player2Elo, player1Score, player2Score, player1GamesPlayed, player2GamesPlayed) {
    const player1Won = player1Score > player2Score;
    const player2Won = player2Score > player1Score;

    // In case of tie, both get 0 change
    if (player1Score === player2Score) {
        return {
            player1: { newElo: player1Elo, change: 0 },
            player2: { newElo: player2Elo, change: 0 }
        };
    }

    const player1Result = calculateEloChange(player1Elo, player2Elo, player1Won, player1GamesPlayed);
    const player2Result = calculateEloChange(player2Elo, player1Elo, player2Won, player2GamesPlayed);

    return {
        player1: player1Result,
        player2: player2Result
    };
}

module.exports = {
    calculateEloChange,
    calculateGameEloChanges
};
