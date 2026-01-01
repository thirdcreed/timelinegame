// Learning Mode - Spaced Repetition for Timeline Geography

let isLearningMode = false;
let learningCategoryKey = null;
let learningStats = null;
let currentLearningEvent = null;

// Start learning mode for a category
function startLearningMode(categoryKey) {
    if (!auth.isLoggedIn() || auth.isGuest()) {
        alert('Please sign in with Google or Discord to use Learning Mode (guest accounts cannot save progress)');
        return;
    }

    learningCategoryKey = categoryKey;
    isLearningMode = true;

    // Send start message to server
    sendToServer({
        type: 'learning_start',
        categoryKey: categoryKey
    });
}

// Exit learning mode
function exitLearningMode() {
    isLearningMode = false;
    learningCategoryKey = null;
    currentLearningEvent = null;
    learningStats = null;

    // Hide game screen, show category screen
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('category-screen').classList.remove('hidden');

    // Reset UI elements
    hideTimeline();
    hideResults();
    hideLearningResultModal();

    // Clear markers
    if (userMarker) {
        map.removeLayer(userMarker);
        userMarker = null;
    }
    if (correctMarker) {
        map.removeLayer(correctMarker);
        correctMarker = null;
    }
    map.eachLayer((layer) => {
        if (layer instanceof L.Polyline) {
            map.removeLayer(layer);
        }
    });
}

// Request next learning event
function requestNextLearningEvent() {
    sendToServer({ type: 'learning_next' });
}

// Handle learning mode started
function handleLearningStarted(data) {
    learningStats = data.stats;

    // Hide all overlay screens - the game UI (map, timeline) is always behind them
    document.getElementById('category-screen').classList.add('hidden');
    document.getElementById('lobby-screen').classList.add('hidden');
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('login-screen').classList.add('hidden');

    // Update header for learning mode
    updateLearningHeader();

    // Hide timer (not used in learning mode)
    const timer = document.getElementById('timer');
    if (timer) timer.style.display = 'none';

    // Request first event
    requestNextLearningEvent();
}

// Handle receiving a learning event
function handleLearningEvent(data) {
    currentLearningEvent = data;

    // Reset state
    guessLatLng = null;
    answerSubmitted = false;
    hideTimeline();
    hideLearningResultModal();
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
    map.eachLayer((layer) => {
        if (layer instanceof L.Polyline) {
            map.removeLayer(layer);
        }
    });

    // Set map view
    map.setView(data.category.mapCenter, data.category.mapZoom);

    // Update event text
    document.getElementById('event-text').textContent = data.event.name;

    // Update timeline range
    const timelineEl = document.getElementById('timeline');
    timelineEl.min = data.category.timelineMin;
    timelineEl.max = data.category.timelineMax;
    const midYear = Math.floor((data.category.timelineMin + data.category.timelineMax) / 2);
    timelineEl.value = midYear;
    document.getElementById('year-display').textContent = formatYear(midYear);
    document.getElementById('year-input').value = midYear;
    updateTimelineTicks(data.category.timelineMin, data.category.timelineMax);

    // Update header with stats
    updateLearningHeader();
}

// Submit learning answer
function submitLearningAnswer() {
    if (!guessLatLng || answerSubmitted) return;

    answerSubmitted = true;
    const guessedYear = parseInt(document.getElementById('timeline').value);

    sendToServer({
        type: 'learning_submit',
        guessLat: guessLatLng.lat,
        guessLng: guessLatLng.lng,
        guessYear: guessedYear
    });
}

// Handle learning result
function handleLearningResult(data) {
    // Disable timeline controls
    document.getElementById('timeline').disabled = true;
    document.getElementById('year-input').disabled = true;
    document.querySelectorAll('.nudge-btn').forEach(btn => btn.disabled = true);

    // Show correct location on map
    if (correctMarker) {
        map.removeLayer(correctMarker);
    }
    correctMarker = L.marker([data.correct.lat, data.correct.lng], {
        icon: L.divIcon({
            className: 'correct-marker',
            html: '<div style="background: #ffffff; width: 16px; height: 16px; border: 3px solid #000000;"></div>',
            iconSize: [16, 16],
            iconAnchor: [8, 8]
        })
    }).addTo(map);

    // Draw line between guess and correct
    L.polyline([[guessLatLng.lat, guessLatLng.lng], [data.correct.lat, data.correct.lng]], {
        color: '#ff0000',
        weight: 2,
        opacity: 1,
        dashArray: '8, 8'
    }).addTo(map);

    // Fit map to show both markers
    map.fitBounds([
        guessLatLng,
        [data.correct.lat, data.correct.lng]
    ], { padding: [50, 50] });

    // Show timeline comparison
    const timeline = document.getElementById('timeline');
    showTimelineComparison(data.guess.year, data.correct.year, timeline);

    // Update stats
    learningStats = data.stats;

    // Show learning result modal after a short delay
    setTimeout(() => {
        showLearningResultModal(data);
    }, 1500);
}

// Show learning-specific result modal
function showLearningResultModal(data) {
    let modal = document.getElementById('learning-result-modal');
    if (!modal) {
        createLearningResultModal();
        modal = document.getElementById('learning-result-modal');
    }

    // Update content
    document.getElementById('learning-distance-error').textContent = `${data.distanceKm} km`;
    document.getElementById('learning-year-error').textContent = `${data.yearError} years`;
    document.getElementById('learning-correct-answer').textContent = `${data.correct.location}, ${formatYear(data.correct.year)}`;

    // Update quality indicator
    const qualityText = ['Failed', 'Poor', 'Weak', 'Okay', 'Good', 'Perfect'][data.quality];
    document.getElementById('learning-quality').textContent = qualityText;
    document.getElementById('learning-quality').className = 'learning-quality quality-' + data.quality;

    // Update next review
    if (data.nextReview.days === 1) {
        document.getElementById('learning-next-review').textContent = 'Tomorrow';
    } else if (data.nextReview.days < 7) {
        document.getElementById('learning-next-review').textContent = `In ${data.nextReview.days} days`;
    } else if (data.nextReview.days < 30) {
        document.getElementById('learning-next-review').textContent = `In ${Math.round(data.nextReview.days / 7)} weeks`;
    } else {
        document.getElementById('learning-next-review').textContent = `In ${Math.round(data.nextReview.days / 30)} months`;
    }

    // Update progress bar
    const progressBar = document.getElementById('learning-progress-bar');
    const progressFill = document.getElementById('learning-progress-fill');
    progressFill.style.width = data.learnedness.percentage + '%';
    progressFill.className = 'learning-progress-fill level-' + data.learnedness.level;

    // Update stats
    document.getElementById('learning-stats-mastered').textContent = data.stats.mastered;
    document.getElementById('learning-stats-total').textContent = data.stats.totalEvents;
    document.getElementById('learning-stats-due').textContent = data.stats.due;

    // Show modal
    modal.classList.add('active');
}

// Hide learning result modal
function hideLearningResultModal() {
    const modal = document.getElementById('learning-result-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Create the learning result modal HTML
function createLearningResultModal() {
    const modal = document.createElement('div');
    modal.id = 'learning-result-modal';
    modal.className = 'learning-result-modal';
    modal.innerHTML = `
        <div class="learning-result-content">
            <h2>Result</h2>

            <div class="learning-result-row">
                <span class="label">Location Error</span>
                <span class="value" id="learning-distance-error">0 km</span>
            </div>

            <div class="learning-result-row">
                <span class="label">Year Error</span>
                <span class="value" id="learning-year-error">0 years</span>
            </div>

            <div class="learning-result-row">
                <span class="label">Correct Answer</span>
                <span class="value" id="learning-correct-answer"></span>
            </div>

            <div class="learning-result-row">
                <span class="label">Rating</span>
                <span class="value" id="learning-quality">Good</span>
            </div>

            <div class="learning-progress-section">
                <div class="learning-progress-label">Learnedness</div>
                <div class="learning-progress-bar" id="learning-progress-bar">
                    <div class="learning-progress-fill" id="learning-progress-fill"></div>
                </div>
            </div>

            <div class="learning-result-row">
                <span class="label">Next Review</span>
                <span class="value" id="learning-next-review">Tomorrow</span>
            </div>

            <div class="learning-stats-row">
                <span><span id="learning-stats-mastered">0</span>/<span id="learning-stats-total">0</span> mastered</span>
                <span><span id="learning-stats-due">0</span> due</span>
            </div>

            <div class="learning-buttons">
                <button id="learning-next-btn" onclick="handleLearningNextClick()">Next Event</button>
                <button id="learning-exit-btn" onclick="exitLearningMode()">Exit</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Handle next button click
function handleLearningNextClick() {
    hideLearningResultModal();
    requestNextLearningEvent();
}

// Update learning mode header
function updateLearningHeader() {
    const roundInfo = document.getElementById('round-info');
    const pct = learningStats?.categoryLearnedness || 0;

    // Calculate color based on percentage (red -> yellow -> green)
    let color;
    if (pct < 50) {
        const ratio = pct / 50;
        const r = 255;
        const g = Math.round(170 * ratio);
        color = `rgb(${r}, ${g}, 0)`;
    } else {
        const ratio = (pct - 50) / 50;
        const r = Math.round(255 * (1 - ratio));
        const g = Math.round(170 + 85 * ratio);
        color = `rgb(${r}, ${g}, 0)`;
    }

    roundInfo.innerHTML = `<span class="learning-pct" style="color: ${color}">${pct}%</span>`;
}

// Add CSS for learning mode
function addLearningModeStyles() {
    if (document.getElementById('learning-mode-styles')) return;

    const style = document.createElement('style');
    style.id = 'learning-mode-styles';
    style.textContent = `
        /* Learning header display */
        #round-info:has(.learning-pct) {
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .learning-pct {
            font-size: 36px;
            font-weight: 700;
            font-variant-numeric: tabular-nums;
            letter-spacing: -0.02em;
        }

        .learning-result-modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }

        .learning-result-modal.active {
            display: flex;
        }

        .learning-result-content {
            background: #ffffff;
            padding: 32px;
            max-width: 400px;
            width: 90%;
        }

        .learning-result-content h2 {
            margin: 0 0 24px 0;
            font-size: 24px;
            font-weight: 700;
        }

        .learning-result-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 12px;
            font-size: 14px;
        }

        .learning-result-row .label {
            color: #666666;
        }

        .learning-result-row .value {
            font-weight: 600;
        }

        .learning-quality {
            font-weight: 700 !important;
        }

        .learning-quality.quality-0,
        .learning-quality.quality-1 { color: #ff0000; }
        .learning-quality.quality-2 { color: #ff6600; }
        .learning-quality.quality-3 { color: #ffaa00; }
        .learning-quality.quality-4 { color: #88cc00; }
        .learning-quality.quality-5 { color: #00aa00; }

        .learning-progress-section {
            margin: 20px 0;
        }

        .learning-progress-label {
            font-size: 12px;
            color: #666666;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .learning-progress-bar {
            height: 16px;
            background: #eeeeee;
            position: relative;
            overflow: hidden;
        }

        .learning-progress-fill {
            height: 100%;
            transition: width 0.5s ease;
        }

        .learning-progress-fill.level-new {
            background: linear-gradient(90deg, #ff0000, #ff3333);
            width: 5%;
        }

        .learning-progress-fill.level-learning {
            background: linear-gradient(90deg, #ff6600, #ffaa00);
        }

        .learning-progress-fill.level-mastered {
            background: linear-gradient(90deg, #88cc00, #00aa00);
        }

        .learning-stats-row {
            display: flex;
            justify-content: space-between;
            margin: 20px 0;
            font-size: 13px;
            color: #888888;
        }

        .learning-buttons {
            display: flex;
            gap: 12px;
            margin-top: 24px;
        }

        .learning-buttons button {
            flex: 1;
            padding: 12px 24px;
            font-size: 14px;
            font-weight: 600;
            border: none;
            cursor: pointer;
        }

        #learning-next-btn {
            background: #000000;
            color: #ffffff;
        }

        #learning-next-btn:hover {
            background: #333333;
        }

        #learning-exit-btn {
            background: #eeeeee;
            color: #000000;
        }

        #learning-exit-btn:hover {
            background: #dddddd;
        }
    `;
    document.head.appendChild(style);
}

// Initialize learning mode
function initLearningMode() {
    addLearningModeStyles();
}

// Call on page load
if (typeof window !== 'undefined') {
    window.addEventListener('load', initLearningMode);
}
