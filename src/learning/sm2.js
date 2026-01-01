// SM-2 Spaced Repetition Algorithm
// Based on SuperMemo 2 with modifications for geography/history learning

/**
 * Calculate quality score (0-5) from year error and distance
 * @param {number} yearError - Absolute year error
 * @param {number} distanceKm - Distance error in kilometers
 * @returns {number} Quality score 0-5
 */
function calculateQuality(yearError, distanceKm) {
    // Year component (0-2.5 points)
    let yearScore;
    if (yearError === 0) {
        yearScore = 2.5;
    } else if (yearError <= 10) {
        yearScore = 2.0;
    } else if (yearError <= 20) {
        yearScore = 1.0;
    } else {
        yearScore = 0;
    }

    // Distance component (0-2.5 points)
    let distanceScore;
    if (distanceKm < 20) {
        distanceScore = 2.5;
    } else if (distanceKm < 35) {
        distanceScore = 1.5;
    } else if (distanceKm < 50) {
        distanceScore = 0.5;
    } else {
        distanceScore = 0;
    }

    // Total quality (0-5)
    return Math.round(yearScore + distanceScore);
}

/**
 * Calculate "learnedness" level for progress bar
 * @param {Object} progress - User event progress record
 * @returns {Object} { level: 'new'|'learning'|'mastered', percentage: 0-100 }
 */
function calculateLearnedness(progress) {
    if (!progress || progress.repetitions === 0) {
        return { level: 'new', percentage: 0 };
    }

    const easeFactor = parseFloat(progress.ease_factor) || 2.5;
    const repetitions = progress.repetitions || 0;

    // Mastered: ease_factor >= 2.5 and 3+ successful repetitions
    if (easeFactor >= 2.5 && repetitions >= 3) {
        // Scale from 66% to 100% based on additional reps and ease
        const extraReps = Math.min(repetitions - 3, 7); // Cap at 10 total reps
        const easeBonus = Math.min((easeFactor - 2.5) / 0.5, 1); // Bonus for ease > 2.5
        const percentage = 66 + (extraReps / 7) * 25 + easeBonus * 9;
        return { level: 'mastered', percentage: Math.min(100, Math.round(percentage)) };
    }

    // Learning: has some reps but not mastered
    if (repetitions > 0) {
        // Scale from 33% to 66% based on reps and ease
        const repProgress = Math.min(repetitions / 3, 1);
        const easeProgress = Math.max(0, (easeFactor - 1.3) / 1.2); // 1.3 to 2.5 range
        const percentage = 33 + (repProgress * 0.5 + easeProgress * 0.5) * 33;
        return { level: 'learning', percentage: Math.round(percentage) };
    }

    return { level: 'new', percentage: 0 };
}

/**
 * SM-2 Algorithm: Calculate next review parameters
 * @param {Object} current - Current progress { ease_factor, interval_days, repetitions }
 * @param {number} quality - Quality of response (0-5)
 * @returns {Object} Updated parameters { ease_factor, interval_days, repetitions, next_review }
 */
function calculateNextReview(current, quality) {
    let easeFactor = parseFloat(current?.ease_factor) || 2.5;
    let intervalDays = current?.interval_days || 1;
    let repetitions = current?.repetitions || 0;

    if (quality < 3) {
        // Failed recall - reset repetitions, short interval
        repetitions = 0;
        intervalDays = 1;
    } else {
        // Successful recall
        if (repetitions === 0) {
            intervalDays = 1;
        } else if (repetitions === 1) {
            intervalDays = 6;
        } else {
            intervalDays = Math.round(intervalDays * easeFactor);
        }
        repetitions += 1;
    }

    // Update ease factor (minimum 1.3)
    easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    easeFactor = Math.max(1.3, easeFactor);

    // Calculate next review date
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + intervalDays);

    return {
        ease_factor: Math.round(easeFactor * 100) / 100,
        interval_days: intervalDays,
        repetitions: repetitions,
        next_review: nextReview
    };
}

/**
 * Select next event for learning session
 * Priority: 1. Overdue, 2. New (limited), 3. Due soon
 * @param {Array} allEvents - All events in category
 * @param {Array} progressRecords - User's progress for this category
 * @param {number} maxNewPerSession - Max new cards to introduce (default 10)
 * @returns {Object} Next event to show
 */
function selectNextEvent(allEvents, progressRecords, maxNewPerSession = 10) {
    const now = new Date();
    const progressMap = new Map();

    // Build lookup map
    for (const record of progressRecords) {
        progressMap.set(record.event_name, record);
    }

    // Categorize events
    const overdue = [];
    const newEvents = [];
    const upcoming = [];
    const notDue = [];

    // Count new cards shown this session (approximation - cards with 1 rep today)
    const newCardsToday = progressRecords.filter(r => {
        if (r.repetitions !== 1) return false;
        const lastReview = new Date(r.last_review);
        return lastReview.toDateString() === now.toDateString();
    }).length;

    for (const event of allEvents) {
        const progress = progressMap.get(event.name);

        if (!progress) {
            // Never seen - it's new
            if (newCardsToday < maxNewPerSession) {
                newEvents.push({ event, progress: null, priority: 0 });
            }
        } else if (progress.repetitions === 0) {
            // Seen but failed - treat as overdue
            overdue.push({ event, progress, priority: 1 });
        } else {
            const nextReview = new Date(progress.next_review);
            if (nextReview <= now) {
                // Overdue
                const daysOverdue = (now - nextReview) / (1000 * 60 * 60 * 24);
                overdue.push({ event, progress, priority: daysOverdue });
            } else {
                // Not yet due
                const daysUntilDue = (nextReview - now) / (1000 * 60 * 60 * 24);
                notDue.push({ event, progress, priority: daysUntilDue });
            }
        }
    }

    // Sort by priority
    overdue.sort((a, b) => b.priority - a.priority); // Most overdue first
    notDue.sort((a, b) => a.priority - b.priority); // Soonest due first

    // Selection logic: prioritize overdue, mix in new, then upcoming
    // Ratio: 70% due/overdue, 20% new, 10% preview upcoming
    const rand = Math.random();

    if (overdue.length > 0 && (rand < 0.7 || newEvents.length === 0)) {
        return overdue[0];
    }

    if (newEvents.length > 0 && rand < 0.9) {
        // Random new event
        const idx = Math.floor(Math.random() * newEvents.length);
        return newEvents[idx];
    }

    if (overdue.length > 0) {
        return overdue[0];
    }

    if (newEvents.length > 0) {
        const idx = Math.floor(Math.random() * newEvents.length);
        return newEvents[idx];
    }

    // Nothing due - show upcoming as preview (won't update progress significantly)
    if (notDue.length > 0) {
        return notDue[0];
    }

    // All events mastered and nothing due - random
    const idx = Math.floor(Math.random() * allEvents.length);
    return { event: allEvents[idx], progress: progressMap.get(allEvents[idx].name) };
}

/**
 * Calculate overall category learnedness from all events
 * @param {Array} allEvents - All events in category
 * @param {Array} progressRecords - User's progress for this category
 * @returns {number} Overall learnedness percentage 0-100
 */
function calculateCategoryLearnedness(allEvents, progressRecords) {
    if (!allEvents || allEvents.length === 0) return 0;

    const progressMap = new Map();
    for (const record of progressRecords) {
        progressMap.set(record.event_name, record);
    }

    let totalLearnedness = 0;
    for (const event of allEvents) {
        const progress = progressMap.get(event.name);
        const learnedness = calculateLearnedness(progress);
        totalLearnedness += learnedness.percentage;
    }

    return Math.round(totalLearnedness / allEvents.length);
}

module.exports = {
    calculateQuality,
    calculateLearnedness,
    calculateNextReview,
    selectNextEvent,
    calculateCategoryLearnedness
};
