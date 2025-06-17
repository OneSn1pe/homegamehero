# Poker Home Game Organizing Website
## Workflow & Technical Documentation

### 1. Core User Flows

#### 1.1 Group Creation Flow (Leader/Host)
1. **Create New Game**
   - User clicks "Create New Game"
   - System generates unique 6-digit alphanumeric group code
   - User becomes the group leader with full edit permissions

2. **Game Setup Configuration**
   - **Chip Configuration**
     - Add chip colors (e.g., White, Red, Green, Black, Purple)
     - Set value for each color (e.g., White = $1, Red = $5, Green = $25)
     - Validate that values are positive numbers
   
   - **Financial Setup**
     - Set initial buy-in cost per player
     - Set total initial pot value (sum of all buy-ins)
   
   - **Player Management**
     - Add player names (minimum 2, maximum 10 recommended)
     - Assign initial chip distribution per player by color
     - Validate that total chips distributed matches expected amounts

3. **Share Group Code**
   - Display group code prominently
   - Provide shareable link with embedded code
   - Generate QR code for easy mobile access

#### 1.2 Player Join Flow
1. **Join Game**
   - Enter 6-digit group code
   - System validates code exists and is active
   - User gains read-only access to game data

2. **View Game Status**
   - See current chip counts and player standings
   - View payout calculations in real-time
   - Access Venmo payment map when game concludes

#### 1.3 Game Management Flow (Leader Only)
1. **During Game Updates**
   - Update player chip counts as game progresses
   - Record re-buys with player name and chip amount
   - Add re-buy financial contributions to pot

2. **End Game Calculations**
   - Finalize all chip counts
   - Generate earnings report
   - Create optimized Venmo payment map
   - Share final results with all players

### 2. Data Structure & Storage

#### 2.1 Core Data Models

```javascript
Game {
  id: string (UUID)
  groupCode: string (6-digit alphanumeric)
  createdAt: timestamp
  status: 'setup' | 'active' | 'completed'
  leaderId: string
  
  chipConfig: {
    colors: [
      {
        name: string,
        value: number (dollars)
      }
    ]
  }
  
  financials: {
    initialBuyIn: number (dollars)
    totalPot: number (dollars, includes re-buys)
    rebuys: [
      {
        playerName: string,
        amount: number (dollars),
        chipsByColor: object,
        timestamp: timestamp
      }
    ]
  }
  
  players: [
    {
      name: string,
      initialChips: object, // {color: count}
      currentChips: object, // {color: count}
      totalBuyIn: number (dollars)
    }
  ]
}
```

#### 2.2 Database Schema Considerations
- Use NoSQL (MongoDB/Firestore) for flexible chip color configurations
- Implement real-time synchronization for live updates
- Set TTL (time-to-live) for automatic cleanup of old games
- Index on groupCode for fast lookups

### 3. Core Calculation Algorithms

#### 3.1 Player Earnings Calculation

```javascript
function calculatePlayerEarnings(player, chipConfig) {
  let totalValue = 0;
  
  for (const [color, count] of Object.entries(player.currentChips)) {
    const chipValue = chipConfig.colors.find(c => c.name === color)?.value || 0;
    totalValue += count * chipValue;
  }
  
  return {
    chipValue: totalValue,
    netEarnings: totalValue - player.totalBuyIn,
    earningsPercentage: ((totalValue - player.totalBuyIn) / player.totalBuyIn) * 100
  };
}
```

#### 3.2 Payout Distribution Algorithm

```javascript
function calculatePayouts(players, totalPot) {
  const results = players.map(player => ({
    name: player.name,
    chipValue: calculatePlayerEarnings(player).chipValue,
    buyIn: player.totalBuyIn
  }));
  
  // Validate total chip value matches pot
  const totalChipValue = results.reduce((sum, p) => sum + p.chipValue, 0);
  if (Math.abs(totalChipValue - totalPot) > 0.01) {
    throw new Error('Chip values do not match total pot');
  }
  
  return results.map(player => ({
    ...player,
    finalPayout: player.chipValue,
    netGain: player.chipValue - player.buyIn
  }));
}
```

#### 3.3 Venmo Payment Map Generation

```javascript
function generateVenmoMap(payouts) {
  // Separate winners and losers
  const winners = payouts.filter(p => p.netGain > 0);
  const losers = payouts.filter(p => p.netGain < 0);
  
  // Sort for optimal pairing
  winners.sort((a, b) => b.netGain - a.netGain);
  losers.sort((a, b) => a.netGain - b.netGain);
  
  const payments = [];
  let winnerIndex = 0;
  let loserIndex = 0;
  
  while (winnerIndex < winners.length && loserIndex < losers.length) {
    const winner = winners[winnerIndex];
    const loser = losers[loserIndex];
    
    const amountOwed = Math.abs(loser.netGain);
    const amountToPay = Math.min(winner.netGain, amountOwed);
    
    if (amountToPay > 0.01) { // Avoid tiny payments
      payments.push({
        from: loser.name,
        to: winner.name,
        amount: Math.round(amountToPay * 100) / 100,
        note: `Poker game settlement`
      });
      
      winner.netGain -= amountToPay;
      loser.netGain += amountToPay;
    }
    
    if (Math.abs(winner.netGain) < 0.01) winnerIndex++;
    if (Math.abs(loser.netGain) < 0.01) loserIndex++;
  }
  
  return payments;
}
```

### 4. User Interface Requirements

#### 4.1 Leader Dashboard
- **Game Setup Section**
  - Chip color/value configuration table
  - Player management interface
  - Buy-in and pot tracking
  
- **Live Game Management**
  - Real-time chip count updates
  - Re-buy tracking
  - Current standings display
  
- **End Game Summary**
  - Final earnings table
  - Venmo payment instructions
  - Game statistics

#### 4.2 Player View (Read-Only)
- **Current Game Status**
  - Own chip count and current value
  - Leaderboard with all players
  - Pot size and re-buy information
  
- **Real-Time Updates**
  - Live chip count changes
  - Automatic payout calculations
  - Payment map when game ends

#### 4.3 Mobile Optimization
- Responsive design for mobile devices
- QR code scanning for easy joining
- Simplified touch interfaces for chip updates
- Push notifications for game updates

### 5. Technical Implementation

#### 5.1 Frontend Framework
- **React.js** with real-time state management
- **Socket.io** for live synchronization
- **PWA** capabilities for offline functionality
- **Tailwind CSS** for responsive design

#### 5.2 Backend Architecture
- **Node.js/Express** API server
- **WebSocket** connections for real-time updates
- **Redis** for session management and caching
- **MongoDB/Firestore** for persistent storage

#### 5.3 Security Considerations
- Rate limiting on group code generation
- Input validation and sanitization
- HTTPS encryption for all communications
- Session timeout for inactive games

### 6. User Experience Enhancements

#### 6.1 Error Handling
- Clear validation messages for chip configurations
- Automatic calculation verification
- Graceful handling of network disconnections
- Undo functionality for accidental updates

#### 6.2 Convenience Features
- Preset chip configurations for common games
- History of previous games
- Export functionality for game records
- Integration with popular payment apps

#### 6.3 Accessibility
- Screen reader compatibility
- Keyboard navigation support
- High contrast mode
- Large text options

### 7. Testing Strategy

#### 7.1 Calculation Validation
- Unit tests for earnings calculations
- Edge case testing (zero chips, re-buys, etc.)
- Venmo map optimization verification
- Rounding error handling

#### 7.2 User Flow Testing
- End-to-end game scenarios
- Multi-device synchronization testing
- Network interruption recovery
- Cross-browser compatibility

### 8. Future Enhancements

#### 8.1 Advanced Features
- Tournament bracket management
- Statistical analysis and trends
- Photo capture of final chip stacks
- Integration with poker tracking apps

#### 8.2 Social Features
- Player rating system
- Game history and statistics
- Social sharing of big wins
- Regular game scheduling

### 9. Launch Checklist

#### 9.1 Pre-Launch
- [ ] Core calculation algorithms tested
- [ ] Real-time synchronization working
- [ ] Mobile responsive design complete
- [ ] Security measures implemented
- [ ] User acceptance testing completed

#### 9.2 Post-Launch
- [ ] Monitor calculation accuracy
- [ ] Gather user feedback
- [ ] Performance optimization
- [ ] Feature usage analytics
- [ ] Bug fix priority queue

This documentation provides a comprehensive foundation for building a robust poker home game organizing website that handles the complexity of chip tracking, payout calculations, and payment distribution while maintaining a simple, user-friendly interface.