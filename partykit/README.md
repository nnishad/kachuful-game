# Card Masters PartyKit Server

Real-time multiplayer game server for Card Masters using PartyKit.

## Setup

1. Install dependencies:
```bash
cd partykit
yarn install
```

2. Run development server:
```bash
yarn dev
```

The server will run on `http://localhost:1999`. PartyKit does **not** whitelist IPs; the only requirement is that your client can reach the host/port you pass into `PartySocket`. When developing on a device, make sure the device is on the same network and that you use your machine's LAN IP (e.g. `192.168.x.x:1999`).

## Deploy

Deploy to PartyKit cloud (publicly reachable over HTTPS/WebSocket):
```bash
yarn deploy
```

After the first deploy PartyKit prints a domain such as `https://card-masters.partykit.dev`. Point the Expo client to this hostname through `EXPO_PUBLIC_PARTYKIT_HOST` to allow anyone on the internet (iOS, Android, or web) to connect without additional IP configuration.

## Environment Variables

For the Expo app, create `.env` file:
```
EXPO_PUBLIC_PARTYKIT_HOST=your-project.party.sh
```

For local development, set the host to whatever IP/port your PartyKit dev server is bound to (e.g. `192.168.0.42:1999` so that simulators and devices can reach it):
```
EXPO_PUBLIC_PARTYKIT_HOST=192.168.0.42:1999
```

## Game Flow

1. Players join a room with a room ID
2. Players mark themselves as "ready"
3. Game starts when all players (min 2) are ready
4. Players take turns playing cards
5. First player to reach 100 points wins

## API

### Client Messages

- `join` - Join game room with player name
- `ready` - Mark player as ready to start
- `play_card` - Play a card from hand
- `chat` - Send chat message
- `leave` - Leave game room

### Server Messages

- `game_state` - Full game state update
- `player_joined` - New player joined
- `player_left` - Player left/disconnected
- `turn_update` - Turn changed
- `game_started` - Game has started
- `game_ended` - Game finished with winner
- `chat` - Chat message broadcast
- `error` - Error message
