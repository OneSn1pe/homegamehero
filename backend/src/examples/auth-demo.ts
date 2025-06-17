/**
 * Authentication Demo Script
 * This demonstrates the authentication flow and security features
 */

import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

// Store leader token for authenticated requests
let leaderToken: string;
let gameId: string;
let groupCode: string;

async function createGameAsLeader() {
  console.log('1. Creating a game as leader...');
  
  try {
    const response = await axios.post(`${API_URL}/games`, {
      leaderId: 'alice-123',
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
    });

    const { data } = response.data;
    gameId = data.id;
    groupCode = data.groupCode;
    leaderToken = data.leaderToken;

    console.log(`✅ Game created!`);
    console.log(`   Group Code: ${groupCode}`);
    console.log(`   Leader Token: ${leaderToken.substring(0, 20)}...`);
    console.log('');
  } catch (error: any) {
    console.error('❌ Error creating game:', error.response?.data);
  }
}

async function tryUpdateWithoutAuth() {
  console.log('2. Attempting to update chips WITHOUT authentication...');
  
  try {
    await axios.put(`${API_URL}/games/${gameId}/chips`, {
      playerId: 'some-player-id',
      currentChips: { White: 40, Red: 20 }
    });
    console.log('❌ This should not succeed!');
  } catch (error: any) {
    console.log(`✅ Correctly rejected: ${error.response?.data.error}`);
    console.log('');
  }
}

async function tryUpdateWithAuth() {
  console.log('3. Updating chips WITH authentication...');
  
  try {
    // First get the game to find player ID
    const gameResponse = await axios.get(`${API_URL}/games/${groupCode}`);
    const playerId = gameResponse.data.data.players[0]._id;

    // Update chips with auth token
    await axios.put(
      `${API_URL}/games/${gameId}/chips`,
      {
        playerId,
        currentChips: { White: 75, Red: 15 }
      },
      {
        headers: {
          'Authorization': `Bearer ${leaderToken}`
        }
      }
    );
    console.log('✅ Successfully updated chips!');
    console.log('');
  } catch (error: any) {
    console.error('❌ Error:', error.response?.data);
  }
}

async function readAsPlayer() {
  console.log('4. Reading game as a player (no auth needed)...');
  
  try {
    const response = await axios.get(`${API_URL}/games/${groupCode}`);
    const game = response.data.data;
    
    console.log('✅ Successfully read game:');
    console.log(`   Status: ${game.status}`);
    console.log(`   Players: ${game.players.length}`);
    console.log(`   Total Pot: $${game.financials.totalPot}`);
    console.log('');
  } catch (error: any) {
    console.error('❌ Error:', error.response?.data);
  }
}

async function testRateLimiting() {
  console.log('5. Testing rate limiting...');
  
  try {
    // Make multiple requests quickly
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(
        axios.get(`${API_URL}/games/${groupCode}`)
          .then(res => ({ 
            success: true, 
            remaining: res.headers['x-ratelimit-remaining'] 
          }))
          .catch(err => ({ 
            success: false, 
            status: err.response?.status,
            error: err.response?.data?.error 
          }))
      );
    }
    
    const results = await Promise.all(promises);
    const rateLimited = results.filter(r => r.status === 429);
    
    console.log(`   Total requests: ${results.length}`);
    console.log(`   Rate limited: ${rateLimited.length}`);
    console.log(`   Remaining: ${results.find(r => r.remaining)?.remaining || 'N/A'}`);
    console.log('');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

async function testInvalidInputs() {
  console.log('6. Testing security validations...');
  
  // Test SQL injection attempt
  try {
    await axios.post(`${API_URL}/games`, {
      leaderId: "'; DROP TABLE games; --",
      chipConfig: { colors: [{ name: 'White', value: 1 }] },
      financials: { initialBuyIn: 100, totalPot: 100 },
      players: []
    });
    console.log('❌ SQL injection should have been blocked!');
  } catch (error: any) {
    console.log(`✅ SQL injection blocked: ${error.response?.data.error}`);
  }

  // Test XSS attempt
  try {
    await axios.post(`${API_URL}/games`, {
      leaderId: '<script>alert("XSS")</script>',
      chipConfig: { colors: [{ name: 'White', value: 1 }] },
      financials: { initialBuyIn: 100, totalPot: 100 },
      players: []
    });
    console.log('❌ XSS should have been blocked!');
  } catch (error: any) {
    console.log(`✅ XSS attempt blocked: ${error.response?.data.error}`);
  }

  // Test invalid ObjectId
  try {
    await axios.get(`${API_URL}/games/invalid-id`);
    console.log('❌ Invalid ID should have been rejected!');
  } catch (error: any) {
    console.log(`✅ Invalid ID rejected: ${error.response?.data.error}`);
  }

  console.log('');
}

async function runSecurityDemo() {
  console.log('🔐 Poker Game API Security Demo\n');
  
  await createGameAsLeader();
  await tryUpdateWithoutAuth();
  await tryUpdateWithAuth();
  await readAsPlayer();
  await testRateLimiting();
  await testInvalidInputs();
  
  console.log('✅ Security demo completed!\n');
  console.log('Key takeaways:');
  console.log('- Leader token required for write operations');
  console.log('- Read access allowed with just group code');
  console.log('- Rate limiting prevents abuse');
  console.log('- Input validation blocks malicious data');
}

// Run demo if this file is executed directly
if (require.main === module) {
  console.log('Make sure the server is running on port 3001...\n');
  setTimeout(runSecurityDemo, 1000);
}

export { runSecurityDemo };