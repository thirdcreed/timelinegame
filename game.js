// Category definitions with events, map bounds, and timeline ranges
const categories = {
    disasters: {
        name: "Famous Disasters",
        description: "Natural and man-made catastrophes throughout history",
        mapCenter: [20, 0],
        mapZoom: 2,
        timelineMin: -1000,
        timelineMax: 2024,
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
        description: "Decisive military conflicts that shaped history",
        mapCenter: [35, 15],
        mapZoom: 3,
        timelineMin: -500,
        timelineMax: 1950,
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
        description: "Where history's most influential figures were born",
        mapCenter: [35, 20],
        mapZoom: 2,
        timelineMin: -400,
        timelineMax: 2000,
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
        description: "Key events from the USSR 1917-1991",
        mapCenter: [60, 60],
        mapZoom: 3,
        timelineMin: 1917,
        timelineMax: 1991,
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
        description: "Major events from across the globe and all eras",
        mapCenter: [20, 0],
        mapZoom: 2,
        timelineMin: -3000,
        timelineMax: 2024,
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

// Current game state
let selectedCategory = null;

// Game state
let currentRound = 0;
let totalScore = 0;
let currentEvent = null;
let map = null;
let userMarker = null;
let correctMarker = null;
let guessLatLng = null;
let timerInterval = null;
let timeLeft = 30;
let gameStarted = false;

// Initialize the map
function initMap() {
    map = L.map('map', {
        zoomControl: true,
        attributionControl: false
    }).setView([20, 0], 2);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
    }).addTo(map);

    // Handle map clicks
    map.on('click', function(e) {
        if (gameStarted && guessLatLng === null) {
            guessLatLng = e.latlng;
            placeUserMarker(e.latlng);
            showTimeline();
        }
    });
}

// Place user's guess marker
function placeUserMarker(latlng) {
    if (userMarker) {
        map.removeLayer(userMarker);
    }

    userMarker = L.marker(latlng, {
        icon: L.divIcon({
            className: 'user-marker',
            html: '<div style="background: #ff0000; width: 16px; height: 16px; border: 3px solid #000000;"></div>',
            iconSize: [16, 16],
            iconAnchor: [8, 8]
        })
    }).addTo(map);
}

// Show the timeline slider
function showTimeline() {
    document.getElementById('timeline-container').classList.add('active');
    document.getElementById('submit-btn').disabled = false;
}

// Hide the timeline slider
function hideTimeline() {
    document.getElementById('timeline-container').classList.remove('active');
    document.getElementById('submit-btn').disabled = true;
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

// Calculate score based on distance and time error
function calculateScore(distanceKm, yearError, timeLeft) {
    // Distance component (max 497.5 points)
    // Perfect = 0km, 0 points at 20000km (half the earth's circumference)
    const maxDistance = 20000;
    const distanceScore = Math.max(0, 497.5 * (1 - distanceKm / maxDistance));

    // Year component (max 497.5 points - equal weight to distance)
    // Perfect = 0 years, 0 points at 2000 years
    const maxYearError = 2000;
    const yearScore = Math.max(0, 497.5 * (1 - Math.abs(yearError) / maxYearError));

    // Speed tiebreaker (max 5 points)
    // Only used as tiebreaker, minimal impact (~0.5% of total)
    const speedBonus = Math.max(0, 5 * (timeLeft / 30));

    return Math.round(distanceScore + yearScore + speedBonus);
}

// Start the countdown timer
function startTimer() {
    timeLeft = 30;
    updateTimerDisplay();

    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            autoSubmit();
        }
    }, 1000);
}

// Update timer display
function updateTimerDisplay() {
    const timerEl = document.getElementById('timer');
    timerEl.textContent = timeLeft;

    // Change color based on time remaining
    if (timeLeft <= 5) {
        timerEl.style.color = '#ff0000';
    } else if (timeLeft <= 10) {
        timerEl.style.color = '#ff0000';
    } else {
        timerEl.style.color = '#ffffff';
    }
}

// Auto-submit if time runs out
function autoSubmit() {
    if (!guessLatLng) {
        // Random guess in the middle of the map
        guessLatLng = L.latLng(0, 0);
        placeUserMarker(guessLatLng);
    }
    submitAnswer();
}

// Submit the answer
function submitAnswer() {
    clearInterval(timerInterval);

    const guessedYear = parseInt(document.getElementById('timeline').value);
    const correctYear = currentEvent.year;
    const yearError = Math.abs(guessedYear - correctYear);

    const distance = calculateDistance(
        guessLatLng.lat,
        guessLatLng.lng,
        currentEvent.lat,
        currentEvent.lng
    );

    let roundScore = calculateScore(distance, yearError, timeLeft);

    // Apply timeout penalty if time ran out
    if (timeLeft <= 0) {
        roundScore -= 50; // Deduct 50 points for timeout
    }

    totalScore += roundScore;

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

    // Draw line between guess and correct answer
    L.polyline([guessLatLng, [currentEvent.lat, currentEvent.lng]], {
        color: '#ff0000',
        weight: 2,
        opacity: 1,
        dashArray: '8, 8'
    }).addTo(map);

    // Fit map to show both markers
    map.fitBounds([
        guessLatLng,
        [currentEvent.lat, currentEvent.lng]
    ], { padding: [50, 50] });

    // Show results
    showResults(distance, yearError, roundScore, correctYear);
}

// Show results overlay
function showResults(distance, yearError, roundScore, correctYear) {
    document.getElementById('distance-error').textContent = `${Math.round(distance)} km`;
    document.getElementById('time-error').textContent = `${yearError} years`;
    document.getElementById('round-score').textContent = roundScore;
    document.getElementById('correct-answer').textContent = `${currentEvent.location}, ${formatYear(correctYear)}`;
    document.getElementById('results-overlay').classList.add('active');
    document.getElementById('current-score').textContent = totalScore;
}

// Hide results overlay
function hideResults() {
    document.getElementById('results-overlay').classList.remove('active');
}

// Start a new round
function startRound() {
    currentRound++;

    if (currentRound > 10) {
        endGame();
        return;
    }

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

    // Clear any polylines
    map.eachLayer((layer) => {
        if (layer instanceof L.Polyline) {
            map.removeLayer(layer);
        }
    });

    // Reset map view to category-specific bounds
    const category = selectedCategory;
    map.setView(category.mapCenter, category.mapZoom);

    // Pick random event from category
    currentEvent = category.events[Math.floor(Math.random() * category.events.length)];

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

// End the game
function endGame() {
    clearInterval(timerInterval);
    document.getElementById('event-text').textContent = `Game Over! Final Score: ${totalScore}`;
    document.getElementById('timer').textContent = '';

    // Show final results
    alert(`Game Over!\n\n${selectedCategory.name}\nYour final score: ${totalScore}\nAverage per round: ${Math.round(totalScore / 10)}`);

    // Reset game
    currentRound = 0;
    totalScore = 0;
    gameStarted = false;
    selectedCategory = null;
    document.getElementById('category-screen').classList.remove('hidden');
    document.getElementById('current-score').textContent = 0;
    document.getElementById('category-continue').disabled = true;

    // Deselect all categories
    document.querySelectorAll('.category-card').forEach(c => c.classList.remove('selected'));
}

// Format year for display (handle BCE)
function formatYear(year) {
    if (year < 0) {
        return Math.abs(year) + ' BCE';
    } else if (year === 0) {
        return '1 BCE';
    } else {
        return year;
    }
}

// Update year display when timeline changes
document.getElementById('timeline').addEventListener('input', function(e) {
    const year = parseInt(e.target.value);
    document.getElementById('year-display').textContent = formatYear(year);
});

// Auto-submit when timeline slider is released
document.getElementById('timeline').addEventListener('change', function(e) {
    if (gameStarted && guessLatLng !== null) {
        if (typeof submitAnswerMultiplayer !== 'undefined' && isMultiplayer) {
            submitAnswerMultiplayer();
        } else {
            submitAnswer();
        }
    }
});

// Submit button
document.getElementById('submit-btn').addEventListener('click', function() {
    if (typeof submitAnswerMultiplayer !== 'undefined' && isMultiplayer) {
        submitAnswerMultiplayer();
    } else {
        submitAnswer();
    }
});

// Next round button
document.getElementById('next-btn').addEventListener('click', function() {
    // Check if multiplayer mode is active
    if (typeof isMultiplayer !== 'undefined' && isMultiplayer) {
        // Multiplayer handles this differently
        return;
    }
    startRound();
});

// Update timeline tick marks based on range
function updateTimelineTicks(minYear, maxYear) {
    const ticksContainer = document.getElementById('timeline-ticks');
    const range = maxYear - minYear;

    ticksContainer.innerHTML = '';

    // Create 6 evenly spaced ticks
    for (let i = 0; i <= 5; i++) {
        const year = Math.floor(minYear + (range * i / 5));
        const percent = (i / 5) * 100;

        const tick = document.createElement('div');
        tick.className = 'tick';
        tick.style.left = `${percent}%`;

        const span = document.createElement('span');
        span.textContent = formatYear(year);
        tick.appendChild(span);

        ticksContainer.appendChild(tick);
    }
}

// Populate category grid
function populateCategoryGrid() {
    const grid = document.getElementById('category-grid');

    for (const [key, category] of Object.entries(categories)) {
        const card = document.createElement('div');
        card.className = 'category-card';
        card.dataset.categoryKey = key;

        const yearRange = `${formatYear(category.timelineMin)} - ${formatYear(category.timelineMax)}`;
        const eventCount = `${category.events.length} events`;

        card.innerHTML = `
            <h3>${category.name}</h3>
            <p>${category.description}</p>
            <div class="category-meta">${yearRange} • ${eventCount}</div>
        `;

        card.addEventListener('click', function() {
            // Deselect all
            document.querySelectorAll('.category-card').forEach(c => c.classList.remove('selected'));
            // Select this one
            card.classList.add('selected');
            selectedCategory = categories[key];
            document.getElementById('category-continue').disabled = false;
        });

        grid.appendChild(card);
    }
}

// Category continue button
document.getElementById('category-continue').addEventListener('click', function() {
    // Update start screen with category info
    document.getElementById('category-title').textContent = selectedCategory.name;
    document.getElementById('category-desc').textContent = selectedCategory.description;

    // Hide category screen, show start screen
    document.getElementById('category-screen').classList.add('hidden');
    document.getElementById('start-screen').classList.remove('hidden');
});

// Start game button - now joins multiplayer lobby
document.getElementById('start-btn').addEventListener('click', function() {
    // Join multiplayer lobby
    const categoryKey = Object.keys(categories).find(key => categories[key] === selectedCategory);
    joinLobby(categoryKey, `Player_${Math.floor(Math.random() * 1000)}`);
});

// Initialize map and category grid when page loads
window.addEventListener('load', function() {
    initMap();
    populateCategoryGrid();
});
