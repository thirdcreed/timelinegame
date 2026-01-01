// Multiplayer WebSocket client
let ws = null;
let isMultiplayer = false;
let currentPlayerId = null;
let opponentData = null;
let pingInterval = null;
let lastPingTime = null;

// Lobby player list state
let lobbyPlayers = [];
let lobbyPage = 1;
let isReady = false;
const PLAYERS_PER_PAGE = 10;

// Connect to WebSocket server
function connectToServer() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;

    // In production (HTTPS), don't specify port. In dev, use current port or 3001
    let wsUrl;
    if (window.location.protocol === 'https:') {
        wsUrl = `${protocol}//${host}`;
    } else {
        const port = window.location.port || 3001;
        wsUrl = `${protocol}//${host}:${port}`;
    }

    // Add auth token to WebSocket URL if available
    if (typeof auth !== 'undefined' && auth.accessToken) {
        wsUrl += `?token=${encodeURIComponent(auth.accessToken)}`;
    }

    ws = new WebSocket(wsUrl);

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
        case 'lobby_joined':
            handleLobbyJoined(message);
            break;
        case 'lobby_players':
            handleLobbyPlayers(message);
            break;
        case 'ready_status':
            handleReadyStatus(message);
            break;
        case 'game_invite':
            handleGameInvite(message);
            break;
        case 'invite_sent':
            handleInviteSent(message);
            break;
        case 'invite_declined':
            handleInviteDeclined(message);
            break;
        case 'lobby_update':
            handleLobbyUpdate(message);
            break;
        case 'match_found':
            handleMatchFound(message);
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
        case 'pong':
            handlePong();
            break;
        // Learning mode
        case 'learning_started':
            handleLearningStarted(message);
            break;
        case 'learning_event':
            handleLearningEvent(message);
            break;
        case 'learning_result':
            handleLearningResult(message);
            break;
    }
}

// Send message to server
function sendToServer(message) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
    }
}

// Ping measurement
function sendPing() {
    if (ws && ws.readyState === WebSocket.OPEN) {
        lastPingTime = performance.now();
        sendToServer({ type: 'ping' });
    }
}

function handlePong() {
    if (lastPingTime) {
        const ping = Math.round(performance.now() - lastPingTime);
        updatePingDisplay(ping);
        lastPingTime = null;
    }
}

function updatePingDisplay(ping) {
    const pingEl = document.getElementById('lobby-ping');
    if (!pingEl) return;

    pingEl.textContent = `${ping}ms`;
    pingEl.className = 'lobby-stat-value ping';

    if (ping > 150) {
        pingEl.classList.add('high');
    } else if (ping > 80) {
        pingEl.classList.add('medium');
    }
}

function startPingInterval() {
    stopPingInterval();
    sendPing(); // Send immediately
    pingInterval = setInterval(sendPing, 5000); // Then every 5 seconds
}

function stopPingInterval() {
    if (pingInterval) {
        clearInterval(pingInterval);
        pingInterval = null;
    }
}

// Lobby handlers
function handleLobbyJoined(message) {
    console.log('Joined lobby:', message.categoryKey);
    isReady = message.ready || false;
    updateReadyButton();
}

function handleLobbyPlayers(message) {
    const { players, readyCount, totalCount } = message;
    lobbyPlayers = players || [];

    // Update stats
    const lobbySize = document.getElementById('lobby-queue-size');
    if (lobbySize) lobbySize.textContent = totalCount || lobbyPlayers.length;

    const readyEl = document.getElementById('lobby-ready-count');
    if (readyEl) readyEl.textContent = readyCount || 0;

    // Get current user ID
    if (typeof auth !== 'undefined' && auth.user) {
        currentPlayerId = auth.user.id;
    }

    // Re-render player list
    renderPlayerList();
}

function handleReadyStatus(message) {
    isReady = message.ready;
    updateReadyButton();
}

function updateReadyButton() {
    const readyBtn = document.getElementById('ready-toggle-btn');
    if (!readyBtn) return;

    if (isReady) {
        readyBtn.textContent = 'Cancel Ready';
        readyBtn.classList.add('ready');
    } else {
        readyBtn.textContent = 'Ready to Play';
        readyBtn.classList.remove('ready');
    }
}

function toggleReady() {
    isReady = !isReady;
    sendToServer({
        type: 'set_ready',
        ready: isReady
    });
    updateReadyButton();
}

function renderPlayerList() {
    const playerList = document.getElementById('lobby-player-list');
    if (!playerList) return;

    const totalPages = Math.max(1, Math.ceil(lobbyPlayers.length / PLAYERS_PER_PAGE));
    lobbyPage = Math.min(lobbyPage, totalPages);

    const startIdx = (lobbyPage - 1) * PLAYERS_PER_PAGE;
    const endIdx = startIdx + PLAYERS_PER_PAGE;
    const pagePlayers = lobbyPlayers.slice(startIdx, endIdx);

    if (pagePlayers.length === 0) {
        playerList.innerHTML = '<div class="lobby-empty">No players in lobby yet</div>';
    } else {
        playerList.innerHTML = pagePlayers.map(player => {
            const isYou = player.userId === currentPlayerId;
            const avatarSrc = player.avatarUrl || '';
            const avatarStyle = avatarSrc ? `background-image: url('${avatarSrc}'); background-size: cover;` : '';
            const readyClass = player.ready ? 'is-ready' : '';

            return `
                <div class="lobby-player ${readyClass}" data-player-id="${player.userId}">
                    <div class="lobby-player-avatar" style="${avatarStyle}">
                        ${player.ready ? '<span class="ready-dot"></span>' : ''}
                    </div>
                    <div class="lobby-player-info">
                        <div class="lobby-player-name ${isYou ? 'is-you' : ''}">${player.username}${isYou ? ' (You)' : ''}</div>
                        <div class="lobby-player-elo">${player.elo || 1000} ELO</div>
                    </div>
                    ${!isYou ? `<button class="lobby-player-invite" onclick="sendInvite('${player.userId}')">Invite</button>` : ''}
                </div>
            `;
        }).join('');
    }

    // Update pagination
    const pageInfo = document.getElementById('lobby-page-info');
    const prevBtn = document.getElementById('lobby-prev-btn');
    const nextBtn = document.getElementById('lobby-next-btn');

    if (pageInfo) pageInfo.textContent = `${lobbyPage} / ${totalPages}`;
    if (prevBtn) prevBtn.disabled = lobbyPage <= 1;
    if (nextBtn) nextBtn.disabled = lobbyPage >= totalPages;
}

function changeLobbyPage(delta) {
    lobbyPage += delta;
    renderPlayerList();
}

// Invite system
function sendInvite(targetPlayerId) {
    sendToServer({
        type: 'send_invite',
        targetPlayerId
    });

    // Disable the button temporarily
    const btn = document.querySelector(`[data-player-id="${targetPlayerId}"] .lobby-player-invite`);
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Sent';
    }
}

function handleInviteSent(message) {
    console.log('Invite sent to:', message.to);
}

function handleGameInvite(message) {
    const { from } = message;

    // Show invite modal
    const modal = document.createElement('div');
    modal.id = 'invite-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>Game Invite!</h2>
            <p><strong>${from.username}</strong> (${from.elo || 1000} ELO) wants to play!</p>
            <div class="modal-buttons">
                <button class="btn-primary" onclick="respondToInvite('${from.userId}', true)">Accept</button>
                <button class="btn-secondary" onclick="respondToInvite('${from.userId}', false)">Decline</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function respondToInvite(fromUserId, accept) {
    sendToServer({
        type: 'respond_invite',
        fromUserId,
        accept
    });

    // Remove modal
    const modal = document.getElementById('invite-modal');
    if (modal) modal.remove();
}

function handleInviteDeclined(message) {
    const { by } = message;
    // Show brief notification
    showNotification(`${by.username} declined your invite`);
    // Re-enable invite buttons
    renderPlayerList();
}

function showNotification(text) {
    const notification = document.createElement('div');
    notification.className = 'lobby-notification';
    notification.textContent = text;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

// Join a lobby
function joinLobby(categoryKey, playerName) {
    isMultiplayer = true;
    isReady = false;

    // Use custom username if set, otherwise display name
    let name;
    if (typeof auth !== 'undefined' && auth.user) {
        name = auth.user.username_customized
            ? auth.user.username
            : (auth.user.display_name || auth.user.username);
        currentPlayerId = auth.user.id;
    } else {
        name = playerName || `Player_${Math.floor(Math.random() * 1000)}`;
    }

    sendToServer({
        type: 'join_lobby',
        categoryKey,
        playerName: name
    });

    // Show lobby screen
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('lobby-screen').classList.remove('hidden');
    document.getElementById('lobby-category-name').textContent = selectedCategory.name;

    // Update lobby stats
    const elo = (typeof auth !== 'undefined' && auth.user)
        ? (auth.user.elo_rating || 1000)
        : 1000;
    document.getElementById('lobby-elo').textContent = elo;
    document.getElementById('lobby-queue-size').textContent = '0';
    document.getElementById('lobby-ping').textContent = '--';

    // Reset ready button
    updateReadyButton();

    // Reset player list state
    lobbyPlayers = [];
    lobbyPage = 1;
    renderPlayerList();

    // Start ping measurement
    startPingInterval();
}

// Leave lobby
function leaveLobby() {
    sendToServer({ type: 'leave_lobby' });
    isMultiplayer = false;
    isReady = false;
    stopPingInterval();

    // Return to category screen
    document.getElementById('lobby-screen').classList.add('hidden');
    document.getElementById('category-screen').classList.remove('hidden');
}

// Handle lobby update
function handleLobbyUpdate(message) {
    const { status, players, currentRound } = message;

    // Store our player ID if we don't have it yet
    if (!currentPlayerId && players.length > 0) {
        // Check for 'self' ID first, otherwise assume we're the last player
        const selfPlayer = players.find(p => p.id === 'self');
        if (selfPlayer) {
            currentPlayerId = 'self';
        } else {
            currentPlayerId = players[players.length - 1].id;
        }
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

// Handle queue update (ELO matchmaking)
function handleQueueUpdate(message) {
    const { waitTime, eloRange, queueSize, position } = message;

    document.getElementById('lobby-status-text').textContent = 'Finding Opponent';

    // Update queue size stat
    document.getElementById('lobby-queue-size').textContent = queueSize || 1;

    let statusDetail = '';
    if (eloRange) {
        statusDetail = `ELO range: ±${eloRange}`;
    }
    if (waitTime) {
        statusDetail += statusDetail ? ` • Waiting: ${waitTime}s` : `Waiting: ${waitTime}s`;
    }
    if (!statusDetail) {
        statusDetail = 'Searching for players in your skill range...';
    }

    document.getElementById('lobby-status-detail').textContent = statusDetail;
    document.getElementById('waiting-animation').style.display = 'block';
}

// Handle match found
function handleMatchFound(message) {
    const { opponent, playerId } = message;

    // Update our player ID to the real one assigned by server
    if (playerId) {
        currentPlayerId = playerId;
    }

    document.getElementById('lobby-status-text').textContent = 'Match Found!';
    document.getElementById('lobby-status-detail').textContent = `vs ${opponent.username} (ELO: ${opponent.elo || 'Unranked'})`;
    document.getElementById('waiting-animation').style.display = 'none';

    // Store opponent info
    opponentData = opponent;
}

// Handle game starting
function handleGameStarting() {
    // Hide lobby, show game
    document.getElementById('lobby-screen').classList.add('hidden');
    gameStarted = true;
    stopPingInterval();

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
    answerSubmitted = false;
    hideTimeline();
    hideResults();
    hideTimelineComparison();

    // Reset timeline
    document.getElementById('timeline').disabled = false;

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

    // Add comparison info to results display
    if (opponentData && myResult) {
        const resultsContent = document.querySelector('.results-content');
        if (resultsContent) {
            // Add score comparison BEFORE the Continue button
            const comparisonHTML = `
                <div id="opponent-results" style="border-top: 2px solid #000; margin-top: 24px; padding-top: 24px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 16px;">
                        <div style="text-align: center;">
                            <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #666; margin-bottom: 8px;">You</div>
                            <div style="font-size: 32px; font-weight: 700; color: #ff0000;">${myResult.totalScore}</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #666; margin-bottom: 8px;">${opponentData.playerName}</div>
                            <div style="font-size: 32px; font-weight: 700; color: #0066ff;">${opponentData.totalScore}</div>
                        </div>
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
                        <span class="result-value">${opponentData.roundScore}</span>
                    </div>
                </div>
            `;
            // Insert before the button to avoid destroying event listeners
            const nextBtn = document.getElementById('next-btn');
            nextBtn.insertAdjacentHTML('beforebegin', comparisonHTML);
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
    answerSubmitted = true;

    // Hide submit bar immediately
    document.getElementById('submit-bar').classList.remove('active');

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

    // Re-place user marker to ensure it's at the right spot
    if (userMarker) {
        map.removeLayer(userMarker);
    }
    userMarker = L.marker([guessLatLng.lat, guessLatLng.lng], {
        icon: L.divIcon({
            className: 'user-marker',
            html: '<div style="background: #ff0000; width: 16px; height: 16px; border: 3px solid #000000;"></div>',
            iconSize: [16, 16],
            iconAnchor: [8, 8]
        })
    }).addTo(map);

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
    L.polyline([[guessLatLng.lat, guessLatLng.lng], [currentEvent.lat, currentEvent.lng]], {
        color: '#ff0000',
        weight: 2,
        opacity: 1,
        dashArray: '8, 8'
    }).addTo(map);

    map.fitBounds([
        guessLatLng,
        [currentEvent.lat, currentEvent.lng]
    ], { padding: [50, 50] });

    // Show correct year on timeline and lock it
    const timeline = document.getElementById('timeline');
    timeline.disabled = true;
    document.getElementById('year-display').textContent = formatYear(correctYear) + ' ✓';

    // Show timeline comparison markers (guess vs correct)
    showTimelineComparison(guessedYear, correctYear, timeline);

    // Change submit button to Continue
    const submitBtn = document.getElementById('submit-btn');
    submitBtn.textContent = 'Continue';
    submitBtn.disabled = false;
    document.getElementById('submit-bar').classList.add('active');

    // Wait 3 seconds so user can see the correct answers, then show results
    setTimeout(() => {
        showResults(distance, yearError, roundScore, correctYear);
    }, 3000);
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
    const { finalScores, eloChanges } = message;

    clearInterval(timerInterval);
    hideResults();

    // Determine winner
    const winner = finalScores[0];
    const isWinner = winner.playerId === currentPlayerId;

    // Find my new ELO from the server response
    let myEloChange = null;
    let myNewElo = null;
    if (eloChanges) {
        // Find which player I am (player1 or player2)
        const myFinalScore = finalScores.find(s => s.playerId === currentPlayerId);
        if (myFinalScore) {
            // Match by userId or just use position
            const myIndex = finalScores.indexOf(myFinalScore);
            if (myIndex === 0) {
                myEloChange = eloChanges.player1?.change;
                myNewElo = eloChanges.player1?.newElo;
            } else {
                myEloChange = eloChanges.player2?.change;
                myNewElo = eloChanges.player2?.newElo;
            }
        }
    }

    // Update auth user's ELO if logged in
    if (myNewElo && typeof auth !== 'undefined' && auth.user) {
        auth.user.elo_rating = myNewElo;
        // Update UI
        const eloEl = document.getElementById('user-elo');
        if (eloEl) eloEl.textContent = myNewElo;
    }

    // Show win/lose screen
    const gameOverScreen = document.getElementById('game-over-screen');
    const title = document.getElementById('game-over-title');
    const scores = document.getElementById('game-over-scores');

    gameOverScreen.className = isWinner ? 'active win' : 'active lose';
    title.textContent = isWinner ? 'You Win!' : 'You Lose';

    let scoreHTML = finalScores.map((s, i) => {
        const place = i === 0 ? '🥇' : '🥈';
        return `<div style="margin: 10px 0;">${place} ${s.playerName}: <span style="color: #ff0000; font-weight: 700;">${s.totalScore}</span></div>`;
    }).join('');

    // Show ELO change if applicable
    if (myEloChange !== null) {
        const changeText = myEloChange >= 0 ? `+${myEloChange}` : `${myEloChange}`;
        const changeColor = myEloChange >= 0 ? '#00aa00' : '#cc0000';
        scoreHTML += `<div style="margin-top: 20px; font-size: 18px;">ELO: <span style="color: ${changeColor}; font-weight: 700;">${changeText}</span> → ${myNewElo}</div>`;
    }

    scores.innerHTML = scoreHTML;

    // Reset game state
    currentRound = 0;
    totalScore = 0;
    document.getElementById('current-score').textContent = 0;
}

// Game over return to category menu
document.getElementById('game-over-return-btn').addEventListener('click', function() {
    document.getElementById('game-over-screen').classList.remove('active');
    document.getElementById('lobby-screen').classList.add('hidden');
    document.getElementById('category-screen').classList.remove('hidden');
    // Reset multiplayer state
    isMultiplayer = false;
    currentPlayerId = null;
    opponentData = null;
});

// Lobby leave button
document.getElementById('lobby-leave-btn').addEventListener('click', leaveLobby);

// Ready toggle button
document.getElementById('ready-toggle-btn')?.addEventListener('click', toggleReady);

// Practice solo button
document.getElementById('practice-btn').addEventListener('click', startPracticeMode);

// Learning mode button - starts spaced repetition learning
document.getElementById('learning-btn').addEventListener('click', function() {
    const categoryKey = Object.keys(categories).find(key => categories[key] === selectedCategory);
    startLearningMode(categoryKey);
});

// Pagination buttons
document.getElementById('lobby-prev-btn')?.addEventListener('click', () => changeLobbyPage(-1));
document.getElementById('lobby-next-btn')?.addEventListener('click', () => changeLobbyPage(1));

// Start practice mode (single player)
function startPracticeMode() {
    // Leave the multiplayer lobby
    sendToServer({ type: 'leave_lobby' });
    isMultiplayer = false;
    stopPingInterval();

    // Hide lobby screen
    document.getElementById('lobby-screen').classList.add('hidden');

    // Start the game in single-player mode
    gameStarted = true;
    currentRound = 0;
    totalScore = 0;
    document.getElementById('current-score').textContent = 0;

    // Start the first round
    startRound();
}

// Connect to server on load
window.addEventListener('load', connectToServer);
