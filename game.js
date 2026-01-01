// Category definitions with events, map bounds, and timeline ranges
const categories = {
    sistersHistory: {
        name: "World History Survey",
        description: "Ancient civilizations to modern era - from class curriculum",
        mapCenter: [30, 20],
        mapZoom: 2,
        timelineMin: -3200,
        timelineMax: 2025,
        events: [
            // Ancient
            { name: "Menes Unites Upper and Lower Egypt", lat: 29.8500, lng: 31.2500, year: -3000, location: "Memphis, Egypt" },
            { name: "Sargon of Akkad Founds the First Empire", lat: 33.1000, lng: 44.1000, year: -2270, location: "Akkad, Mesopotamia" },
            { name: "Hammurabi Establishes His Law Code", lat: 32.5421, lng: 44.4210, year: -1792, location: "Babylon, Mesopotamia" },
            { name: "City of Rome Founded", lat: 41.9028, lng: 12.4964, year: -753, location: "Rome, Italy" },
            { name: "Battle of Salamis Bay", lat: 37.9667, lng: 23.5000, year: -480, location: "Salamis, Greece" },
            { name: "Alexander the Great Becomes King", lat: 40.7617, lng: 22.3933, year: -336, location: "Pella, Macedonia" },
            { name: "Julius Caesar Assassinated", lat: 41.8925, lng: 12.4769, year: -44, location: "Rome, Italy" },

            // Classical / Late Antiquity
            { name: "Crucifixion of Jesus Christ", lat: 31.7784, lng: 35.2296, year: 30, location: "Jerusalem" },
            { name: "Romans Destroy Jerusalem", lat: 31.7784, lng: 35.2296, year: 70, location: "Jerusalem" },
            { name: "Council of Nicaea", lat: 40.4292, lng: 29.7211, year: 325, location: "Nicaea, Turkey" },
            { name: "Fall of the Western Roman Empire", lat: 44.4183, lng: 12.2035, year: 476, location: "Ravenna, Italy" },
            { name: "Hegira - Muhammad Flees to Medina", lat: 24.4672, lng: 39.6024, year: 622, location: "Medina, Arabia" },
            { name: "Battle of Tours - Charles Martel Stops Muslim Advance", lat: 47.3900, lng: 0.6833, year: 732, location: "Tours, France" },
            { name: "Charlemagne Crowned Emperor", lat: 41.9022, lng: 12.4539, year: 800, location: "Rome, Italy" },

            // Medieval
            { name: "Norman Conquest - Battle of Hastings", lat: 50.9115, lng: 0.4914, year: 1066, location: "Hastings, England" },
            { name: "First Crusade Launched", lat: 45.7797, lng: 3.0863, year: 1096, location: "Clermont, France" },
            { name: "Temujin Named Genghis Khan", lat: 46.8625, lng: 103.8467, year: 1206, location: "Karakorum, Mongolia" },
            { name: "Magna Carta Signed", lat: 51.4365, lng: -0.5616, year: 1215, location: "Runnymede, England" },
            { name: "Mansa Musa Arrives in Cairo", lat: 30.0444, lng: 31.2357, year: 1324, location: "Cairo, Egypt" },
            { name: "Black Death Devastates Europe", lat: 43.7696, lng: 11.2558, year: 1347, location: "Florence, Italy" },
            { name: "Ottoman Turks Conquer Constantinople", lat: 41.0082, lng: 28.9784, year: 1453, location: "Constantinople" },

            // Early Modern
            { name: "Columbus Reaches the Americas", lat: 24.0833, lng: -74.5333, year: 1492, location: "San Salvador, Bahamas" },
            { name: "Luther Posts the 95 Theses", lat: 51.8667, lng: 12.6500, year: 1517, location: "Wittenberg, Germany" },
            { name: "Cortés Lands in Mexico", lat: 19.2000, lng: -96.1333, year: 1519, location: "Veracruz, Mexico" },
            { name: "Battle of Panipat - Babur Founds Mughal Dynasty", lat: 29.3909, lng: 76.9635, year: 1526, location: "Panipat, India" },
            { name: "Defeat of the Spanish Armada", lat: 50.3667, lng: -4.1500, year: 1588, location: "English Channel" },
            { name: "Pilgrims Land at Plymouth", lat: 41.9584, lng: -70.6673, year: 1620, location: "Plymouth, Massachusetts" },
            { name: "Charles I Beheaded", lat: 51.5014, lng: -0.1419, year: 1649, location: "Whitehall, London" },
            { name: "William of Orange Lands in England", lat: 50.3965, lng: -3.5156, year: 1688, location: "Brixham, Devon" },

            // 18th-19th Century
            { name: "Declaration of Independence Signed", lat: 39.9496, lng: -75.1503, year: 1776, location: "Philadelphia, Pennsylvania" },
            { name: "Storming of the Bastille", lat: 48.8534, lng: 2.3697, year: 1789, location: "Paris, France" },
            { name: "Napoleon Defeated at Waterloo", lat: 50.6800, lng: 4.4114, year: 1815, location: "Waterloo, Belgium" },
            { name: "Communist Manifesto Published", lat: 51.5074, lng: -0.1278, year: 1848, location: "London, England" },
            { name: "Meiji Restoration - Imperial Power Restored", lat: 35.0116, lng: 135.7681, year: 1868, location: "Kyoto, Japan" },
            { name: "Suez Canal Opens", lat: 30.7051, lng: 32.3439, year: 1869, location: "Ismailia, Egypt" },

            // 20th Century
            { name: "Archduke Franz Ferdinand Assassinated", lat: 43.8563, lng: 18.4131, year: 1914, location: "Sarajevo, Bosnia" },
            { name: "October Revolution - Storming of Winter Palace", lat: 59.9410, lng: 30.3129, year: 1917, location: "Petrograd, Russia" },
            { name: "Stock Market Crash Begins Great Depression", lat: 40.7069, lng: -74.0089, year: 1929, location: "Wall Street, New York" },
            { name: "Hitler Becomes Chancellor of Germany", lat: 52.5200, lng: 13.4050, year: 1933, location: "Berlin, Germany" },
            { name: "D-Day - Allied Invasion of Normandy", lat: 49.3700, lng: -0.8800, year: 1944, location: "Normandy, France" },
            { name: "Atomic Bomb Dropped on Hiroshima", lat: 34.3853, lng: 132.4553, year: 1945, location: "Hiroshima, Japan" },
            { name: "State of Israel Founded", lat: 32.0853, lng: 34.7818, year: 1948, location: "Tel Aviv, Israel" },
            { name: "Chinese Communist Revolution Succeeds", lat: 39.9042, lng: 116.4074, year: 1949, location: "Beijing, China" },
            { name: "Construction of the Berlin Wall Begins", lat: 52.5163, lng: 13.3777, year: 1961, location: "Berlin, Germany" },
            { name: "Apollo 11 Launches to the Moon", lat: 28.5729, lng: -80.6490, year: 1969, location: "Cape Canaveral, Florida" },
            { name: "Berlin Wall Falls", lat: 52.5200, lng: 13.4050, year: 1989, location: "Berlin, Germany" },
            { name: "Soviet Flag Lowered at the Kremlin", lat: 55.7520, lng: 37.6175, year: 1991, location: "The Kremlin, Moscow" },
            { name: "September 11 Attacks", lat: 40.7115, lng: -74.0134, year: 2001, location: "New York City" },
            { name: "Hamas October 7 Attack on Israel", lat: 31.3774, lng: 34.3931, year: 2023, location: "Re'im, Israel" },
            { name: "Israel Begins Genocide in Gaza", lat: 31.5000, lng: 34.4700, year: 2023, location: "Gaza" },
        ]
    },
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
            { name: "Belovezh Accords Signed (Dissolving USSR)", lat: 52.5694, lng: 23.8500, year: 1991, location: "Viskuli, Belarus" }
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
let answerSubmitted = false;

// Initialize the map
function initMap() {
    map = L.map('map', {
        zoomControl: true,
        attributionControl: false
    }).setView([20, 0], 2);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
    }).addTo(map);

    // Handle map clicks - allow repositioning marker (but not after submitting)
    map.on('click', function(e) {
        // Allow clicks in regular game mode OR learning mode
        if ((gameStarted || isLearningMode) && !answerSubmitted) {
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

// Show the timeline slider and submit bar
function showTimeline() {
    document.getElementById('timeline-container').classList.add('active');
    document.getElementById('submit-bar').classList.add('active');
    document.getElementById('submit-btn').disabled = false;
}

// Hide the timeline slider and submit bar
function hideTimeline() {
    document.getElementById('timeline-container').classList.remove('active');
    document.getElementById('submit-bar').classList.remove('active');
    document.getElementById('submit-btn').disabled = true;
}

// Show timeline comparison markers (guess vs correct)
function showTimelineComparison(guessedYear, correctYear, timeline) {
    const min = parseInt(timeline.min);
    const max = parseInt(timeline.max);
    const range = max - min;

    // Calculate positions as percentages
    const guessPercent = ((guessedYear - min) / range) * 100;
    const correctPercent = ((correctYear - min) / range) * 100;

    // Position the markers
    const guessMarker = document.getElementById('timeline-guess-marker');
    const correctMarker = document.getElementById('timeline-correct-marker');
    const errorLine = document.getElementById('timeline-error-line');
    const markersContainer = document.getElementById('timeline-markers');

    guessMarker.style.left = guessPercent + '%';
    correctMarker.style.left = correctPercent + '%';

    // Position the dashed line between the two markers
    const leftPercent = Math.min(guessPercent, correctPercent);
    const widthPercent = Math.abs(correctPercent - guessPercent);
    errorLine.style.left = leftPercent + '%';
    errorLine.style.width = widthPercent + '%';

    // Update year display to show both
    document.getElementById('year-display').textContent = formatYear(guessedYear) + ' → ' + formatYear(correctYear) + ' ✓';

    // Show the markers
    markersContainer.classList.add('active');
}

// Hide timeline comparison markers
function hideTimelineComparison() {
    document.getElementById('timeline-markers').classList.remove('active');
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
    answerSubmitted = true;

    // Hide submit bar immediately
    document.getElementById('submit-bar').classList.remove('active');

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

    // Show correct location on map
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
    L.polyline([[guessLatLng.lat, guessLatLng.lng], [currentEvent.lat, currentEvent.lng]], {
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

    // Show correct year on timeline and lock it
    const timeline = document.getElementById('timeline');
    timeline.disabled = true;
    document.getElementById('year-input').disabled = true;
    document.querySelectorAll('.nudge-btn').forEach(btn => btn.disabled = true);

    // Show timeline comparison markers
    showTimelineComparison(guessedYear, correctYear, timeline);

    // Wait 3 seconds so user can see the correct answers, then show results and enable Continue
    setTimeout(() => {
        showResults(distance, yearError, roundScore, correctYear);

        // Only enable Continue button AFTER results popup appears
        const submitBtn = document.getElementById('submit-btn');
        submitBtn.textContent = 'Continue';
        submitBtn.disabled = false;
        document.getElementById('submit-bar').classList.add('active');
    }, 3000);
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
    answerSubmitted = false;
    hideTimeline();
    hideResults();
    hideTimelineComparison();

    // Reset timeline
    document.getElementById('timeline').disabled = false;
    document.getElementById('year-input').disabled = false;
    document.querySelectorAll('.nudge-btn').forEach(btn => btn.disabled = false);

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
    document.getElementById('year-input').value = midYear;

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

// Update year display when timeline changes (but not after submitting)
document.getElementById('timeline').addEventListener('input', function(e) {
    if (answerSubmitted) {
        return;
    }
    const year = parseInt(e.target.value);
    document.getElementById('year-display').textContent = formatYear(year);
    document.getElementById('year-input').value = year;
});

// Timeline nudge buttons
document.querySelectorAll('.nudge-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
        e.preventDefault();
        if (answerSubmitted) return;

        const timeline = document.getElementById('timeline');
        const nudge = parseInt(this.dataset.nudge);
        const min = parseInt(timeline.min);
        const max = parseInt(timeline.max);
        let newValue = parseInt(timeline.value) + nudge;
        newValue = Math.max(min, Math.min(max, newValue));

        timeline.value = newValue;
        document.getElementById('year-display').textContent = formatYear(newValue);
        document.getElementById('year-input').value = newValue;
    });
});

// Year input field - type a year directly
document.getElementById('year-input').addEventListener('input', function(e) {
    if (answerSubmitted) return;

    // Allow typing negative numbers and partial input
    let val = this.value.replace(/[^\d\-]/g, '');
    this.value = val;
});

document.getElementById('year-input').addEventListener('change', function(e) {
    if (answerSubmitted) return;

    const timeline = document.getElementById('timeline');
    const min = parseInt(timeline.min);
    const max = parseInt(timeline.max);
    let year = parseInt(this.value) || 0;
    year = Math.max(min, Math.min(max, year));

    timeline.value = year;
    this.value = year;
    document.getElementById('year-display').textContent = formatYear(year);
});

document.getElementById('year-input').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        this.blur();
    }
});

// Arrow key support for timeline (when focused or when timeline container is active)
document.addEventListener('keydown', function(e) {
    if (answerSubmitted) return;
    if (!document.getElementById('timeline-container').classList.contains('active')) return;

    // Don't capture if user is typing in year input
    if (document.activeElement === document.getElementById('year-input')) return;

    const timeline = document.getElementById('timeline');
    const min = parseInt(timeline.min);
    const max = parseInt(timeline.max);
    let currentValue = parseInt(timeline.value);
    let nudge = 0;

    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        nudge = e.shiftKey ? -10 : -1;
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        nudge = e.shiftKey ? 10 : 1;
    }

    if (nudge !== 0) {
        e.preventDefault();
        let newValue = currentValue + nudge;
        newValue = Math.max(min, Math.min(max, newValue));

        timeline.value = newValue;
        document.getElementById('year-display').textContent = formatYear(newValue);
        document.getElementById('year-input').value = newValue;
    }
});

// Precision mode - hold Shift while dragging for slower movement
(function() {
    const timeline = document.getElementById('timeline');
    let precisionMode = false;
    let precisionStartValue = 0;
    let precisionStartX = 0;

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Shift' && !precisionMode) {
            precisionMode = true;
            document.getElementById('timeline-container').classList.add('precision-mode');
        }
    });

    document.addEventListener('keyup', function(e) {
        if (e.key === 'Shift') {
            precisionMode = false;
            document.getElementById('timeline-container').classList.remove('precision-mode');
        }
    });

    // Custom precision drag handling
    let isDragging = false;

    timeline.addEventListener('mousedown', function(e) {
        if (precisionMode) {
            isDragging = true;
            precisionStartValue = parseInt(timeline.value);
            precisionStartX = e.clientX;
            e.preventDefault();
        }
    });

    document.addEventListener('mousemove', function(e) {
        if (isDragging && precisionMode && !answerSubmitted) {
            const min = parseInt(timeline.min);
            const max = parseInt(timeline.max);
            const range = max - min;

            // 1 pixel = 0.5 years in precision mode (vs normal ~5-10 years)
            const deltaX = e.clientX - precisionStartX;
            const yearDelta = Math.round(deltaX * 0.5);

            let newValue = precisionStartValue + yearDelta;
            newValue = Math.max(min, Math.min(max, newValue));

            timeline.value = newValue;
            document.getElementById('year-display').textContent = formatYear(newValue);
            document.getElementById('year-input').value = newValue;
        }
    });

    document.addEventListener('mouseup', function() {
        isDragging = false;
    });
})();

// No auto-submit - user must click Submit button

// Submit button (becomes Continue after answering)
document.getElementById('submit-btn').addEventListener('click', function(e) {
    e.stopPropagation(); // Prevent click from bubbling to map

    if (this.textContent === 'Continue') {
        // Move to next round
        hideResults();
        document.getElementById('submit-bar').classList.remove('active');
        this.textContent = 'Submit Answer';
        this.disabled = true;
        if (typeof isMultiplayer !== 'undefined' && isMultiplayer) {
            sendToServer({ type: 'ready_next_round' });
            showWaitingForOpponent();
        } else {
            startRound();
        }
    } else if (guessLatLng && !answerSubmitted) {
        // Submit answer
        if (typeof isLearningMode !== 'undefined' && isLearningMode) {
            submitLearningAnswer();
        } else if (typeof submitAnswerMultiplayer !== 'undefined' && isMultiplayer) {
            submitAnswerMultiplayer();
        } else {
            submitAnswer();
        }
    }
});

// Close results overlay button
document.getElementById('results-close').addEventListener('click', function() {
    hideResults();
});

// Prevent submit bar clicks from propagating to map
document.getElementById('submit-bar').addEventListener('click', function(e) {
    e.stopPropagation();
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

    // Only show these categories (comment out others for now)
    const enabledCategories = ['sistersHistory'];

    for (const [key, category] of Object.entries(categories)) {
        if (!enabledCategories.includes(key)) continue;
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

// Category continue button - goes directly to lobby
document.getElementById('category-continue').addEventListener('click', function() {
    // Hide category screen and join lobby directly
    document.getElementById('category-screen').classList.add('hidden');
    const categoryKey = Object.keys(categories).find(key => categories[key] === selectedCategory);
    joinLobby(categoryKey, `Player_${Math.floor(Math.random() * 1000)}`);
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
