# Security Documentation

## Overview
This document outlines the security measures implemented in the Poker Home Game API.

## Authentication & Authorization

### Leader Token System
- Game creators receive a JWT token upon game creation
- Token contains gameId and leaderId
- Required for all write operations (chip updates, rebuys, ending game)
- Tokens expire after 7 days

### Access Levels
1. **Leader Access** - Full read/write permissions
   - Requires valid JWT token in Authorization header
   - Can update chips, add rebuys, end game
   
2. **Player Access** - Read-only permissions
   - Only requires valid group code
   - Can view game state and calculations

### Token Usage
```javascript
// Creating a game returns a leader token
const response = await fetch('/api/games', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(gameData)
});
const { leaderToken } = response.data;

// Use token for protected operations
await fetch(`/api/games/${gameId}/chips`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${leaderToken}`
  },
  body: JSON.stringify(chipUpdate)
});
```

## Rate Limiting

### Limits
- **Game Creation**: 5 games per hour per IP
- **API Calls**: 100 requests per minute per IP

### Headers
Rate limit information is returned in response headers:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Time when limit resets

## Input Validation & Sanitization

### NoSQL Injection Prevention
- All MongoDB queries are sanitized using express-mongo-sanitize
- Removes any keys starting with '$' or containing dots
- Prevents operator injection attacks

### XSS Protection
- Input validation rejects HTML tags and script content
- Suspicious patterns trigger validation errors
- Content-Type must be application/json for POST/PUT requests

### Parameter Validation
- ObjectId parameters validated for correct format
- Game codes validated for 6-character alphanumeric format
- Numeric values checked for valid ranges

## Security Headers

Using Helmet.js, the following headers are set:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000`
- `X-DNS-Prefetch-Control: off`
- `X-Download-Options: noopen`
- `X-Permitted-Cross-Domain-Policies: none`

## CORS Configuration
- Configured to accept requests from allowed origins
- Credentials supported for authenticated requests

## Best Practices

### Environment Variables
- JWT_SECRET stored in environment variables
- Never committed to version control
- Strong, randomly generated secrets

### Error Handling
- Generic error messages for authentication failures
- Detailed errors logged server-side only
- Stack traces never exposed to clients

### Session Management
- Tokens are stateless (JWT)
- No server-side session storage required
- Tokens include expiration claims

## Security Checklist

- [x] Authentication system implemented
- [x] Authorization checks on all write operations
- [x] Rate limiting configured
- [x] Input validation and sanitization
- [x] NoSQL injection prevention
- [x] XSS protection
- [x] Security headers configured
- [x] CORS properly configured
- [x] Environment variables for secrets
- [x] Error messages don't leak sensitive info

## Reporting Security Issues

If you discover a security vulnerability, please email security@homegamehero.com with:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)