/**
 * API Demo Script
 * This demonstrates the basic API functionality
 */

import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

async function runDemo() {
  try {
    console.log('🎰 Poker Game API Demo\n');

    // 1. Create a new game
    console.log('1. Creating a new game...');
    const createResponse = await axios.post(`${API_URL}/games`, {
      leaderId: 'host-123',
      chipConfig: {
        colors: [
          { name: 'White', value: 1 },
          { name: 'Red', value: 5 },
          { name: 'Green', value: 25 },
          { name: 'Black', value: 100 }
        ]
      },
      financials: {
        initialBuyIn: 100,
        totalPot: 300
      },
      players: [
        { name: 'Alice', initialChips: { White: 25, Red: 10, Green: 2 }, currentChips: { White: 25, Red: 10, Green: 2 }, totalBuyIn: 100 },
        { name: 'Bob', initialChips: { White: 25, Red: 10, Green: 2 }, currentChips: { White: 25, Red: 10, Green: 2 }, totalBuyIn: 100 },
        { name: 'Charlie', initialChips: { White: 25, Red: 10, Green: 2 }, currentChips: { White: 25, Red: 10, Green: 2 }, totalBuyIn: 100 }
      ]
    });

    const game = createResponse.data.data;
    console.log(`✅ Game created with code: ${game.groupCode}\n`);

    // 2. Get game by code
    console.log(`2. Retrieving game by code ${game.groupCode}...`);
    const getResponse = await axios.get(`${API_URL}/games/${game.groupCode}`);
    console.log(`✅ Found game with ${getResponse.data.data.players.length} players\n`);

    // 3. Update chip counts
    console.log('3. Updating chip counts after some hands...');
    
    // Alice wins some chips
    await axios.put(`${API_URL}/games/${game.id}/chips`, {
      playerId: game.players.find((p: any) => p.name === 'Alice')._id,
      currentChips: { White: 40, Red: 15, Green: 3, Black: 1 }
    });

    // Bob loses some chips
    await axios.put(`${API_URL}/games/${game.id}/chips`, {
      playerId: game.players.find((p: any) => p.name === 'Bob')._id,
      currentChips: { White: 10, Red: 5, Green: 1 }
    });

    console.log('✅ Chip counts updated\n');

    // 4. Add a rebuy
    console.log('4. Bob rebuys for $100...');
    await axios.post(`${API_URL}/games/${game.id}/rebuy`, {
      playerName: 'Bob',
      amount: 100,
      chipsByColor: { White: 25, Red: 10, Green: 2 }
    });
    console.log('✅ Rebuy added\n');

    // 5. End game and calculate payouts
    console.log('5. Ending game and calculating payouts...');
    const endResponse = await axios.post(`${API_URL}/games/${game.id}/end`);
    const results = endResponse.data.data;

    console.log('📊 Final Results:');
    console.log('================');
    results.payouts.forEach((payout: any) => {
      console.log(`${payout.name}: $${payout.finalPayout} (${payout.netGain >= 0 ? '+' : ''}$${payout.netGain})`);
    });

    console.log('\n💸 Venmo Payment Instructions:');
    console.log('==============================');
    results.venmoPayments.forEach((payment: any) => {
      console.log(`${payment.from} → ${payment.to}: $${payment.amount}`);
    });

    console.log('\n✅ Demo completed successfully!');

  } catch (error: any) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Run demo if this file is executed directly
if (require.main === module) {
  console.log('Make sure the server is running on port 3001...\n');
  setTimeout(runDemo, 1000);
}

export { runDemo };