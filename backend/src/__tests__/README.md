# Backend Integration Tests

This directory contains comprehensive integration tests for the HomeGameHero backend API.

## Test Structure

### `/api/gameApi.test.ts`
Complete integration tests for all game API endpoints:

- **POST /api/games** - Create new game
  - Valid game creation
  - Unique code generation
  - Validation errors

- **GET /api/games/:code** - Get game by code  
  - Retrieve game with players
  - 404 for non-existent games
  - Code format validation
  - Total pot calculation

- **PUT /api/games/:id/chips** - Update player chips
  - Successful chip updates
  - Game/player not found errors
  - Completed game restrictions
  - Input validation

- **POST /api/games/:id/rebuy** - Add player rebuys
  - Single and multiple rebuys
  - Game/player not found errors
  - Game status restrictions
  - Amount validation

- **POST /api/games/:id/end** - End game with payouts
  - Payout calculations
  - Final rankings
  - Game status validation
  - Player validation

### `/setup/`
Test infrastructure files:

- **testDb.ts** - MongoDB Memory Server setup/teardown
- **testApp.ts** - Express app factory for tests  
- **jest.setup.ts** - Global test configuration

### Other Test Files
- `calculationService.test.ts` - Payout calculation logic
- `venmoOptimization.test.ts` - Payment optimization
- `groupCode.test.ts` - Game code generation
- `health.test.ts` - Health check endpoint
- `utils/money.test.ts` - Money utility functions

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- --testPathPattern=gameApi.test.ts

# Run with coverage
npm test -- --coverage

# Watch mode
npm test:watch
```

## Test Database

Tests use MongoDB Memory Server for complete isolation:
- Each test suite gets a fresh database
- No external MongoDB required
- Automatic cleanup after tests

## Best Practices

1. **Test Isolation** - Each test is independent
2. **Real HTTP Requests** - Uses supertest for actual API calls
3. **Full Stack Testing** - Tests middleware, validation, controllers, and database
4. **Error Scenarios** - Comprehensive error case coverage
5. **Async Handling** - Proper async/await usage throughout

## Configuration

See `jest.config.js` for test configuration:
- TypeScript support via ts-jest
- 30-second timeout for integration tests
- Serial execution for database tests
- Automatic mock clearing between tests