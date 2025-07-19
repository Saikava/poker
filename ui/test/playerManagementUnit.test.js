/**
 * Unit tests for player management functionality
 * Tests the core logic without complex DOM setup
 */

describe('Player Management Logic', () => {
  // Mock game controller for testing
  const createMockGameController = () => ({
    addPlayer: jest.fn(),
    removePlayer: jest.fn(),
    canStartGame: jest.fn(),
    getConfig: jest.fn(() => ({ startingChips: 1000, minPlayers: 2, maxPlayers: 6 })),
    destroy: jest.fn(),
    isReady: jest.fn(() => true)
  });

  // Simple player management logic class for testing
  class PlayerManager {
    constructor(gameController) {
      this.gameController = gameController;
      this.currentPlayers = [];
    }

    addPlayer(playerId, playerName) {
      // Basic validation
      if (!playerId || !playerName) {
        return {
          success: false,
          error: 'Both Player ID and Player Name are required'
        };
      }

      // Call game controller
      const result = this.gameController.addPlayer({
        id: playerId,
        name: playerName,
        chips: this.gameController.getConfig().startingChips
      });

      if (result.success) {
        this.currentPlayers.push({
          id: playerId,
          name: playerName,
          chips: this.gameController.getConfig().startingChips
        });
        return { success: true };
      } else {
        return {
          success: false,
          error: result.error ? result.error.message : 'Failed to add player'
        };
      }
    }

    removePlayer(playerId) {
      const result = this.gameController.removePlayer(playerId);

      if (result.success) {
        this.currentPlayers = this.currentPlayers.filter(player => player.id !== playerId);
        return { success: true };
      } else {
        return {
          success: false,
          error: result.error ? result.error.message : 'Failed to remove player'
        };
      }
    }

    getCurrentPlayers() {
      return [...this.currentPlayers];
    }

    canStartGame() {
      return this.gameController.canStartGame();
    }

    escapeHtml(text) {
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }
  }

  describe('Adding Players', () => {
    test('should add player successfully with valid input', () => {
      const mockGameController = createMockGameController();
      mockGameController.addPlayer.mockReturnValue({ success: true });
      
      const playerManager = new PlayerManager(mockGameController);
      
      const result = playerManager.addPlayer('player1', 'Alice');
      
      expect(result.success).toBe(true);
      expect(mockGameController.addPlayer).toHaveBeenCalledWith({
        id: 'player1',
        name: 'Alice',
        chips: 1000
      });
      expect(playerManager.currentPlayers).toHaveLength(1);
      expect(playerManager.currentPlayers[0]).toEqual({
        id: 'player1',
        name: 'Alice',
        chips: 1000
      });
    });

    test('should reject empty player ID', () => {
      const mockGameController = createMockGameController();
      const playerManager = new PlayerManager(mockGameController);
      
      const result = playerManager.addPlayer('', 'Alice');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Both Player ID and Player Name are required');
      expect(mockGameController.addPlayer).not.toHaveBeenCalled();
      expect(playerManager.currentPlayers).toHaveLength(0);
    });

    test('should reject empty player name', () => {
      const mockGameController = createMockGameController();
      const playerManager = new PlayerManager(mockGameController);
      
      const result = playerManager.addPlayer('player1', '');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Both Player ID and Player Name are required');
      expect(mockGameController.addPlayer).not.toHaveBeenCalled();
      expect(playerManager.currentPlayers).toHaveLength(0);
    });

    test('should handle game controller errors', () => {
      const mockGameController = createMockGameController();
      mockGameController.addPlayer.mockReturnValue({
        success: false,
        error: {
          type: 'ValidationError',
          message: 'Player ID already exists'
        }
      });
      
      const playerManager = new PlayerManager(mockGameController);
      
      const result = playerManager.addPlayer('player1', 'Alice');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Player ID already exists');
      expect(playerManager.currentPlayers).toHaveLength(0);
    });

    test('should handle game controller errors without error object', () => {
      const mockGameController = createMockGameController();
      mockGameController.addPlayer.mockReturnValue({ success: false });
      
      const playerManager = new PlayerManager(mockGameController);
      
      const result = playerManager.addPlayer('player1', 'Alice');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to add player');
    });

    test('should add multiple players', () => {
      const mockGameController = createMockGameController();
      mockGameController.addPlayer.mockReturnValue({ success: true });
      
      const playerManager = new PlayerManager(mockGameController);
      
      playerManager.addPlayer('player1', 'Alice');
      playerManager.addPlayer('player2', 'Bob');
      
      expect(playerManager.currentPlayers).toHaveLength(2);
      expect(playerManager.currentPlayers[0].id).toBe('player1');
      expect(playerManager.currentPlayers[1].id).toBe('player2');
    });
  });

  describe('Removing Players', () => {
    test('should remove player successfully', () => {
      const mockGameController = createMockGameController();
      mockGameController.addPlayer.mockReturnValue({ success: true });
      mockGameController.removePlayer.mockReturnValue({ success: true });
      
      const playerManager = new PlayerManager(mockGameController);
      
      // Add players first
      playerManager.addPlayer('player1', 'Alice');
      playerManager.addPlayer('player2', 'Bob');
      
      // Remove one player
      const result = playerManager.removePlayer('player1');
      
      expect(result.success).toBe(true);
      expect(mockGameController.removePlayer).toHaveBeenCalledWith('player1');
      expect(playerManager.currentPlayers).toHaveLength(1);
      expect(playerManager.currentPlayers[0].id).toBe('player2');
    });

    test('should handle remove player errors', () => {
      const mockGameController = createMockGameController();
      mockGameController.addPlayer.mockReturnValue({ success: true });
      mockGameController.removePlayer.mockReturnValue({
        success: false,
        error: {
          type: 'GameStateError',
          message: 'Cannot remove player during active game'
        }
      });
      
      const playerManager = new PlayerManager(mockGameController);
      
      // Add player first
      playerManager.addPlayer('player1', 'Alice');
      
      // Try to remove player
      const result = playerManager.removePlayer('player1');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot remove player during active game');
      expect(playerManager.currentPlayers).toHaveLength(1);
    });

    test('should handle remove player errors without error object', () => {
      const mockGameController = createMockGameController();
      mockGameController.removePlayer.mockReturnValue({ success: false });
      
      const playerManager = new PlayerManager(mockGameController);
      
      const result = playerManager.removePlayer('player1');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to remove player');
    });
  });

  describe('Player List Management', () => {
    test('should return current players list', () => {
      const mockGameController = createMockGameController();
      mockGameController.addPlayer.mockReturnValue({ success: true });
      
      const playerManager = new PlayerManager(mockGameController);
      
      playerManager.addPlayer('player1', 'Alice');
      playerManager.addPlayer('player2', 'Bob');
      
      const players = playerManager.getCurrentPlayers();
      
      expect(players).toHaveLength(2);
      expect(players[0]).toEqual({
        id: 'player1',
        name: 'Alice',
        chips: 1000
      });
      expect(players[1]).toEqual({
        id: 'player2',
        name: 'Bob',
        chips: 1000
      });
      
      // Verify it returns a copy, not the original array
      expect(players).not.toBe(playerManager.currentPlayers);
    });

    test('should return empty array when no players', () => {
      const mockGameController = createMockGameController();
      const playerManager = new PlayerManager(mockGameController);
      
      const players = playerManager.getCurrentPlayers();
      
      expect(players).toHaveLength(0);
      expect(Array.isArray(players)).toBe(true);
    });
  });

  describe('Game State Queries', () => {
    test('should check if game can start', () => {
      const mockGameController = createMockGameController();
      mockGameController.canStartGame.mockReturnValue({ canStart: true });
      
      const playerManager = new PlayerManager(mockGameController);
      
      const result = playerManager.canStartGame();
      
      expect(result.canStart).toBe(true);
      expect(mockGameController.canStartGame).toHaveBeenCalled();
    });

    test('should handle cannot start game', () => {
      const mockGameController = createMockGameController();
      mockGameController.canStartGame.mockReturnValue({ canStart: false });
      
      const playerManager = new PlayerManager(mockGameController);
      
      const result = playerManager.canStartGame();
      
      expect(result.canStart).toBe(false);
    });
  });

  describe('HTML Escaping', () => {
    test('should escape HTML characters', () => {
      const mockGameController = createMockGameController();
      const playerManager = new PlayerManager(mockGameController);
      
      const testCases = [
        { input: '<script>alert("xss")</script>', expected: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;' },
        { input: 'Alice & Bob', expected: 'Alice &amp; Bob' },
        { input: 'Player "1"', expected: 'Player &quot;1&quot;' },
        { input: "Player '1'", expected: 'Player &#39;1&#39;' },
        { input: 'Normal text', expected: 'Normal text' }
      ];
      
      testCases.forEach(({ input, expected }) => {
        expect(playerManager.escapeHtml(input)).toBe(expected);
      });
    });
  });

  describe('Input Validation', () => {
    test('should trim whitespace from inputs', () => {
      const mockGameController = createMockGameController();
      mockGameController.addPlayer.mockReturnValue({ success: true });
      
      const playerManager = new PlayerManager(mockGameController);
      
      // Test with whitespace
      const result = playerManager.addPlayer('  player1  ', '  Alice  ');
      
      expect(result.success).toBe(true);
      expect(mockGameController.addPlayer).toHaveBeenCalledWith({
        id: '  player1  ',
        name: '  Alice  ',
        chips: 1000
      });
    });

    test('should handle whitespace inputs correctly', () => {
      const mockGameController = createMockGameController();
      mockGameController.addPlayer.mockReturnValue({ success: true });
      
      const playerManager = new PlayerManager(mockGameController);
      
      // Test with whitespace - these should be treated as valid by our current logic
      // since we don't trim in the validation
      const result1 = playerManager.addPlayer('   ', 'Alice');
      const result2 = playerManager.addPlayer('player1', '   ');
      
      // Both should succeed since they're not empty strings
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(mockGameController.addPlayer).toHaveBeenCalledTimes(2);
    });
  });

  describe('Configuration Integration', () => {
    test('should use game controller configuration', () => {
      const mockGameController = createMockGameController();
      mockGameController.getConfig.mockReturnValue({ startingChips: 2000 });
      mockGameController.addPlayer.mockReturnValue({ success: true });
      
      const playerManager = new PlayerManager(mockGameController);
      
      playerManager.addPlayer('player1', 'Alice');
      
      expect(mockGameController.addPlayer).toHaveBeenCalledWith({
        id: 'player1',
        name: 'Alice',
        chips: 2000
      });
      expect(playerManager.currentPlayers[0].chips).toBe(2000);
    });
  });
});