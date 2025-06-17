# Authentication and Security System

## Overview

The poker game app implements a leader-based authentication system where:
- Game creators receive a JWT leader token with full permissions
- Players can join with just a group code for read-only access
- Only leaders can modify game state (update chips, add rebuys, end game)

## Components

### 1. Authentication Middleware (`auth.ts`)
- `generateLeaderToken`: Creates JWT tokens for game leaders
- `authenticateLeader`: Verifies leader tokens and attaches auth info to requests
- `validateGroupAccess`: Checks user permissions based on token or group code
- `requireGameLeader`: Ensures the authenticated user is the game leader

### 2. Auth Service (`authService.ts`)
- `generateGameSession`: Core JWT token generation
- `verifyLeaderToken`: Token verification and decoding
- `validateGameAccess`: Permission checking logic
- `extractTokenFromHeader`: Bearer token extraction utility

### 3. Rate Limiting (`rateLimiter.ts`)
- Game creation: 5 per hour per IP
- General API: 100 requests per minute per IP
- Strict operations: 20 requests per minute per IP
- WebSocket connections: 10 per minute per IP

### 4. Security Middleware (`security.ts`)
- Input sanitization (NoSQL injection prevention)
- XSS protection headers
- Parameter validation (ObjectId, game codes)
- Parameter pollution prevention

## Usage

### Creating a Game
```bash
POST /api/games
Content-Type: application/json

{
  "hostName": "John Doe",
  "buyIn": 50,
  "chipValues": { ... },
  "blindStructure": [ ... ]
}

Response:
{
  "success": true,
  "data": {
    "gameId": "...",
    "code": "ABC123",
    "leaderToken": "eyJ..."
  }
}
```

### Authenticated Requests (Leader Only)
```bash
PUT /api/games/{gameId}/chips
Authorization: Bearer {leaderToken}
Content-Type: application/json

{
  "playerId": "...",
  "chips": 1000
}
```

### Public Access (Read-Only)
```bash
GET /api/games/{gameCode}
# No authentication required
```

## Security Features

1. **JWT Authentication**
   - Tokens expire after 24 hours
   - Tokens are tied to specific games
   - Leader tokens grant full permissions

2. **Rate Limiting**
   - Prevents abuse and DDoS attacks
   - Different limits for different operations
   - Authenticated users may bypass certain limits

3. **Input Validation**
   - MongoDB ObjectId format validation
   - Game code format validation (6 uppercase alphanumeric)
   - Content-type enforcement
   - Request size limits

4. **Security Headers**
   - Helmet.js for basic security headers
   - Additional XSS protection
   - Content Security Policy
   - CORS configuration

## Environment Variables

```env
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=24h
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

## Testing

Run authentication tests:
```bash
npm test -- auth.test.ts
npm test -- security.test.ts
npm test -- rateLimiter.test.ts
npm test -- authFlow.test.ts
```