// Client-side authentication handler

class AuthClient {
    constructor() {
        this.accessToken = localStorage.getItem('accessToken');
        this.refreshToken = localStorage.getItem('refreshToken');
        this.user = null;

        // Check for tokens in URL (OAuth callback)
        this.handleOAuthCallback();
    }

    handleOAuthCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const refresh = urlParams.get('refresh');
        const error = urlParams.get('error');

        if (error) {
            console.error('Auth error:', error);
            this.showAuthError('Authentication failed. Please try again.');
            // Clean up URL
            window.history.replaceState({}, document.title, '/');
            return;
        }

        if (token && refresh) {
            this.setTokens(token, refresh);
            // Clean up URL
            window.history.replaceState({}, document.title, '/');
            // Load user and reconnect WebSocket
            this.loadUser().then(() => {
                if (typeof connectToServer === 'function') {
                    connectToServer();
                }
            });
        }
    }

    async loginWithGoogle() {
        window.location.href = '/auth/google';
    }

    async loginWithDiscord() {
        window.location.href = '/auth/discord';
    }

    async playAsGuest() {
        try {
            const response = await fetch('/auth/guest', { method: 'POST' });
            if (!response.ok) {
                throw new Error('Failed to create guest session');
            }
            const data = await response.json();
            this.setTokens(data.accessToken, data.refreshToken);
            this.user = data.user;
            this.updateUI();
            // Reconnect WebSocket with new token
            if (typeof connectToServer === 'function') {
                connectToServer();
            }
            return data.user;
        } catch (err) {
            console.error('Guest login error:', err);
            this.showAuthError('Failed to start guest session');
            return null;
        }
    }

    setTokens(access, refresh) {
        this.accessToken = access;
        this.refreshToken = refresh;
        localStorage.setItem('accessToken', access);
        localStorage.setItem('refreshToken', refresh);
    }

    clearTokens() {
        this.accessToken = null;
        this.refreshToken = null;
        this.user = null;
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
    }

    async refreshAccessToken() {
        if (!this.refreshToken) return false;

        try {
            const response = await fetch('/auth/refresh', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken: this.refreshToken })
            });

            if (response.ok) {
                const data = await response.json();
                this.accessToken = data.accessToken;
                localStorage.setItem('accessToken', data.accessToken);
                return true;
            }
            return false;
        } catch (err) {
            console.error('Token refresh error:', err);
            return false;
        }
    }

    async loadUser() {
        if (!this.accessToken) return null;

        try {
            let response = await fetch('/api/me', {
                headers: { 'Authorization': `Bearer ${this.accessToken}` }
            });

            // If token expired, try to refresh
            if (response.status === 401) {
                const refreshed = await this.refreshAccessToken();
                if (refreshed) {
                    response = await fetch('/api/me', {
                        headers: { 'Authorization': `Bearer ${this.accessToken}` }
                    });
                }
            }

            if (response.ok) {
                this.user = await response.json();
                this.updateUI();

                // Check if user needs to pick a username
                if (this.needsUsername()) {
                    this.showUsernameModal();
                }

                return this.user;
            }

            // Token invalid, clear
            this.clearTokens();
            return null;
        } catch (err) {
            console.error('Load user error:', err);
            return null;
        }
    }

    needsUsername() {
        // Decode JWT to check needsUsername flag
        if (!this.accessToken) return false;
        try {
            const payload = JSON.parse(atob(this.accessToken.split('.')[1]));
            return payload.needsUsername === true;
        } catch {
            return false;
        }
    }

    showUsernameModal() {
        const modal = document.getElementById('username-modal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    hideUsernameModal() {
        const modal = document.getElementById('username-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    async setUsername(username) {
        try {
            const response = await fetch('/api/set-username', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.accessToken}`
                },
                body: JSON.stringify({ username })
            });

            const data = await response.json();

            if (!response.ok) {
                return { success: false, error: data.error };
            }

            // Update tokens and user data
            this.setTokens(data.accessToken, data.refreshToken);
            this.user.username = data.user.username;
            this.user.username_customized = data.user.username_customized || true;
            this.updateUI();
            this.hideUsernameModal();

            // Reconnect WebSocket to pick up new username in auth
            if (typeof connectToServer === 'function') {
                connectToServer();
            }

            return { success: true };
        } catch (err) {
            console.error('Set username error:', err);
            return { success: false, error: 'Network error' };
        }
    }

    async checkUsernameAvailable(username) {
        try {
            const response = await fetch(`/api/check-username/${encodeURIComponent(username)}`);
            const data = await response.json();
            return data.available;
        } catch {
            return false;
        }
    }

    async logout() {
        try {
            await fetch('/auth/logout', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${this.accessToken}` }
            });
        } catch (err) {
            console.error('Logout error:', err);
        }
        this.clearTokens();
        this.updateUI();
        // Show login screen
        document.getElementById('login-screen')?.classList.remove('hidden');
        document.getElementById('category-screen')?.classList.add('hidden');
    }

    isLoggedIn() {
        return !!this.accessToken;
    }

    isGuest() {
        return this.user?.is_guest ?? true;
    }

    getToken() {
        return this.accessToken;
    }

    updateUI() {
        const loginScreen = document.getElementById('login-screen');
        const categoryScreen = document.getElementById('category-screen');
        const userProfile = document.getElementById('user-profile');

        if (this.user) {
            // User is logged in, show category screen
            if (loginScreen) loginScreen.classList.add('hidden');
            if (categoryScreen) categoryScreen.classList.remove('hidden');

            // Update profile display
            if (userProfile) {
                userProfile.classList.remove('hidden');
                const avatar = document.getElementById('user-avatar');
                const name = document.getElementById('user-name');
                const elo = document.getElementById('user-elo');

                if (avatar) {
                    avatar.src = this.user.avatar_url || '/img/default-avatar.png';
                    avatar.onerror = () => { avatar.style.display = 'none'; };
                }
                // Show custom username if set, otherwise display name
                if (name) name.textContent = this.user.username_customized
                    ? this.user.username
                    : (this.user.display_name || this.user.username);
                if (elo) elo.textContent = this.user.elo_rating || 1000;
            }
        } else {
            // Not logged in, show login screen
            if (loginScreen) loginScreen.classList.remove('hidden');
            if (categoryScreen) categoryScreen.classList.add('hidden');
            if (userProfile) userProfile.classList.add('hidden');
        }
    }

    showAuthError(message) {
        // Could show a toast or modal here
        alert(message);
    }

    // Get stats for display
    getStats() {
        if (!this.user) return null;
        return {
            elo: this.user.elo_rating,
            totalGames: this.user.total_games,
            wins: this.user.wins,
            losses: this.user.losses,
            winRate: this.user.win_rate,
            avgRoundScore: this.user.avg_round_score,
            avgDistanceError: this.user.avg_distance_error,
            avgYearError: this.user.avg_year_error,
            bestRoundScore: this.user.best_round_score,
            bestGameScore: this.user.best_game_score,
            currentWinStreak: this.user.current_win_streak,
            bestWinStreak: this.user.best_win_streak
        };
    }
}

// Global auth instance
const auth = new AuthClient();

// Initialize on page load
window.addEventListener('load', async () => {
    // Try to load user if we have a token
    if (auth.isLoggedIn()) {
        await auth.loadUser();
    }

    // Set up login button handlers
    document.getElementById('google-login-btn')?.addEventListener('click', () => {
        auth.loginWithGoogle();
    });

    document.getElementById('discord-login-btn')?.addEventListener('click', () => {
        auth.loginWithDiscord();
    });

    document.getElementById('guest-btn')?.addEventListener('click', async () => {
        await auth.playAsGuest();
    });

    document.getElementById('logout-btn')?.addEventListener('click', () => {
        auth.logout();
    });

    // Username modal handlers
    const usernameInput = document.getElementById('username-input');
    const usernameSubmit = document.getElementById('username-submit');
    const usernameError = document.getElementById('username-error');

    let checkTimeout = null;

    usernameInput?.addEventListener('input', async (e) => {
        const username = e.target.value.trim();
        usernameError.textContent = '';
        usernameError.className = '';

        // Validate format
        if (username.length < 3) {
            usernameSubmit.disabled = true;
            if (username.length > 0) {
                usernameError.textContent = 'Username must be at least 3 characters';
            }
            return;
        }

        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            usernameSubmit.disabled = true;
            usernameError.textContent = 'Only letters, numbers, and underscores allowed';
            return;
        }

        // Debounce availability check
        clearTimeout(checkTimeout);
        usernameSubmit.disabled = true;
        usernameError.textContent = 'Checking...';

        checkTimeout = setTimeout(async () => {
            const available = await auth.checkUsernameAvailable(username);
            if (available) {
                usernameError.textContent = 'Username available!';
                usernameError.className = 'success';
                usernameSubmit.disabled = false;
            } else {
                usernameError.textContent = 'Username is taken';
                usernameSubmit.disabled = true;
            }
        }, 300);
    });

    usernameSubmit?.addEventListener('click', async () => {
        const username = usernameInput.value.trim();
        usernameSubmit.disabled = true;
        usernameError.textContent = 'Setting username...';

        const result = await auth.setUsername(username);
        if (!result.success) {
            usernameError.textContent = result.error;
            usernameError.className = '';
            usernameSubmit.disabled = false;
        }
    });

    // Allow Enter key to submit
    usernameInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !usernameSubmit.disabled) {
            usernameSubmit.click();
        }
    });

    // Initial UI update
    auth.updateUI();
});
