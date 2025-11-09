// Multiplayer WebSocket client
let ws = null;
let isMultiplayer = false;
let currentPlayerId = null;
let opponentData = null;

// Connect to WebSocket server
function connectToServer() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const port = window.location.port || 3000;

    ws = new WebSocket(`${protocol}//${host}:${port}`);

    ws.onopen = () => {
        console.log('Connected to server');
    };

    ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        handleServerMessage(message);
    };

    ws.onclose = () => {
        console.log('Disconnected from server');
        // Try to reconnect after 3 seconds
        if (isMultiplayer) {
            setTimeout(connectToServer, 3000);
        }
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };
}

// Handle messages from server
function handleServerMessage(message) {
    switch (message.type) {
        case 'lobby_update':
            handleLobbyUpdate(message);
            break;
        case 'game_starting':
            handleGameStarting();
            break;
        case 'prepare_round':
            handlePrepareRound(message);
            break;
        case 'round_start':
            handleRoundStart(message);
            break;
        case 'answer_received':
            handleAnswerReceived(message);
            break;
        case 'round_results':
            handleRoundResults(message);
            break;
        case 'game_over':
            handleGameOver(message);
            break;
    }
}

// Send message to server
function sendToServer(message) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
    }
}

// Join a lobby
function joinLobby(categoryKey, playerName) {
    isMultiplayer = true;
    sendToServer({
        type: 'join_lobby',
        categoryKey,
        playerName: playerName || `Player_${Math.floor(Math.random() * 1000)}`
    });

    // Show lobby screen
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('lobby-screen').classList.remove('hidden');
    document.getElementById('lobby-category-name').textContent = selectedCategory.name;
}

// Leave lobby
function leaveLobby() {
    sendToServer({ type: 'leave_lobby' });
    isMultiplayer = false;

    // Return to start screen
    document.getElementById('lobby-screen').classList.add('hidden');
    document.getElementById('start-screen').classList.remove('hidden');
}

// Handle lobby update
function handleLobbyUpdate(message) {
    const { status, players, currentRound } = message;

    // Store our player ID if we don't have it yet
    if (!currentPlayerId && players.length > 0) {
        // Assume we're the last player who joined
        currentPlayerId = players[players.length - 1].id;
    }

    // Update player list
    const playerList = document.getElementById('lobby-player-list');
    playerList.innerHTML = '';

    players.forEach(player => {
        const playerItem = document.createElement('div');
        playerItem.className = 'player-item';
        const isMe = player.id === currentPlayerId ? ' (You)' : '';
        playerItem.innerHTML = `
            <div class="player-name">${player.name}${isMe}</div>
            <div class="player-score">${player.score}</div>
        `;
        playerList.appendChild(playerItem);
    });

    // Update status
    if (status === 'waiting') {
        document.getElementById('lobby-status-text').textContent = 'Waiting for Players';
        document.getElementById('lobby-status-detail').textContent = `${players.length}/2 players joined. Match starts when 2 players join.`;
        document.getElementById('waiting-animation').style.display = 'block';
    } else if (status === 'playing') {
        document.getElementById('lobby-status-text').textContent = 'Match in Progress';
        document.getElementById('lobby-status-detail').textContent = `Round ${currentRound}/10`;
        document.getElementById('waiting-animation').style.display = 'none';
    }
}

// Handle game starting
function handleGameStarting() {
    // Hide lobby, show game
    document.getElementById('lobby-screen').classList.add('hidden');
    gameStarted = true;

    // Reset scores
    totalScore = 0;
    document.getElementById('current-score').textContent = 0;
}

// Handle prepare round (receive event, wait for both players to be ready)
function handlePrepareRound(message) {
    const { round, event } = message;
    currentRound = round;
    currentEvent = event; // Use the server's event

    // Remove waiting overlay if it exists
    const waitingOverlay = document.getElementById('waiting-overlay');
    if (waitingOverlay) {
        waitingOverlay.remove();
    }

    // Show a ready screen
    showReadyScreen();
}

// Show ready screen
function showReadyScreen() {
    const readyOverlay = document.createElement('div');
    readyOverlay.id = 'ready-overlay';
    readyOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.95);
        z-index: 5000;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        color: white;
    `;

    readyOverlay.innerHTML = `
        <div style="font-size: 48px; font-weight: 700; text-transform: uppercase; margin-bottom: 40px;">Round ${currentRound}</div>
        <div style="font-size: 32px; font-weight: 700; color: #ff0000; margin-bottom: 60px;">${currentEvent.name}</div>
        <button id="ready-btn" style="
            padding: 20px 60px;
            background: #ff0000;
            color: white;
            border: none;
            font-size: 18px;
            font-weight: 700;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            cursor: pointer;
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        ">I'm Ready</button>
        <div id="waiting-text" style="
            margin-top: 30px;
            font-size: 16px;
            color: #666;
            display: none;
        ">Waiting for opponent...</div>
    `;

    document.body.appendChild(readyOverlay);

    document.getElementById('ready-btn').addEventListener('click', function() {
        this.disabled = true;
        this.style.opacity = '0.5';
        document.getElementById('waiting-text').style.display = 'block';

        // Tell server we're ready
        sendToServer({ type: 'ready_for_round' });
    });
}

// Handle round start (both players are ready, timer starts now)
function handleRoundStart(message) {
    // Remove ready overlay
    const overlay = document.getElementById('ready-overlay');
    if (overlay) {
        overlay.remove();
    }

    // Start the round normally
    startMultiplayerRound();
}

// Start a multiplayer round (similar to startRound but without incrementing)
function startMultiplayerRound() {
    // Reset state
    guessLatLng = null;
    hideTimeline();
    hideResults();

    // Clear markers
    if (userMarker) {
        map.removeLayer(userMarker);
        userMarker = null;
    }
    if (correctMarker) {
        map.removeLayer(correctMarker);
        correctMarker = null;
    }

    // Clear any polylines and opponent markers
    map.eachLayer((layer) => {
        if (layer instanceof L.Polyline || layer.options.isOpponentMarker) {
            map.removeLayer(layer);
        }
    });

    // Reset map view to category-specific bounds
    const category = selectedCategory;
    map.setView(category.mapCenter, category.mapZoom);

    // currentEvent is already set by server in handlePrepareRound

    // Update UI
    document.getElementById('current-round').textContent = currentRound;
    document.getElementById('event-text').textContent = currentEvent.name;

    // Update timeline range based on category
    const timelineEl = document.getElementById('timeline');
    timelineEl.min = category.timelineMin;
    timelineEl.max = category.timelineMax;

    // Reset timeline to middle of category range
    const midYear = Math.floor((category.timelineMin + category.timelineMax) / 2);
    timelineEl.value = midYear;
    document.getElementById('year-display').textContent = formatYear(midYear);

    // Update timeline tick marks
    updateTimelineTicks(category.timelineMin, category.timelineMax);

    // Start timer
    startTimer();
}

// Handle answer received (from server)
function handleAnswerReceived(message) {
    // Server has processed our answer
    // We'll show results when round_results comes
}

// Handle round results
function handleRoundResults(message) {
    const { results } = message;

    console.log('Round results received:', results);
    console.log('My player ID:', currentPlayerId);

    // Update total score from server
    const myResult = results.find(r => r.playerId === currentPlayerId);
    if (myResult) {
        totalScore = myResult.totalScore;
        document.getElementById('current-score').textContent = totalScore;
        console.log('My result:', myResult);
    }

    // Find opponent
    opponentData = results.find(r => r.playerId !== currentPlayerId);
    console.log('Opponent data:', opponentData);

    // Remove any existing opponent results first
    const existingOpponentResults = document.getElementById('opponent-results');
    if (existingOpponentResults) {
        existingOpponentResults.remove();
    }

    // Show opponent's guess on map
    if (opponentData && opponentData.guess) {
        const opponentMarker = L.marker([opponentData.guess.lat, opponentData.guess.lng], {
            icon: L.divIcon({
                className: 'opponent-marker',
                html: '<div style="background: #0066ff; width: 16px; height: 16px; border: 3px solid #000000;"></div>',
                iconSize: [16, 16],
                iconAnchor: [8, 8]
            }),
            isOpponentMarker: true
        }).addTo(map);

        // Draw opponent's line
        L.polyline([[opponentData.guess.lat, opponentData.guess.lng], [currentEvent.lat, currentEvent.lng]], {
            color: '#0066ff',
            weight: 2,
            opacity: 0.7,
            dashArray: '8, 8'
        }).addTo(map);
    }

    // Add opponent info to results display
    if (opponentData) {
        const resultsContent = document.querySelector('.results-content');
        if (resultsContent) {
            // Add opponent comparison BEFORE the Continue button
            const opponentHTML = `
                <div id="opponent-results" style="border-top: 2px solid #000; margin-top: 24px; padding-top: 24px;">
                    <div class="result-item">
                        <span class="result-label">Opponent</span>
                        <span class="result-value">${opponentData.playerName}</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Their Distance</span>
                        <span class="result-value">${opponentData.distance} km</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Their Time Error</span>
                        <span class="result-value">${opponentData.yearError} years</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Their Round Score</span>
                        <span class="result-value highlight">${opponentData.roundScore}</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Their Total Score</span>
                        <span class="result-value highlight">${opponentData.totalScore}</span>
                    </div>
                </div>
            `;
            // Insert before the button to avoid destroying event listeners
            const nextBtn = document.getElementById('next-btn');
            nextBtn.insertAdjacentHTML('beforebegin', opponentHTML);
        }
    }
}

// Override submitAnswer for multiplayer
const originalSubmitAnswer = submitAnswer;
function submitAnswerMultiplayer() {
    if (!isMultiplayer) {
        originalSubmitAnswer();
        return;
    }

    clearInterval(timerInterval);

    const guessedYear = parseInt(document.getElementById('timeline').value);

    // Send answer to server
    sendToServer({
        type: 'submit_answer',
        guessLat: guessLatLng.lat,
        guessLng: guessLatLng.lng,
        guessYear: guessedYear,
        timeLeft: timeLeft
    });

    // Show visual feedback locally
    const correctYear = currentEvent.year;
    const yearError = Math.abs(guessedYear - correctYear);

    const distance = calculateDistance(
        guessLatLng.lat,
        guessLatLng.lng,
        currentEvent.lat,
        currentEvent.lng
    );

    let roundScore = calculateScore(distance, yearError, timeLeft);
    if (timeLeft <= 0) {
        roundScore -= 50;
    }

    // Show correct location
    if (correctMarker) {
        map.removeLayer(correctMarker);
    }

    correctMarker = L.marker([currentEvent.lat, currentEvent.lng], {
        icon: L.divIcon({
            className: 'correct-marker',
            html: '<div style="background: #ffffff; width: 16px; height: 16px; border: 3px solid #000000;"></div>',
            iconSize: [16, 16],
            iconAnchor: [8, 8]
        })
    }).addTo(map);

    // Draw line
    L.polyline([guessLatLng, [currentEvent.lat, currentEvent.lng]], {
        color: '#ff0000',
        weight: 2,
        opacity: 1,
        dashArray: '8, 8'
    }).addTo(map);

    map.fitBounds([
        guessLatLng,
        [currentEvent.lat, currentEvent.lng]
    ], { padding: [50, 50] });

    // Show results
    showResults(distance, yearError, roundScore, correctYear);
}

// Override the next round handler for multiplayer - attach immediately when this script loads
(function() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', attachMultiplayerNextHandler);
    } else {
        attachMultiplayerNextHandler();
    }
})();

function attachMultiplayerNextHandler() {
    const nextBtn = document.getElementById('next-btn');
    if (!nextBtn) {
        console.error('Next button not found!');
        return;
    }

    // Add our handler
    nextBtn.addEventListener('click', function() {
        console.log('Next button clicked, isMultiplayer:', isMultiplayer);

        if (!isMultiplayer) {
            return; // Let the original handler run
        }

        hideResults();

        // Tell server we're ready for next round
        console.log('Sending ready_next_round to server');
        sendToServer({ type: 'ready_next_round' });

        // Show a waiting message
        showWaitingForOpponent();
    }, false); // Use bubble phase, after game.js handler
}

// Show waiting for opponent overlay
function showWaitingForOpponent() {
    const waitingOverlay = document.createElement('div');
    waitingOverlay.id = 'waiting-overlay';
    waitingOverlay.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        border: 4px solid #000;
        padding: 40px 60px;
        z-index: 5000;
        text-align: center;
    `;
    waitingOverlay.innerHTML = `
        <div style="font-size: 24px; font-weight: 700; text-transform: uppercase; margin-bottom: 20px;">Waiting for opponent...</div>
        <div style="font-size: 48px; color: #ff0000; animation: pulse 2s ease-in-out infinite;">●</div>
    `;
    document.body.appendChild(waitingOverlay);
}

// Handle game over
function handleGameOver(message) {
    const { finalScores } = message;

    clearInterval(timerInterval);
    hideResults();

    // Determine winner
    const winner = finalScores[0];
    const isWinner = winner.playerId === currentPlayerId;

    // Show win/lose screen
    const gameOverScreen = document.getElementById('game-over-screen');
    const title = document.getElementById('game-over-title');
    const scores = document.getElementById('game-over-scores');

    gameOverScreen.className = isWinner ? 'active win' : 'active lose';
    title.textContent = isWinner ? 'You Win!' : 'You Lose';

    const scoreHTML = finalScores.map((s, i) => {
        const place = i === 0 ? '🥇' : '🥈';
        const isSelf = s.playererId === currentPlayerId;
        return `<div style="margin: 10px 0;">${place} ${s.playerName}: <span style="color: #ff0000; font-weight: 700;">${s.totalScore}</span></div>`;
    }).join('');

    scores.innerHTML = scoreHTML;

    // Reset game state
    currentRound = 0;
    totalScore = 0;
    document.getElementById('current-score').textContent = 0;
}

// Game over return to lobby button
document.getElementById('game-over-return-btn').addEventListener('click', function() {
    document.getElementById('game-over-screen').classList.remove('active');
    document.getElementById('lobby-screen').classList.remove('hidden');
});

// Lobby leave button
document.getElementById('lobby-leave-btn').addEventListener('click', leaveLobby);

// Connect to server on load
window.addEventListener('load', connectToServer);
