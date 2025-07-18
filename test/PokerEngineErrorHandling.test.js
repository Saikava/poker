const PokerEngine = require('../src/PokerEngine');
const {
  InvalidInputError,
  ConfigurationError,
  InvalidActionError,
  PlayerNotFoundError,
  GameStateError
} = require('../src/errors/PokerErrors');

describe('PokerEngine Error Handling Integration', () => {
  describe('constructor error handling', () => {
    test('should throw ConfigurationError for invalid configuration', () => {
      expect(() => new PokerEngine({ smallBlind: -10 })).toThrow(ConfigurationError);
      expect(() => new PokerEngine({ bigBlind: 0 })).toThrow(ConfigurationError);
      expect(() => new PokerEngine({ maxPlayers: 1 })).toThrow(ConfigurationError);
      expect(() => new PokerEngine({ smallBlind: 20, bigBlind: 10 })).toThrow(ConfigurationError);
    });

    test('should create engine with valid configuration', () => {
      expect(() => new PokerEngine()).not.toThrow();
      expect(() => new PokerEngine({})).not.toThrow();
      expect(() => new PokerEngine({
        smallBlind: 10,
        bigBlind: 20,
        maxPlayers: 8,
        minPlayers: 2,
        startingChips: 1000
      })).not.toThrow();
    });
  });

  describe('addPlayer error handling', () => {
    let engine;

    beforeEach(() => {
      engine = new PokerEngine();
    });

    test('should return error response for invalid player configuration', () => {
      const invalidConfigs = [
        null,
        undefined,
        'not an object',
        {},
        { id: 'player1' }, // Missing name
        { name: 'John' }, // Missing id
        { id: '', name: 'John' }, // Empty id
        { id: 'player1', name: '' }, // Empty name
        { id: 123, name: 'John' }, // Non-string id
        { id: 'player1', name: 123 }, // Non-string name
        { id: 'player1', name: 'John', chips: -100 }, // Negative chips
        { id: 'player1', name: 'John', chips: 'invalid' } // Non-integer chips
      ];

      invalidConfigs.forEach(config => {
        const result = engine.addPlayer(config);
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.error.type).toMatch(/Error$/);
      });
    });

    test('should return success response for valid player configuration', () => {
      const validConfigs = [
        { id: 'player1', name: 'John Doe' },
        { id: 'player2', name: 'Jane Smith', chips: 1500 },
        { id: 'player3', name: 'Bob Johnson', chips: 0 }
      ];

      validConfigs.forEach(config => {
        const result = engine.addPlayer(config);
        expect(result.success).toBe(true);
        expect(result.player).toBeDefined();
        expect(result.gameInfo).toBeDefined();
      });
    });

    test('should return error response for duplicate player id', () => {
      const playerConfig = { id: 'player1', name: 'John Doe' };
      
      // Add player first time - should succeed
      const result1 = engine.addPlayer(playerConfig);
      expect(result1.success).toBe(true);
      
      // Add same player again - should fail
      const result2 = engine.addPlayer(playerConfig);
      expect(result2.success).toBe(false);
      expect(result2.error.type).toBe('InvalidInputError'); // This should come from PlayerManager validation now
    });

    test('should handle unexpected errors gracefully', () => {
      // Mock GameManager to throw unexpected error
      const originalAddPlayer = engine.gameManager.addPlayer;
      engine.gameManager.addPlayer = () => {
        throw new Error('Unexpected error');
      };

      const result = engine.addPlayer({ id: 'player1', name: 'John Doe' });
      expect(result.success).toBe(false);
      expect(result.error.type).toBe('UnexpectedError');

      // Restore original method
      engine.gameManager.addPlayer = originalAddPlayer;
    });
  });

  describe('playerAction error handling', () => {
    let engine;

    beforeEach(() => {
      engine = new PokerEngine();
      engine.addPlayer({ id: 'player1', name: 'Player 1' });
      engine.addPlayer({ id: 'player2', name: 'Player 2' });
    });

    test('should return error response for invalid action configuration', () => {
      const invalidConfigs = [
        null,
        undefined,
        'not an object',
        {},
        { playerId: 'player1' }, // Missing action
        { action: 'fold' }, // Missing playerId
        { playerId: '', action: 'fold' }, // Empty playerId
        { playerId: 123, action: 'fold' }, // Non-string playerId
        { playerId: 'player1', action: 123 }, // Non-string action
        { playerId: 'player1', action: 'invalid' }, // Invalid action
        { playerId: 'player1', action: 'raise' }, // Missing amount for raise
        { playerId: 'player1', action: 'raise', amount: null }, // Null amount for raise
        { playerId: 'player1', action: 'raise', amount: 'invalid' }, // Non-integer amount
        { playerId: 'player1', action: 'raise', amount: 0 }, // Zero amount for raise
        { playerId: 'player1', action: 'raise', amount: -100 } // Negative amount for raise
      ];

      invalidConfigs.forEach(config => {
        const result = engine.playerAction(config);
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.error.type).toMatch(/Error$/);
      });
    });

    test('should return success response for valid action configuration', () => {
      // Start game first
      engine.startGame();

      const validConfigs = [
        { playerId: 'player1', action: 'fold' },
        { playerId: 'player2', action: 'call' }
      ];

      // Test first valid action
      const result1 = engine.playerAction(validConfigs[0]);
      expect(result1.success).toBe(true);
      expect(result1.action).toBeDefined();
      expect(result1.gameState).toBeDefined();
    });

    test('should handle game state errors', () => {
      // Try to perform action before game starts
      const result = engine.playerAction({ playerId: 'player1', action: 'fold' });
      expect(result.success).toBe(false);
      expect(result.error.type).toMatch(/Error$/);
    });

    test('should handle unexpected errors gracefully', () => {
      // Mock GameManager to throw unexpected error
      const originalProcessPlayerAction = engine.gameManager.processPlayerAction;
      engine.gameManager.processPlayerAction = () => {
        throw new Error('Unexpected error');
      };

      const result = engine.playerAction({ playerId: 'player1', action: 'fold' });
      expect(result.success).toBe(false);
      expect(result.error.type).toBe('UnexpectedError');

      // Restore original method
      engine.gameManager.processPlayerAction = originalProcessPlayerAction;
    });
  });

  describe('removePlayer error handling', () => {
    let engine;

    beforeEach(() => {
      engine = new PokerEngine();
      engine.addPlayer({ id: 'player1', name: 'Player 1' });
    });

    test('should return error response for invalid player id', () => {
      const invalidIds = [null, undefined, '', 123, {}];

      invalidIds.forEach(id => {
        const result = engine.removePlayer(id);
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.error.type).toBe('InvalidInputError');
      });
    });

    test('should return error response for non-existent player', () => {
      const result = engine.removePlayer('nonexistent');
      expect(result.success).toBe(false);
      expect(result.error.type).toBe('PlayerNotFoundError');
    });

    test('should return success response for valid player removal', () => {
      const result = engine.removePlayer('player1');
      expect(result.success).toBe(true);
      expect(result.gameInfo).toBeDefined();
    });
  });

  describe('getPlayerActions error handling', () => {
    let engine;

    beforeEach(() => {
      engine = new PokerEngine();
      engine.addPlayer({ id: 'player1', name: 'Player 1' });
    });

    test('should return error response for invalid player id', () => {
      const invalidIds = [null, undefined, '', 123, {}];

      invalidIds.forEach(id => {
        const result = engine.getPlayerActions(id);
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.error.type).toBe('InvalidInputError');
      });
    });

    test('should return error response for non-existent player', () => {
      const result = engine.getPlayerActions('nonexistent');
      expect(result.success).toBe(false);
      expect(result.error.type).toBe('PlayerNotFoundError');
    });

    test('should return success response for valid player', () => {
      const result = engine.getPlayerActions('player1');
      expect(result.success).toBe(true);
      expect(result.availableActions).toBeDefined();
    });
  });

  describe('getPlayerState error handling', () => {
    let engine;

    beforeEach(() => {
      engine = new PokerEngine();
      engine.addPlayer({ id: 'player1', name: 'Player 1' });
    });

    test('should return error response for invalid player id', () => {
      const invalidIds = [null, undefined, '', 123, {}];

      invalidIds.forEach(id => {
        const result = engine.getPlayerState(id);
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.error.type).toBe('InvalidInputError');
      });
    });

    test('should return error response for non-existent player', () => {
      const result = engine.getPlayerState('nonexistent');
      expect(result.success).toBe(false);
      expect(result.error.type).toBe('PlayerNotFoundError');
    });

    test('should return success response for valid player', () => {
      const result = engine.getPlayerState('player1');
      expect(result.success).toBe(true);
      expect(result.player).toBeDefined();
    });
  });

  describe('error response format consistency', () => {
    let engine;

    beforeEach(() => {
      engine = new PokerEngine();
    });

    test('all error responses should have consistent format', () => {
      const errorResponses = [
        engine.addPlayer(null),
        engine.removePlayer(null),
        engine.getPlayerActions(null),
        engine.getPlayerState(null),
        engine.playerAction(null)
      ];

      errorResponses.forEach(response => {
        expect(response).toHaveProperty('success', false);
        expect(response).toHaveProperty('error');
        expect(response.error).toHaveProperty('type');
        expect(response.error).toHaveProperty('message');
        expect(typeof response.error.type).toBe('string');
        expect(typeof response.error.message).toBe('string');
      });
    });

    test('custom error responses should include timestamp and details', () => {
      const response = engine.addPlayer(null);
      
      expect(response.success).toBe(false);
      expect(response.error).toHaveProperty('timestamp');
      expect(response.error).toHaveProperty('details');
      expect(typeof response.error.timestamp).toBe('string');
    });
  });

  describe('error recovery and state consistency', () => {
    let engine;

    beforeEach(() => {
      engine = new PokerEngine();
    });

    test('should maintain consistent state after errors', () => {
      // Try to add invalid player - should fail
      const result1 = engine.addPlayer(null);
      expect(result1.success).toBe(false);
      
      // Engine should still be functional
      const result2 = engine.addPlayer({ id: 'player1', name: 'Player 1' });
      expect(result2.success).toBe(true);
      
      // Game state should be consistent
      const gameState = engine.getGameState();
      expect(gameState.players).toHaveLength(1);
    });

    test('should handle multiple consecutive errors gracefully', () => {
      const invalidConfigs = [null, {}, { id: 'test' }];
      
      invalidConfigs.forEach(config => {
        const result = engine.addPlayer(config);
        expect(result.success).toBe(false);
      });
      
      // Engine should still work after multiple errors
      const validResult = engine.addPlayer({ id: 'player1', name: 'Player 1' });
      expect(validResult.success).toBe(true);
    });
  });
});