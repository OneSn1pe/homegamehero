# Database Models

This directory contains the MongoDB/Mongoose models for the HomeGameHero poker application.

## Models

### Game Model (`Game.ts`)

The main model representing a poker game session with the following structure:

- **groupCode**: Unique 6-digit alphanumeric code for joining the game
- **status**: Game state ('setup' | 'active' | 'completed')
- **leaderId**: ID of the game host/leader
- **chipConfig**: Configuration of chip colors and their dollar values
- **financials**: Buy-in amounts, total pot, and rebuy tracking
- **players**: Array of players with their chip counts and buy-in totals

## Usage

```typescript
import { Game } from '../models';
import { generateUniqueGroupCode } from '../utils/groupCode';

// Create a new game
const groupCode = await generateUniqueGroupCode();
const game = new Game({
  groupCode,
  leaderId: 'user123',
  // ... other fields
});
await game.save();

// Find a game by group code
const existingGame = await Game.findByGroupCode('ABC123');
```

## TypeScript Interfaces

All TypeScript interfaces are defined in `../types/models.ts`:

- `IGame`: Main game interface
- `IPlayer`: Player data structure
- `IChipColor`: Chip configuration
- `IRebuy`: Rebuy transaction

## Database Features

- **TTL Index**: Completed games are automatically deleted after 30 days
- **Indexes**: Optimized queries on groupCode, status, and createdAt
- **Validation**: Ensures minimum 2 players and at least 1 chip color
- **Case Handling**: Group codes are automatically uppercased for consistency