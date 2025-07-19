/**
 * Unit tests for GameController
 * Tests the poker engine integration and method responses
 */

const GameController = require('../src/gameController.js');

describe('GameController', () => {
  let gameController;

  beforeEach(() => {
    gameController = new GameController();
  });

  afterEach(() => {
    if (gameController) {
      gameController.destroy();
    }
  });

  describe('Initialization', () => {
    test('should initialize with default configuration', () => {
      expect(gameController.isReady()).toBe(true);
      
      const config = gameController.getConfig();
      expect(config.smallBlind).toBe(10);
      expect(config.bigBlind).toBe(20);
      expect(config.maxPlayers).toBe(6);
      expect(config.minPlayers).toBe(2);
      expect(config.startingChips).toBe(1000);
    });

    test('should initialize with custom configuration', () => {
      const customConfig = {
        smallBlind: 5,
        bigBlind: 10,
        maxPlayers: 4,
        startingChips: 500
      };
      
      const customController = new GameController(customConfig);
      const config = customController.getConfig();
      
      expect(config.smallBlind).toBe(5);
      expect(config.bigBlind).toBe(10);
      expect(config.maxPlayers).toBe(4);
      expect(config.startingChips).toBe(500);
      
      customController.destroy();
    });

    test('should return proper game state when not initialized', () => {
      gameController.destroy();
      
      const gameState = gameController.getGameState();
      expect(gameState.gameInfo.isActive).toBe(false);
      expect(gameState.players).toEqual([]);
      expect(gameState.table.communityCards).toEqual([]);
    });
  });

  describe('Player Management', () => {
    test('should add player successfully', () => {
      const playerConfig = {
        id: 'player1',
        name: 'Test Player 1'
      };

      const result = gameController.addPlayer(playerConfig);
      
      expect(result.success).toBe(true);
      expect(result.player).toBeDefined();
      expect(result.player.id).toBe('player1');
      expect(result.player.name).toBe('Test Player 1');
      expect(result.player.chips).toBe(1000); // Default starting chips
      expect(result.gameInfo).toBeDefined();
      expect(result.gameInfo.playerCount).toBe(1);
    });

    test('should add player with custom chips', () => {
      const playerConfig = {
        id: 'player1',
        name: 'Test Player 1',
        chips: 2000
      };

      const result = gameController.addPlayer(playerConfig);
      
      expect(result.success).toBe(true);
      expect(result.player.chips).toBe(2000);
    });

    test('should handle duplicate player ID error', () => {
      const playerConfig = {
        id: 'player1',
        name: 'Test Player 1'
      };

      // Add player first time
      const result1 = gameController.addPlayer(playerConfig);
      expect(result1.success).toBe(true);

      // Try to add same player again
      const result2 = gameController.addPlayer(playerConfig);
      expect(result2.success).toBe(false);
      expect(result2.error).toBeDefined();
      expect(result2.error.type).toBe('InvalidInputError');
    });

    test('should handle invalid player configuration', () => {
      const invalidConfigs = [
        { id: '', name: 'Test' }, // Empty ID
        { id: 'player1', name: '' }, // Empty name
        { name: 'Test' }, // Missing ID
        { id: 'player1' }, // Missing name
      ];

      invalidConfigs.forEach(config => {
        const result = gameController.addPlayer(config);
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    test('should remove player successfully', () => {
      // Add a player first
      const playerConfig = {
        id: 'player1',
        name: 'Test Player 1'
      };
      gameController.addPlayer(playerConfig);

      // Remove the player
      const result = gameController.removePlayer('player1');
      
      expect(result.success).toBe(true);
      expect(result.gameInfo).toBeDefined();
      expect(result.gameInfo.playerCount).toBe(0);
    });

    test('should handle removing non-existent player', () => {
      const result = gameController.removePlayer('nonexistent');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.type).toBe('PlayerNotFoundError');
    });

    test('should return error when not initialized', () => {
      gameController.destroy();
      
      const result = gameController.addPlayer({ id: 'test', name: 'Test' });
      expect(result.success).toBe(false);
      expect(result.error.type).toBe('GameStateError');
      expect(result.error.message).toBe('Game controller not initialized');
    });
  });

  describe('Game Control', () => {
    beforeEach(() => {
      // Add minimum players for testing
      gameController.addPlayer({ id: 'player1', name: 'Player 1' });
      gameController.addPlayer({ id: 'player2', name: 'Player 2' });
    });

    test('should check if game can start', () => {
      const result = gameController.canStartGame();
      
      expect(result.canStart).toBe(true);
      expect(result.playerCount).toBe(2);
      expect(result.minPlayers).toBe(2);
      expect(result.isGameActive).toBe(false);
    });

    test('should start game successfully', () => {
      const result = gameController.startGame();
      
      expect(result.success).toBe(true);
      expect(result.gameState).toBeDefined();
      expect(result.gameState.gameInfo.isActive).toBe(true);
      expect(result.message).toBe('Game started successfully');
    });

    test('should not start game with insufficient players', () => {
      const singlePlayerController = new GameController();
      singlePlayerController.addPlayer({ id: 'player1', name: 'Player 1' });
      
      const result = singlePlayerController.startGame();
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.type).toBe('GameStateError');
      
      singlePlayerController.destroy();
    });

    test('should start new hand after game started', () => {
      // Start initial game
      gameController.startGame();
      
      const result = gameController.startNewHand();
      
      expect(result.success).toBe(true);
      expect(result.gameState).toBeDefined();
      expect(result.handNumber).toBeDefined();
    });

    test('should not start new hand without active game', () => {
      const result = gameController.startNewHand();
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.type).toBe('GameStateError');
    });

    test('should return error when not initialized', () => {
      gameController.destroy();
      
      const result = gameController.startGame();
      expect(result.success).toBe(false);
      expect(result.error.type).toBe('GameStateError');
    });
  });

  describe('Player Actions', () => {
    beforeEach(() => {
      // Set up a game with players
      gameController.addPlayer({ id: 'player1', name: 'Player 1' });
      gameController.addPlayer({ id: 'player2', name: 'Player 2' });
      gameController.startGame();
    });

    test('should get available actions for current player', () => {
      const gameState = gameController.getGameState();
      const currentPlayerId = gameState.gameInfo.currentPlayer;
      
      const result = gameController.getPlayerActions(currentPlayerId);
      
      expect(result.success).toBe(true);
      expect(result.playerId).toBe(currentPlayerId);
      expect(result.availableActions).toBeDefined();
      expect(Array.isArray(result.availableActions)).toBe(true);
      expect(result.actionDetails).toBeDefined();
    });

    test('should process valid player action', () => {
      const gameState = gameController.getGameState();
      const currentPlayerId = gameState.gameInfo.currentPlayer;
      
      // Get available actions first
      const actionsResult = gameController.getPlayerActions(currentPlayerId);
      expect(actionsResult.success).toBe(true);
      
      // Use the first available action
      const availableAction = actionsResult.availableActions[0];
      
      const actionConfig = {
        playerId: currentPlayerId,
        action: availableAction
      };
      
      const result = gameController.playerAction(actionConfig);
      
      expect(result.success).toBe(true);
      expect(result.action).toBeDefined();
      expect(result.action.playerId).toBe(currentPlayerId);
      expect(result.action.action).toBe(availableAction);
      expect(result.gameState).toBeDefined();
    });

    test('should handle invalid player action', () => {
      const actionConfig = {
        playerId: 'nonexistent',
        action: 'fold'
      };
      
      const result = gameController.playerAction(actionConfig);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should handle action when not player turn', () => {
      const gameState = gameController.getGameState();
      const currentPlayerId = gameState.gameInfo.currentPlayer;
      
      // Find a player who is not current
      const otherPlayer = gameState.players.find(p => p.id !== currentPlayerId);
      
      const actionConfig = {
        playerId: otherPlayer.id,
        action: 'fold'
      };
      
      const result = gameController.playerAction(actionConfig);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should return error when not initialized', () => {
      gameController.destroy();
      
      const result = gameController.playerAction({
        playerId: 'player1',
        action: 'fold'
      });
      
      expect(result.success).toBe(false);
      expect(result.error.type).toBe('GameStateError');
    });
  });

  describe('Game State Queries', () => {
    beforeEach(() => {
      gameController.addPlayer({ id: 'player1', name: 'Player 1' });
      gameController.addPlayer({ id: 'player2', name: 'Player 2' });
    });

    test('should get comprehensive game state', () => {
      const gameState = gameController.getGameState();
      
      expect(gameState.gameInfo).toBeDefined();
      expect(gameState.players).toBeDefined();
      expect(Array.isArray(gameState.players)).toBe(true);
      expect(gameState.table).toBeDefined();
      expect(gameState.betting).toBeDefined();
      expect(gameState.pots).toBeDefined();
      expect(gameState.config).toBeDefined();
    });

    test('should get player-specific state', () => {
      const result = gameController.getPlayerState('player1');
      
      expect(result.success).toBe(true);
      expect(result.player).toBeDefined();
      expect(result.player.id).toBe('player1');
      expect(result.gamePhase).toBeDefined();
      expect(result.isCurrentPlayer).toBeDefined();
    });

    test('should handle getting state for non-existent player', () => {
      const result = gameController.getPlayerState('nonexistent');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.type).toBe('PlayerNotFoundError');
    });

    test('should get game statistics', () => {
      const stats = gameController.getGameStats();
      
      expect(stats.handNumber).toBeDefined();
      expect(stats.totalPlayers).toBe(2);
      expect(stats.activePlayers).toBeDefined();
      expect(stats.totalPot).toBeDefined();
      expect(stats.currentPhase).toBeDefined();
      expect(stats.isGameActive).toBeDefined();
      expect(stats.config).toBeDefined();
    });
  });

  describe('Event System', () => {
    test('should add and remove event listeners', () => {
      const mockCallback = jest.fn();
      
      // Add event listener
      gameController.on('gameStarted', mockCallback);
      
      // Start a game to trigger event
      gameController.addPlayer({ id: 'player1', name: 'Player 1' });
      gameController.addPlayer({ id: 'player2', name: 'Player 2' });
      gameController.startGame();
      
      // Event should have been called
      expect(mockCallback).toHaveBeenCalled();
      
      // Remove event listener
      gameController.off('gameStarted', mockCallback);
      
      // Reset mock and start new hand
      mockCallback.mockReset();
      gameController.startNewHand();
      
      // The gameStarted event should not be called for new hand
      // (but other events might be called)
    });

    test('should handle event listeners when not initialized', () => {
      gameController.destroy();
      
      const mockCallback = jest.fn();
      
      // Should not throw error
      expect(() => {
        gameController.on('gameStarted', mockCallback);
        gameController.off('gameStarted', mockCallback);
      }).not.toThrow();
    });
  });

  describe('Utility Methods', () => {
    test('should get configuration', () => {
      const config = gameController.getConfig();
      
      expect(config).toBeDefined();
      expect(config.smallBlind).toBe(10);
      expect(config.bigBlind).toBe(20);
      expect(config.maxPlayers).toBe(6);
      expect(config.minPlayers).toBe(2);
      expect(config.startingChips).toBe(1000);
    });

    test('should check if ready', () => {
      expect(gameController.isReady()).toBe(true);
      
      gameController.destroy();
      expect(gameController.isReady()).toBe(false);
    });

    test('should get performance stats', () => {
      const stats = gameController.getPerformanceStats();
      
      expect(stats).toBeDefined();
      expect(stats.gameStats).toBeDefined();
      expect(stats.eventListeners).toBeDefined();
    });

    test('should handle performance stats when not initialized', () => {
      gameController.destroy();
      
      const stats = gameController.getPerformanceStats();
      expect(stats.gameStats.isGameActive).toBe(false);
      expect(stats.eventListeners.totalListeners).toBe(0);
    });

    test('should optimize performance', () => {
      // Should not throw error
      expect(() => {
        gameController.optimize();
      }).not.toThrow();
    });

    test('should destroy properly', () => {
      expect(gameController.isReady()).toBe(true);
      
      gameController.destroy();
      
      expect(gameController.isReady()).toBe(false);
    });
  });

  describe('Integration with Poker Engine', () => {
    test('should maintain state consistency with poker engine', () => {
      // Add players
      gameController.addPlayer({ id: 'player1', name: 'Player 1' });
      gameController.addPlayer({ id: 'player2', name: 'Player 2' });
      
      // Start game
      const startResult = gameController.startGame();
      expect(startResult.success).toBe(true);
      
      // Get game state
      const gameState = gameController.getGameState();
      expect(gameState.gameInfo.isActive).toBe(true);
      expect(gameState.players.length).toBe(2);
      
      // Verify player states match
      const player1State = gameController.getPlayerState('player1');
      const player2State = gameController.getPlayerState('player2');
      
      expect(player1State.success).toBe(true);
      expect(player2State.success).toBe(true);
      
      // Verify one player is current player
      const currentPlayerId = gameState.gameInfo.currentPlayer;
      expect(['player1', 'player2']).toContain(currentPlayerId);
    });

    test('should handle complete game flow', () => {
      // Setup game
      gameController.addPlayer({ id: 'player1', name: 'Player 1' });
      gameController.addPlayer({ id: 'player2', name: 'Player 2' });
      gameController.startGame();
      
      let gameState = gameController.getGameState();
      let actionCount = 0;
      const maxActions = 10; // Prevent infinite loops
      
      // Play through some actions
      while (gameState.gameInfo.isActive && actionCount < maxActions) {
        const currentPlayerId = gameState.gameInfo.currentPlayer;
        
        if (!currentPlayerId) break;
        
        const actionsResult = gameController.getPlayerActions(currentPlayerId);
        if (!actionsResult.success || actionsResult.availableActions.length === 0) {
          break;
        }
        
        // Take the first available action
        const action = actionsResult.availableActions[0];
        const actionResult = gameController.playerAction({
          playerId: currentPlayerId,
          action: action
        });
        
        expect(actionResult.success).toBe(true);
        
        gameState = gameController.getGameState();
        actionCount++;
      }
      
      // Verify game state is still consistent
      expect(gameState.gameInfo).toBeDefined();
      expect(gameState.players.length).toBe(2);
    });
  });
});