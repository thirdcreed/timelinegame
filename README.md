# Timeline Geography - Multiplayer Game

A competitive multiplayer game where players guess the location and time of historical events.

## Features

- **5 Historical Categories**: Famous Disasters, Battles, World Leaders' Birthplaces, Soviet History, World History
- **Category-Specific Gameplay**: Each category has custom map zoom and timeline ranges
- **Real-time Multiplayer**: WebSocket-based player matching and live gameplay
- **Swiss Modernist Design**: Clean black, white, and red aesthetic inspired by Josef Müller-Brockmann

## How to Play

1. Select a historical category
2. Join a lobby (auto-matches with another player)
3. For each of 10 rounds:
   - Read the historical event name
   - Click on the map where you think it happened
   - Slide the timeline to when you think it happened
   - Release the slider to submit
4. Compete for the highest combined score!

## Scoring

- **Distance Accuracy**: 497.5 points max (closer = more points)
- **Year Accuracy**: 497.5 points max (closer = more points)
- **Speed Bonus**: 5 points max (tiebreaker only)
- **Timeout Penalty**: -50 points if time runs out

## Running the Game

### Start the Server

```bash
npm start
```

The server will run on `http://localhost:3000`

### Play the Game

1. Open `http://localhost:3000` in your browser
2. Open another browser window/tab (or have a friend connect)
3. Both players select the same category
4. Click "Begin" to join the lobby
5. Game auto-starts when 2 players are in the lobby!

## Technical Details

- **Frontend**: Vanilla JavaScript, Leaflet.js for maps
- **Backend**: Node.js, Express, WebSocket (ws library)
- **Real-time Communication**: WebSocket for instant player matching and game synchronization

## Files

- `index.html` - Main game interface
- `game.js` - Core game logic and single-player functionality
- `multiplayer.js` - WebSocket client and multiplayer features
- `server.js` - Backend server for player matching
- `package.json` - Node.js dependencies

## Future Enhancements

- Player names/accounts
- Ranked matchmaking
- More historical categories
- Custom category creation
- Spectator mode
- Replay system
