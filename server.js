const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files
app.use(express.static(__dirname));

// Load categories from game.js (we'll extract just the data)
const categories = {
    disasters: {
        name: "Famous Disasters",
        events: [
            { name: "The Great Fire of London", lat: 51.5074, lng: -0.0901, year: 1666, location: "London, England" },
            { name: "The Eruption of Mount Vesuvius", lat: 40.8218, lng: 14.4265, year: 79, location: "Pompeii, Italy" },
            { name: "The Bombing of Pearl Harbor", lat: 21.3643, lng: -157.9529, year: 1941, location: "Pearl Harbor, Hawaii" },
            { name: "The Chernobyl Nuclear Disaster", lat: 51.3890, lng: 30.0990, year: 1986, location: "Chernobyl, Ukraine" },
            { name: "The Sinking of the Titanic", lat: 41.7325, lng: -49.9469, year: 1912, location: "North Atlantic Ocean" },
            { name: "The Great Chicago Fire", lat: 41.8781, lng: -87.6298, year: 1871, location: "Chicago, Illinois" },
            { name: "The Lisbon Earthquake", lat: 38.7223, lng: -9.1393, year: 1755, location: "Lisbon, Portugal" },
            { name: "The Hindenburg Disaster", lat: 40.0334, lng: -74.3487, year: 1937, location: "Lakehurst, New Jersey" },
            { name: "The Triangle Shirtwaist Factory Fire", lat: 40.7291, lng: -73.9965, year: 1911, location: "New York City" },
            { name: "The Krakatoa Eruption", lat: -6.1021, lng: 105.4230, year: 1883, location: "Krakatoa, Indonesia" }
        ]
    },
    battles: {
        name: "Famous Battles",
        events: [
            { name: "The Battle of Waterloo", lat: 50.6800, lng: 4.4114, year: 1815, location: "Waterloo, Belgium" },
            { name: "The Battle of Gettysburg", lat: 39.8309, lng: -77.2311, year: 1863, location: "Gettysburg, Pennsylvania" },
            { name: "The Battle of Thermopylae", lat: 38.7967, lng: 22.5361, year: -480, location: "Thermopylae, Greece" },
            { name: "The Battle of Hastings", lat: 50.9115, lng: 0.4914, year: 1066, location: "Hastings, England" },
            { name: "The Battle of Stalingrad", lat: 48.7080, lng: 44.5133, year: 1942, location: "Stalingrad, USSR" },
            { name: "The Battle of Agincourt", lat: 50.4667, lng: 2.1333, year: 1415, location: "Agincourt, France" },
            { name: "The Battle of Trafalgar", lat: 36.1833, lng: -6.0333, year: 1805, location: "Cape Trafalgar, Spain" },
            { name: "The Battle of Tours", lat: 46.7333, lng: 0.6833, year: 732, location: "Tours, France" },
            { name: "The Siege of Constantinople", lat: 41.0082, lng: 28.9784, year: 1453, location: "Constantinople" },
            { name: "The Battle of Midway", lat: 28.2072, lng: -177.3735, year: 1942, location: "Midway Atoll" }
        ]
    },
    leaders: {
        name: "Birthplaces of World Leaders",
        events: [
            { name: "Napoleon Bonaparte", lat: 41.9270, lng: 8.7369, year: 1769, location: "Ajaccio, Corsica" },
            { name: "Winston Churchill", lat: 51.8414, lng: -1.3617, year: 1874, location: "Blenheim Palace, England" },
            { name: "Abraham Lincoln", lat: 37.5347, lng: -85.7282, year: 1809, location: "Hodgenville, Kentucky" },
            { name: "Vladimir Lenin", lat: 54.3167, lng: 48.4000, year: 1870, location: "Simbirsk, Russia" },
            { name: "Mahatma Gandhi", lat: 21.5222, lng: 69.6647, year: 1869, location: "Porbandar, India" },
            { name: "Adolf Hitler", lat: 48.2518, lng: 13.0441, year: 1889, location: "Braunau am Inn, Austria" },
            { name: "Mao Zedong", lat: 27.7375, lng: 112.9402, year: 1893, location: "Shaoshan, China" },
            { name: "George Washington", lat: 38.1865, lng: -76.8996, year: 1732, location: "Westmoreland County, Virginia" },
            { name: "Julius Caesar", lat: 41.9028, lng: 12.4964, year: -100, location: "Rome, Italy" },
            { name: "Nelson Mandela", lat: -31.5833, lng: 28.7500, year: 1918, location: "Mvezo, South Africa" }
        ]
    },
    soviet: {
        name: "Soviet History",
        events: [
            { name: "The October Revolution", lat: 59.9343, lng: 30.3351, year: 1917, location: "Petrograd, Russia" },
            { name: "The Battle of Stalingrad", lat: 48.7080, lng: 44.5133, year: 1942, location: "Stalingrad, USSR" },
            { name: "The Chernobyl Nuclear Disaster", lat: 51.3890, lng: 30.0990, year: 1986, location: "Chernobyl, Ukraine" },
            { name: "The Siege of Leningrad Begins", lat: 59.9343, lng: 30.3351, year: 1941, location: "Leningrad, USSR" },
            { name: "The Launch of Sputnik 1", lat: 45.9650, lng: 63.3050, year: 1957, location: "Baikonur, Kazakhstan" },
            { name: "The Fall of the Berlin Wall", lat: 52.5200, lng: 13.4050, year: 1989, location: "Berlin, Germany" },
            { name: "The Katyn Massacre", lat: 54.7760, lng: 31.7850, year: 1940, location: "Katyn Forest, USSR" },
            { name: "The Cuban Missile Crisis (Soviet Side)", lat: 55.7558, lng: 37.6173, year: 1962, location: "Moscow, USSR" },
            { name: "Yuri Gagarin's First Spaceflight", lat: 45.9650, lng: 63.3050, year: 1961, location: "Baikonur, Kazakhstan" },
            { name: "The Dissolution of the USSR", lat: 55.7558, lng: 37.6173, year: 1991, location: "Moscow, Russia" }
        ]
    },
    world: {
        name: "World History",
        events: [
            { name: "The Wright Brothers' First Flight", lat: 36.0177, lng: -75.6694, year: 1903, location: "Kitty Hawk, North Carolina" },
            { name: "The Fall of the Berlin Wall", lat: 52.5200, lng: 13.4050, year: 1989, location: "Berlin, Germany" },
            { name: "Moon Landing (Apollo 11)", lat: 28.5729, lng: -80.6490, year: 1969, location: "Cape Canaveral, Florida" },
            { name: "The Signing of the Declaration of Independence", lat: 39.9496, lng: -75.1503, year: 1776, location: "Philadelphia, Pennsylvania" },
            { name: "The Storming of the Bastille", lat: 48.8534, lng: 2.3697, year: 1789, location: "Paris, France" },
            { name: "The Discovery of Machu Picchu", lat: -13.1631, lng: -72.5450, year: 1911, location: "Cusco Region, Peru" },
            { name: "The Opening of the Suez Canal", lat: 30.7051, lng: 32.3439, year: 1869, location: "Ismailia, Egypt" },
            { name: "The First Olympic Games (Modern)", lat: 37.9838, lng: 23.7275, year: 1896, location: "Athens, Greece" },
            { name: "The Founding of Rome (Legend)", lat: 41.9028, lng: 12.4964, year: -753, location: "Rome, Italy" },
            { name: "The Eruption of Mount Vesuvius", lat: 40.8218, lng: 14.4265, year: 79, location: "Pompeii, Italy" }
        ]
    }
};

// Game state
const lobbies = new Map(); // categoryKey -> { players: [], status: 'waiting'|'playing', currentRound: 0, ... }
const players = new Map(); // ws -> { id, name, lobby, score, roundAnswers: [] }

let playerIdCounter = 0;

// Generate unique player ID
function generatePlayerId() {
    return `player_${++playerIdCounter}`;
}

// Broadcast to all players in a lobby
function broadcastToLobby(lobbyKey, message) {
    const lobby = lobbies.get(lobbyKey);
    if (!lobby) return;

    lobby.players.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
        }
    });
}

// Handle WebSocket connections
wss.on('connection', (ws) => {
    console.log('New client connected');

    ws.on('message', (data) => {
        const message = JSON.parse(data);
        console.log('Received message:', message.type);

        switch (message.type) {
            case 'join_lobby':
                handleJoinLobby(ws, message);
                break;
            case 'leave_lobby':
                handleLeaveLobby(ws);
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
        }
    });

    ws.on('close', () => {
        handleLeaveLobby(ws);
        players.delete(ws);
        console.log('Client disconnected');
    });
});

// Handle player joining a lobby
function handleJoinLobby(ws, message) {
    const { categoryKey, playerName } = message;

    // Create player
    const playerId = generatePlayerId();
    const player = {
        id: playerId,
        name: playerName || `Player ${playerId}`,
        lobby: categoryKey,
        score: 0,
        roundAnswers: []
    };
    players.set(ws, player);

    // Get or create lobby
    if (!lobbies.has(categoryKey)) {
        lobbies.set(categoryKey, {
            categoryKey,
            players: [],
            status: 'waiting',
            currentRound: 0,
            currentEvent: null,
            roundStartTime: null
        });
    }

    const lobby = lobbies.get(categoryKey);
    lobby.players.push(ws);

    console.log(`${player.name} joined lobby ${categoryKey}`);

    // Send lobby state to all players
    broadcastLobbyState(categoryKey);

    // Auto-start if we have 2 players
    if (lobby.players.length === 2 && lobby.status === 'waiting') {
        setTimeout(() => startGame(categoryKey), 2000); // 2 second delay
    }
}

// Handle player leaving a lobby
function handleLeaveLobby(ws) {
    const player = players.get(ws);
    if (!player) return;

    const lobby = lobbies.get(player.lobby);
    if (!lobby) return;

    // Remove player from lobby
    lobby.players = lobby.players.filter(p => p !== ws);

    console.log(`${player.name} left lobby ${player.lobby}`);

    // If lobby is empty, delete it
    if (lobby.players.length === 0) {
        lobbies.delete(player.lobby);
        console.log(`Lobby ${player.lobby} deleted (empty)`);
    } else {
        // If game was in progress and someone left, end it
        if (lobby.status === 'playing') {
            endGame(player.lobby);
        } else {
            broadcastLobbyState(player.lobby);
        }
    }

    players.delete(ws);
}

// Handle player submitting an answer
function handleSubmitAnswer(ws, message) {
    const player = players.get(ws);
    if (!player) return;

    const lobby = lobbies.get(player.lobby);
    if (!lobby || lobby.status !== 'playing') return;

    const { guessLat, guessLng, guessYear, timeLeft } = message;

    // Calculate score
    const event = lobby.currentEvent;
    const distance = calculateDistance(guessLat, guessLng, event.lat, event.lng);
    const yearError = Math.abs(guessYear - event.year);
    let roundScore = calculateScore(distance, yearError, timeLeft);

    // Apply timeout penalty
    if (timeLeft <= 0) {
        roundScore -= 50;
    }

    // Store the answer with the round score
    player.roundAnswers[lobby.currentRound - 1] = {
        guessLat,
        guessLng,
        guessYear,
        timeLeft,
        timestamp: Date.now(),
        roundScore: roundScore
    };

    player.score += roundScore;

    // Notify player of their score
    ws.send(JSON.stringify({
        type: 'answer_received',
        roundScore,
        totalScore: player.score,
        distance,
        yearError
    }));

    // Check if all players have answered
    const allAnswered = lobby.players.every(playerWs => {
        const p = players.get(playerWs);
        return p.roundAnswers[lobby.currentRound - 1] !== undefined;
    });

    if (allAnswered) {
        // Show round results to all players
        showRoundResults(player.lobby);
    }
}

// Handle player ready for current round (ready to start timer)
function handleReadyForRound(ws) {
    const player = players.get(ws);
    if (!player) return;

    const lobby = lobbies.get(player.lobby);
    if (!lobby) return;

    player.readyForRound = true;

    // Notify lobby of ready status
    broadcastLobbyState(player.lobby);

    // Check if all players are ready
    const allReady = lobby.players.every(playerWs => {
        const p = players.get(playerWs);
        return p.readyForRound === true;
    });

    if (allReady) {
        // Start the round with synchronized timer
        broadcastToLobby(player.lobby, {
            type: 'round_start',
            round: lobby.currentRound
        });

        lobby.roundStartTime = Date.now();
    }
}

// Handle player ready for next round
function handleReadyNextRound(ws) {
    const player = players.get(ws);
    if (!player) return;

    const lobby = lobbies.get(player.lobby);
    if (!lobby) return;

    player.readyForNext = true;

    // Check if all players are ready
    const allReady = lobby.players.every(playerWs => {
        const p = players.get(playerWs);
        return p.readyForNext === true;
    });

    if (allReady) {
        // Reset ready flags
        lobby.players.forEach(playerWs => {
            const p = players.get(playerWs);
            p.readyForNext = false;
        });

        // Start next round or end game
        if (lobby.currentRound >= 10) {
            endGame(player.lobby);
        } else {
            startNextRound(player.lobby);
        }
    }
}

// Broadcast lobby state to all players
function broadcastLobbyState(lobbyKey) {
    const lobby = lobbies.get(lobbyKey);
    if (!lobby) return;

    const playerList = lobby.players.map(ws => {
        const p = players.get(ws);
        return {
            id: p.id,
            name: p.name,
            score: p.score
        };
    });

    broadcastToLobby(lobbyKey, {
        type: 'lobby_update',
        status: lobby.status,
        players: playerList,
        currentRound: lobby.currentRound
    });
}

// Start the game
function startGame(lobbyKey) {
    const lobby = lobbies.get(lobbyKey);
    if (!lobby) return;

    lobby.status = 'playing';
    lobby.currentRound = 0;

    // Reset all player scores
    lobby.players.forEach(ws => {
        const p = players.get(ws);
        p.score = 0;
        p.roundAnswers = [];
    });

    broadcastToLobby(lobbyKey, {
        type: 'game_starting'
    });

    setTimeout(() => startNextRound(lobbyKey), 1000);
}

// Start next round
function startNextRound(lobbyKey) {
    const lobby = lobbies.get(lobbyKey);
    if (!lobby) return;

    lobby.currentRound++;

    // Pick a random event from the category
    const category = categories[lobbyKey];
    if (!category) {
        console.error(`Category ${lobbyKey} not found`);
        return;
    }

    const event = category.events[Math.floor(Math.random() * category.events.length)];
    lobby.currentEvent = event;

    // Reset ready flags for this round
    lobby.players.forEach(playerWs => {
        const p = players.get(playerWs);
        p.readyForRound = false;
    });

    // Tell players to get ready
    broadcastToLobby(lobbyKey, {
        type: 'prepare_round',
        round: lobby.currentRound,
        event: event
    });

    lobby.roundStartTime = null; // Will be set when both players are ready
}

// Show round results
function showRoundResults(lobbyKey) {
    const lobby = lobbies.get(lobbyKey);
    if (!lobby) return;

    const results = lobby.players.map(ws => {
        const p = players.get(ws);
        const answer = p.roundAnswers[lobby.currentRound - 1];

        // Calculate individual scores
        const distance = calculateDistance(
            answer.guessLat,
            answer.guessLng,
            lobby.currentEvent.lat,
            lobby.currentEvent.lng
        );
        const yearError = Math.abs(answer.guessYear - lobby.currentEvent.year);

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
            distance: Math.round(distance),
            yearError: yearError
        };
    });

    broadcastToLobby(lobbyKey, {
        type: 'round_results',
        results,
        correctAnswer: lobby.currentEvent
    });
}

// End the game
function endGame(lobbyKey) {
    const lobby = lobbies.get(lobbyKey);
    if (!lobby) return;

    const finalScores = lobby.players.map(ws => {
        const p = players.get(ws);
        return {
            playerId: p.id,
            playerName: p.name,
            totalScore: p.score
        };
    }).sort((a, b) => b.totalScore - a.totalScore);

    broadcastToLobby(lobbyKey, {
        type: 'game_over',
        finalScores
    });

    // Reset lobby
    lobby.status = 'waiting';
    lobby.currentRound = 0;
    lobby.players.forEach(ws => {
        const p = players.get(ws);
        p.score = 0;
        p.roundAnswers = [];
    });

    broadcastLobbyState(lobbyKey);
}

// Calculate distance between two points (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Calculate score
function calculateScore(distanceKm, yearError, timeLeft) {
    const maxDistance = 20000;
    const distanceScore = Math.max(0, 497.5 * (1 - distanceKm / maxDistance));

    const maxYearError = 2000;
    const yearScore = Math.max(0, 497.5 * (1 - Math.abs(yearError) / maxYearError));

    const speedBonus = Math.max(0, 5 * (timeLeft / 30));

    return Math.round(distanceScore + yearScore + speedBonus);
}

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
