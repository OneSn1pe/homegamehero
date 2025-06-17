# Poker Game API Documentation

## Base URL
```
http://localhost:3001/api
```

## Endpoints

### 1. Create Game
Creates a new poker game with a unique 6-character code.

**Endpoint:** `POST /games`

**Request Body:**
```json
{
  "leaderId": "string",
  "chipConfig": {
    "colors": [
      {
        "name": "string",
        "value": "number"
      }
    ]
  },
  "financials": {
    "initialBuyIn": "number",
    "totalPot": "number"
  },
  "players": [
    {
      "name": "string",
      "initialChips": {
        "colorName": "number"
      },
      "currentChips": {
        "colorName": "number"
      },
      "totalBuyIn": "number"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "groupCode": "ABC123",
    "status": "setup",
    // ... full game object
  }
}
```

### 2. Get Game by Code
Retrieves a game using its 6-character code.

**Endpoint:** `GET /games/:code`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "groupCode": "ABC123",
    "status": "active",
    "players": [...],
    // ... full game object
  }
}
```

### 3. Update Player Chips
Updates a player's current chip count.

**Endpoint:** `PUT /games/:id/chips`

**Request Body:**
```json
{
  "playerId": "string",
  "currentChips": {
    "White": 25,
    "Red": 10,
    "Green": 2
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    // Updated game object
  }
}
```

### 4. Add Rebuy
Records a player rebuy.

**Endpoint:** `POST /games/:id/rebuy`

**Request Body:**
```json
{
  "playerName": "string",
  "amount": 100,
  "chipsByColor": {
    "White": 25,
    "Red": 10,
    "Green": 2
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    // Updated game object with new rebuy
  }
}
```

### 5. End Game
Ends the game and calculates final payouts.

**Endpoint:** `POST /games/:id/end`

**Response:**
```json
{
  "success": true,
  "data": {
    "game": { /* game object */ },
    "calculations": {
      "playerEarnings": [
        {
          "name": "Alice",
          "chipValue": 250,
          "netEarnings": 150,
          "earningsPercentage": 150
        }
      ],
      "payouts": [
        {
          "name": "Alice",
          "finalPayout": 250,
          "netGain": 150
        }
      ],
      "venmoPayments": [
        {
          "from": "Bob",
          "to": "Alice",
          "amount": 50,
          "note": "Poker game settlement"
        }
      ],
      "validation": {
        "isValid": true,
        "totalChips": 400,
        "totalPot": 400
      }
    }
  }
}
```

## Error Responses

All errors follow this format:
```json
{
  "success": false,
  "error": "Error message",
  "details": { /* optional validation details */ }
}
```

### Common Error Codes:
- `400` - Bad Request (validation error)
- `404` - Not Found (game or player not found)
- `500` - Internal Server Error

## Game Status Values
- `setup` - Initial game setup
- `active` - Game in progress
- `completed` - Game finished

## Validation Rules

### Game Creation
- `leaderId` required
- At least 1 chip color with positive value
- At least 2 players
- Initial buy-in must be positive
- Total pot must be positive

### Chip Updates
- Player must exist in game
- Game must be active
- Chips values must be non-negative

### Rebuys
- Player must exist in game
- Game must be active
- Amount must be positive
- Chip distribution required

### Game End
- Game must not already be completed
- All chip counts must be current

## Example Usage

```javascript
// Create a game
const response = await fetch('http://localhost:3001/api/games', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    leaderId: 'host-123',
    chipConfig: {
      colors: [
        { name: 'White', value: 1 },
        { name: 'Red', value: 5 }
      ]
    },
    financials: {
      initialBuyIn: 100,
      totalPot: 200
    },
    players: [
      {
        name: 'Alice',
        initialChips: { White: 50, Red: 10 },
        currentChips: { White: 50, Red: 10 },
        totalBuyIn: 100
      },
      {
        name: 'Bob',
        initialChips: { White: 50, Red: 10 },
        currentChips: { White: 50, Red: 10 },
        totalBuyIn: 100
      }
    ]
  })
});

const game = await response.json();
console.log('Game Code:', game.data.groupCode);
```