import request from 'supertest';
import { Express } from 'express';
import mongoose from 'mongoose';
import { createTestApp } from '../setup/testApp';
import { connect, closeDatabase, clearDatabase, createObjectId } from '../setup/testDb';
import Game from '../../models/Game';
import { Player } from '../../models/Player';

describe('Game API Integration Tests', () => {
  let app: Express;

  beforeAll(async () => {
    await connect();
    app = createTestApp();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('POST /api/games', () => {
    it('should create a new game with valid data', async () => {
      const gameData = {
        hostName: 'John Doe',
        buyIn: 100,
        chipValues: {
          white: 1,
          red: 5,
          green: 25,
          black: 100,
          blue: 500,
        },
        blindStructure: [
          {
            level: 1,
            smallBlind: 10,
            bigBlind: 20,
            duration: 20,
          },
          {
            level: 2,
            smallBlind: 20,
            bigBlind: 40,
            duration: 20,
          },
        ],
      };

      const response = await request(app)
        .post('/api/games')
        .send(gameData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        hostName: gameData.hostName,
        buyIn: gameData.buyIn,
        chipValues: gameData.chipValues,
        blindStructure: gameData.blindStructure,
        status: 'waiting',
      });
      expect(response.body.data.code).toMatch(/^[A-Z0-9]{6}$/);
      expect(response.body.data.gameId).toBeDefined();

      // Verify game was saved to database
      const savedGame = await Game.findById(response.body.data.gameId);
      expect(savedGame).toBeTruthy();
      expect(savedGame?.code).toBe(response.body.data.code);
    });

    it('should generate unique game codes', async () => {
      const gameData = {
        hostName: 'John Doe',
        buyIn: 100,
        chipValues: {
          white: 1,
          red: 5,
          green: 25,
          black: 100,
          blue: 500,
        },
        blindStructure: [
          {
            level: 1,
            smallBlind: 10,
            bigBlind: 20,
            duration: 20,
          },
        ],
      };

      const codes = new Set<string>();
      
      // Create multiple games
      for (let i = 0; i < 5; i++) {
        const response = await request(app)
          .post('/api/games')
          .send(gameData)
          .expect(201);
        
        codes.add(response.body.data.code);
      }

      // All codes should be unique
      expect(codes.size).toBe(5);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/games')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should validate hostName length', async () => {
      const gameData = {
        hostName: 'A'.repeat(51), // Too long
        buyIn: 100,
        chipValues: {
          white: 1,
          red: 5,
          green: 25,
          black: 100,
          blue: 500,
        },
        blindStructure: [
          {
            level: 1,
            smallBlind: 10,
            bigBlind: 20,
            duration: 20,
          },
        ],
      };

      const response = await request(app)
        .post('/api/games')
        .send(gameData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate buyIn is positive', async () => {
      const gameData = {
        hostName: 'John Doe',
        buyIn: -100,
        chipValues: {
          white: 1,
          red: 5,
          green: 25,
          black: 100,
          blue: 500,
        },
        blindStructure: [
          {
            level: 1,
            smallBlind: 10,
            bigBlind: 20,
            duration: 20,
          },
        ],
      };

      const response = await request(app)
        .post('/api/games')
        .send(gameData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate chip values are all positive', async () => {
      const gameData = {
        hostName: 'John Doe',
        buyIn: 100,
        chipValues: {
          white: 1,
          red: -5, // Invalid
          green: 25,
          black: 100,
          blue: 500,
        },
        blindStructure: [
          {
            level: 1,
            smallBlind: 10,
            bigBlind: 20,
            duration: 20,
          },
        ],
      };

      const response = await request(app)
        .post('/api/games')
        .send(gameData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate blind structure has at least one level', async () => {
      const gameData = {
        hostName: 'John Doe',
        buyIn: 100,
        chipValues: {
          white: 1,
          red: 5,
          green: 25,
          black: 100,
          blue: 500,
        },
        blindStructure: [], // Empty
      };

      const response = await request(app)
        .post('/api/games')
        .send(gameData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/games/:code', () => {
    it('should get game by code with players', async () => {
      // Create a game
      const game = await Game.create({
        code: 'ABC123',
        hostName: 'John Doe',
        buyIn: 100,
        chipValues: {
          white: 1,
          red: 5,
          green: 25,
          black: 100,
          blue: 500,
        },
        blindStructure: [
          {
            level: 1,
            smallBlind: 10,
            bigBlind: 20,
            duration: 20,
          },
        ],
        currentBlindLevel: 0,
        status: 'active',
      });

      // Create players
      const player1 = await Player.create({
        gameId: game._id,
        name: 'Player 1',
        currentChips: 1000,
        totalBuyIn: 100,
        rebuys: 0,
        status: 'active',
      });

      const player2 = await Player.create({
        gameId: game._id,
        name: 'Player 2',
        currentChips: 800,
        totalBuyIn: 200,
        rebuys: 1,
        status: 'active',
      });

      // Add players to game
      game.players = [player1._id, player2._id];
      await game.save();

      const response = await request(app)
        .get('/api/games/ABC123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        code: 'ABC123',
        hostName: 'John Doe',
        buyIn: 100,
        status: 'active',
        totalPot: 300, // 100 + 200
      });
      
      expect(response.body.data.players).toHaveLength(2);
      expect(response.body.data.players[0]).toMatchObject({
        name: 'Player 1',
        currentChips: 1000,
        totalBuyIn: 100,
        rebuys: 0,
        status: 'active',
      });
    });

    it('should return 404 for non-existent game code', async () => {
      const response = await request(app)
        .get('/api/games/XXXXXX')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Game not found');
    });

    it('should validate game code format', async () => {
      const response = await request(app)
        .get('/api/games/invalid-code')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should calculate total pot correctly', async () => {
      const game = await Game.create({
        code: 'POT123',
        hostName: 'Host',
        buyIn: 50,
        chipValues: {
          white: 1,
          red: 5,
          green: 25,
          black: 100,
          blue: 500,
        },
        blindStructure: [
          {
            level: 1,
            smallBlind: 10,
            bigBlind: 20,
            duration: 20,
          },
        ],
        currentBlindLevel: 0,
        status: 'active',
      });

      // Create multiple players with different buy-ins
      const players = [];
      for (let i = 0; i < 5; i++) {
        const player = await Player.create({
          gameId: game._id,
          name: `Player ${i + 1}`,
          currentChips: 1000,
          totalBuyIn: 50 + (i * 50), // 50, 100, 150, 200, 250
          rebuys: i,
          status: 'active',
        });
        players.push(player._id);
      }

      game.players = players;
      await game.save();

      const response = await request(app)
        .get('/api/games/POT123')
        .expect(200);

      expect(response.body.data.totalPot).toBe(750); // 50 + 100 + 150 + 200 + 250
    });
  });

  describe('PUT /api/games/:id/chips', () => {
    let game: any;
    let player: any;

    beforeEach(async () => {
      game = await Game.create({
        code: 'CHIP01',
        hostName: 'Host',
        buyIn: 100,
        chipValues: {
          white: 1,
          red: 5,
          green: 25,
          black: 100,
          blue: 500,
        },
        blindStructure: [
          {
            level: 1,
            smallBlind: 10,
            bigBlind: 20,
            duration: 20,
          },
        ],
        currentBlindLevel: 0,
        status: 'active',
      });

      player = await Player.create({
        gameId: game._id,
        name: 'Test Player',
        currentChips: 1000,
        totalBuyIn: 100,
        rebuys: 0,
        status: 'active',
      });

      game.players = [player._id];
      await game.save();
    });

    it('should update player chips successfully', async () => {
      const response = await request(app)
        .put(`/api/games/${game._id}/chips`)
        .send({
          playerId: player._id.toString(),
          chips: 1500,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.currentChips).toBe(1500);

      // Verify in database
      const updatedPlayer = await Player.findById(player._id);
      expect(updatedPlayer?.currentChips).toBe(1500);
    });

    it('should return 404 for non-existent game', async () => {
      const fakeGameId = createObjectId();
      
      const response = await request(app)
        .put(`/api/games/${fakeGameId}/chips`)
        .send({
          playerId: player._id.toString(),
          chips: 1500,
        })
        .expect(404);

      expect(response.body.error.message).toBe('Game not found');
    });

    it('should return 404 for non-existent player', async () => {
      const fakePlayerId = createObjectId();
      
      const response = await request(app)
        .put(`/api/games/${game._id}/chips`)
        .send({
          playerId: fakePlayerId,
          chips: 1500,
        })
        .expect(404);

      expect(response.body.error.message).toBe('Player not found in this game');
    });

    it('should not update chips in completed game', async () => {
      // Mark game as completed
      game.status = 'completed';
      await game.save();

      const response = await request(app)
        .put(`/api/games/${game._id}/chips`)
        .send({
          playerId: player._id.toString(),
          chips: 1500,
        })
        .expect(400);

      expect(response.body.error.message).toBe('Cannot update chips in a completed game');
    });

    it('should validate chips is non-negative', async () => {
      const response = await request(app)
        .put(`/api/games/${game._id}/chips`)
        .send({
          playerId: player._id.toString(),
          chips: -100,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .put(`/api/games/${game._id}/chips`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/games/:id/rebuy', () => {
    let game: any;
    let player: any;

    beforeEach(async () => {
      game = await Game.create({
        code: 'REBUY1',
        hostName: 'Host',
        buyIn: 100,
        chipValues: {
          white: 1,
          red: 5,
          green: 25,
          black: 100,
          blue: 500,
        },
        blindStructure: [
          {
            level: 1,
            smallBlind: 10,
            bigBlind: 20,
            duration: 20,
          },
        ],
        currentBlindLevel: 0,
        status: 'active',
      });

      player = await Player.create({
        gameId: game._id,
        name: 'Test Player',
        currentChips: 100,
        totalBuyIn: 100,
        rebuys: 0,
        status: 'active',
      });

      game.players = [player._id];
      await game.save();
    });

    it('should add rebuy successfully', async () => {
      const response = await request(app)
        .post(`/api/games/${game._id}/rebuy`)
        .send({
          playerId: player._id.toString(),
          amount: 100,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        currentChips: 200, // 100 + 100
        totalBuyIn: 200,   // 100 + 100
        rebuys: 1,
      });

      // Verify in database
      const updatedPlayer = await Player.findById(player._id);
      expect(updatedPlayer?.rebuys).toBe(1);
      expect(updatedPlayer?.totalBuyIn).toBe(200);
      expect(updatedPlayer?.currentChips).toBe(200);
    });

    it('should handle multiple rebuys', async () => {
      // First rebuy
      await request(app)
        .post(`/api/games/${game._id}/rebuy`)
        .send({
          playerId: player._id.toString(),
          amount: 100,
        })
        .expect(200);

      // Second rebuy
      const response = await request(app)
        .post(`/api/games/${game._id}/rebuy`)
        .send({
          playerId: player._id.toString(),
          amount: 150,
        })
        .expect(200);

      expect(response.body.data).toMatchObject({
        currentChips: 350, // 100 + 100 + 150
        totalBuyIn: 350,   // 100 + 100 + 150
        rebuys: 2,
      });
    });

    it('should return 404 for non-existent game', async () => {
      const fakeGameId = createObjectId();
      
      const response = await request(app)
        .post(`/api/games/${fakeGameId}/rebuy`)
        .send({
          playerId: player._id.toString(),
          amount: 100,
        })
        .expect(404);

      expect(response.body.error.message).toBe('Game not found');
    });

    it('should return 404 for non-existent player', async () => {
      const fakePlayerId = createObjectId();
      
      const response = await request(app)
        .post(`/api/games/${game._id}/rebuy`)
        .send({
          playerId: fakePlayerId,
          amount: 100,
        })
        .expect(404);

      expect(response.body.error.message).toBe('Player not found in this game');
    });

    it('should not allow rebuy in non-active game', async () => {
      game.status = 'waiting';
      await game.save();

      const response = await request(app)
        .post(`/api/games/${game._id}/rebuy`)
        .send({
          playerId: player._id.toString(),
          amount: 100,
        })
        .expect(400);

      expect(response.body.error.message).toBe('Can only add rebuys to active games');
    });

    it('should validate amount is positive', async () => {
      const response = await request(app)
        .post(`/api/games/${game._id}/rebuy`)
        .send({
          playerId: player._id.toString(),
          amount: -100,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/games/:id/end', () => {
    let game: any;
    let players: any[];

    beforeEach(async () => {
      game = await Game.create({
        code: 'END001',
        hostName: 'Host',
        buyIn: 100,
        chipValues: {
          white: 1,
          red: 5,
          green: 25,
          black: 100,
          blue: 500,
        },
        blindStructure: [
          {
            level: 1,
            smallBlind: 10,
            bigBlind: 20,
            duration: 20,
          },
        ],
        currentBlindLevel: 0,
        status: 'active',
      });

      // Create 4 players
      players = [];
      for (let i = 0; i < 4; i++) {
        const player = await Player.create({
          gameId: game._id,
          name: `Player ${i + 1}`,
          currentChips: (4 - i) * 1000, // 4000, 3000, 2000, 1000
          totalBuyIn: 100,
          rebuys: 0,
          status: 'active',
        });
        players.push(player);
      }

      game.players = players.map(p => p._id);
      await game.save();
    });

    it('should end game and calculate payouts successfully', async () => {
      const rankings = [
        {
          playerId: players[0]._id.toString(),
          position: 1,
          payout: 240, // 60% of 400 pot
        },
        {
          playerId: players[1]._id.toString(),
          position: 2,
          payout: 160, // 40% of 400 pot
        },
        {
          playerId: players[2]._id.toString(),
          position: 3,
          payout: 0,
        },
        {
          playerId: players[3]._id.toString(),
          position: 4,
          payout: 0,
        },
      ];

      const response = await request(app)
        .post(`/api/games/${game._id}/end`)
        .send({ rankings })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        status: 'completed',
        totalPot: 400,
      });
      expect(response.body.data.endTime).toBeDefined();
      expect(response.body.data.finalRankings).toHaveLength(4);

      // Check first place
      expect(response.body.data.finalRankings[0]).toMatchObject({
        playerName: 'Player 1',
        position: 1,
        payout: 240,
        profit: 140, // 240 - 100
      });

      // Verify game status in database
      const updatedGame = await Game.findById(game._id);
      expect(updatedGame?.status).toBe('completed');
      expect(updatedGame?.endTime).toBeDefined();

      // Verify player statuses
      const updatedPlayer1 = await Player.findById(players[0]._id);
      expect(updatedPlayer1?.status).toBe('eliminated');
      expect(updatedPlayer1?.finalPosition).toBe(1);
      expect(updatedPlayer1?.payout).toBe(240);
    });

    it('should handle different payout structures', async () => {
      // All money to winner
      const rankings = [
        {
          playerId: players[0]._id.toString(),
          position: 1,
          payout: 400, // Winner takes all
        },
        {
          playerId: players[1]._id.toString(),
          position: 2,
          payout: 0,
        },
        {
          playerId: players[2]._id.toString(),
          position: 3,
          payout: 0,
        },
        {
          playerId: players[3]._id.toString(),
          position: 4,
          payout: 0,
        },
      ];

      const response = await request(app)
        .post(`/api/games/${game._id}/end`)
        .send({ rankings })
        .expect(200);

      expect(response.body.data.finalRankings[0].profit).toBe(300); // 400 - 100
    });

    it('should return 404 for non-existent game', async () => {
      const fakeGameId = createObjectId();
      
      const response = await request(app)
        .post(`/api/games/${fakeGameId}/end`)
        .send({
          rankings: [
            {
              playerId: players[0]._id.toString(),
              position: 1,
              payout: 400,
            },
          ],
        })
        .expect(404);

      expect(response.body.error.message).toBe('Game not found');
    });

    it('should not allow ending already completed game', async () => {
      game.status = 'completed';
      await game.save();

      const response = await request(app)
        .post(`/api/games/${game._id}/end`)
        .send({
          rankings: [
            {
              playerId: players[0]._id.toString(),
              position: 1,
              payout: 400,
            },
          ],
        })
        .expect(400);

      expect(response.body.error.message).toBe('Game is already completed');
    });

    it('should validate rankings have at least one entry', async () => {
      const response = await request(app)
        .post(`/api/games/${game._id}/end`)
        .send({ rankings: [] })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent player in rankings', async () => {
      const fakePlayerId = createObjectId();
      
      const response = await request(app)
        .post(`/api/games/${game._id}/end`)
        .send({
          rankings: [
            {
              playerId: fakePlayerId,
              position: 1,
              payout: 400,
            },
          ],
        })
        .expect(404);

      expect(response.body.error.message).toContain('not found');
    });

    it('should validate payout is non-negative', async () => {
      const response = await request(app)
        .post(`/api/games/${game._id}/end`)
        .send({
          rankings: [
            {
              playerId: players[0]._id.toString(),
              position: 1,
              payout: -100,
            },
          ],
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Error handling', () => {
    it('should handle invalid ObjectId format', async () => {
      const response = await request(app)
        .put('/api/games/invalid-id/chips')
        .send({
          playerId: createObjectId(),
          chips: 1000,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle database connection errors gracefully', async () => {
      // Close the database connection
      await mongoose.connection.close();

      const response = await request(app)
        .get('/api/games/ABC123')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Internal Server Error');

      // Reconnect for other tests
      await connect();
    });

    it('should return 404 for undefined routes', async () => {
      const response = await request(app)
        .get('/api/undefined-route')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('not found');
    });
  });

  describe('Validation edge cases', () => {
    it('should trim whitespace from hostName', async () => {
      const gameData = {
        hostName: '  John Doe  ',
        buyIn: 100,
        chipValues: {
          white: 1,
          red: 5,
          green: 25,
          black: 100,
          blue: 500,
        },
        blindStructure: [
          {
            level: 1,
            smallBlind: 10,
            bigBlind: 20,
            duration: 20,
          },
        ],
      };

      const response = await request(app)
        .post('/api/games')
        .send(gameData)
        .expect(201);

      expect(response.body.data.hostName).toBe('John Doe');
    });

    it('should validate blind structure levels are positive', async () => {
      const gameData = {
        hostName: 'John Doe',
        buyIn: 100,
        chipValues: {
          white: 1,
          red: 5,
          green: 25,
          black: 100,
          blue: 500,
        },
        blindStructure: [
          {
            level: 0, // Invalid
            smallBlind: 10,
            bigBlind: 20,
            duration: 20,
          },
        ],
      };

      const response = await request(app)
        .post('/api/games')
        .send(gameData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate all chip colors are present', async () => {
      const gameData = {
        hostName: 'John Doe',
        buyIn: 100,
        chipValues: {
          white: 1,
          red: 5,
          green: 25,
          black: 100,
          // Missing blue
        },
        blindStructure: [
          {
            level: 1,
            smallBlind: 10,
            bigBlind: 20,
            duration: 20,
          },
        ],
      };

      const response = await request(app)
        .post('/api/games')
        .send(gameData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});