/**
 * Unit tests for game control functionality
 * Tests game control logic and button state management
 */

describe('Game Control Logic', () => {
  // Mock game controller for testing
  const createMockGameController = () => ({
    startGame: jest.fn(),
    startNewHand: jest.fn(),
    canStartGame: jest.fn(),
    getGameStats: jest.fn(),
    getGameState: jest.fn(),
    getConfig: jest.fn(() => ({ startingChips: 1000, minPlayers: 2, maxPlayers: 6 })),
    destroy: jest.fn(),
    isReady: jest.fn(() => true)
  });

  // Simple game control logic class for testing
  class GameControlManager {
    constructor(gameController) {
      this.gameController = gameController;
    }

    startGame() {
      const result = this.gameController.startGame();
      return result;
    }

    startNewHand() {
      const result = this.gameController.startNewHand();
      return result;
    }

    canStartGame() {
      return this.gameController.canStartGame();
    }

    getGameControlState() {
      const gameStats = this.gameController.getGameStats();
      const canStartResult = this.gameController.canStartGame();

      return {
        canStart: canStartResult.canStart,
        isGameActive: gameStats.isGameActive,
        currentPhase: gameStats.currentPhase,
        startButtonEnabled: !gameStats.isGameActive && canStartResult.canStart,
        startButtonText: gameStats.isGameActive ? 'Game Active' : 'Start Game',
        newHandButtonEnabled: gameStats.isGameActive && (gameStats.currentPhase === 'complete' || gameStats.currentPhase === 'waiting'),
        newHandButtonText: gameStats.isGameActive && gameStats.currentPhase !== 'complete' && gameStats.currentPhase !== 'waiting' ? 'Hand in Progress' : 'New Hand'
      };
    }
  }

  describe('Starting Game', () => {
    test('should start game successfully', () => {
      const mockGameController = createMockGameController();
      mockGameController.startGame.mockReturnValue({ success: true });
      
      const gameControlManager = new GameControlManager(mockGameController);
      
      const result = gameControlManager.startGame();
      
      expect(result.success).toBe(true);
      expect(mockGameController.startGame).toHaveBeenCalled();
    });

    test('should handle start game errors', () => {
      const mockGameController = createMockGameController();
      mockGameController.startGame.mockReturnValue({
        success: false,
        error: {
          type: 'GameStateError',
          message: 'Not enough players to start game'
        }
      });
      
      const gameControlManager = new GameControlManager(mockGameController);
      
      const result = gameControlManager.startGame();
      
      expect(result.success).toBe(false);
      expect(result.error.message).toBe('Not enough players to start game');
    });

    test('should handle start game errors without error object', () => {
      const mockGameController = createMockGameController();
      mockGameController.startGame.mockReturnValue({ success: false });
      
      const gameControlManager = new GameControlManager(mockGameController);
      
      const result = gameControlManager.startGame();
      
      expect(result.success).toBe(false);
    });
  });

  describe('Starting New Hand', () => {
    test('should start new hand successfully', () => {
      const mockGameController = createMockGameController();
      mockGameController.startNewHand.mockReturnValue({ success: true });
      
      const gameControlManager = new GameControlManager(mockGameController);
      
      const result = gameControlManager.startNewHand();
      
      expect(result.success).toBe(true);
      expect(mockGameController.startNewHand).toHaveBeenCalled();
    });

    test('should handle start new hand errors', () => {
      const mockGameController = createMockGameController();
      mockGameController.startNewHand.mockReturnValue({
        success: false,
        error: {
          type: 'GameStateError',
          message: 'Cannot start new hand while current hand is in progress'
        }
      });
      
      const gameControlManager = new GameControlManager(mockGameController);
      
      const result = gameControlManager.startNewHand();
      
      expect(result.success).toBe(false);
      expect(result.error.message).toBe('Cannot start new hand while current hand is in progress');
    });

    test('should handle start new hand errors without error object', () => {
      const mockGameController = createMockGameController();
      mockGameController.startNewHand.mockReturnValue({ success: false });
      
      const gameControlManager = new GameControlManager(mockGameController);
      
      const result = gameControlManager.startNewHand();
      
      expect(result.success).toBe(false);
    });
  });

  describe('Game Control State Management', () => {
    test('should return correct state when game not started', () => {
      const mockGameController = createMockGameController();
      mockGameController.canStartGame.mockReturnValue({ canStart: true });
      mockGameController.getGameStats.mockReturnValue({
        isGameActive: false,
        currentPhase: 'waiting',
        handNumber: 0
      });
      
      const gameControlManager = new GameControlManager(mockGameController);
      
      const state = gameControlManager.getGameControlState();
      
      expect(state.canStart).toBe(true);
      expect(state.isGameActive).toBe(false);
      expect(state.startButtonEnabled).toBe(true);
      expect(state.startButtonText).toBe('Start Game');
      expect(state.newHandButtonEnabled).toBe(false);
      expect(state.newHandButtonText).toBe('New Hand');
    });

    test('should return correct state when game is active', () => {
      const mockGameController = createMockGameController();
      mockGameController.canStartGame.mockReturnValue({ canStart: false });
      mockGameController.getGameStats.mockReturnValue({
        isGameActive: true,
        currentPhase: 'preflop',
        handNumber: 1
      });
      
      const gameControlManager = new GameControlManager(mockGameController);
      
      const state = gameControlManager.getGameControlState();
      
      expect(state.canStart).toBe(false);
      expect(state.isGameActive).toBe(true);
      expect(state.startButtonEnabled).toBe(false);
      expect(state.startButtonText).toBe('Game Active');
      expect(state.newHandButtonEnabled).toBe(false);
      expect(state.newHandButtonText).toBe('Hand in Progress');
    });

    test('should return correct state when hand is complete', () => {
      const mockGameController = createMockGameController();
      mockGameController.canStartGame.mockReturnValue({ canStart: false });
      mockGameController.getGameStats.mockReturnValue({
        isGameActive: true,
        currentPhase: 'complete',
        handNumber: 1
      });
      
      const gameControlManager = new GameControlManager(mockGameController);
      
      const state = gameControlManager.getGameControlState();
      
      expect(state.isGameActive).toBe(true);
      expect(state.startButtonEnabled).toBe(false);
      expect(state.startButtonText).toBe('Game Active');
      expect(state.newHandButtonEnabled).toBe(true);
      expect(state.newHandButtonText).toBe('New Hand');
    });

    test('should return correct state when insufficient players', () => {
      const mockGameController = createMockGameController();
      mockGameController.canStartGame.mockReturnValue({ canStart: false });
      mockGameController.getGameStats.mockReturnValue({
        isGameActive: false,
        currentPhase: 'waiting',
        handNumber: 0
      });
      
      const gameControlManager = new GameControlManager(mockGameController);
      
      const state = gameControlManager.getGameControlState();
      
      expect(state.canStart).toBe(false);
      expect(state.isGameActive).toBe(false);
      expect(state.startButtonEnabled).toBe(false);
      expect(state.startButtonText).toBe('Start Game');
      expect(state.newHandButtonEnabled).toBe(false);
    });
  });

  describe('Button State Logic', () => {
    test('should enable start button only when game can start', () => {
      const mockGameController = createMockGameController();
      
      // Test case 1: Can start game
      mockGameController.canStartGame.mockReturnValue({ canStart: true });
      mockGameController.getGameStats.mockReturnValue({
        isGameActive: false,
        currentPhase: 'waiting'
      });
      
      const gameControlManager = new GameControlManager(mockGameController);
      let state = gameControlManager.getGameControlState();
      
      expect(state.startButtonEnabled).toBe(true);
      
      // Test case 2: Cannot start game
      mockGameController.canStartGame.mockReturnValue({ canStart: false });
      state = gameControlManager.getGameControlState();
      
      expect(state.startButtonEnabled).toBe(false);
    });

    test('should disable start button when game is active', () => {
      const mockGameController = createMockGameController();
      mockGameController.canStartGame.mockReturnValue({ canStart: true });
      mockGameController.getGameStats.mockReturnValue({
        isGameActive: true,
        currentPhase: 'preflop'
      });
      
      const gameControlManager = new GameControlManager(mockGameController);
      const state = gameControlManager.getGameControlState();
      
      expect(state.startButtonEnabled).toBe(false);
      expect(state.startButtonText).toBe('Game Active');
    });

    test('should enable new hand button only when appropriate', () => {
      const mockGameController = createMockGameController();
      
      // Test case 1: Hand complete - should enable
      mockGameController.getGameStats.mockReturnValue({
        isGameActive: true,
        currentPhase: 'complete'
      });
      mockGameController.canStartGame.mockReturnValue({ canStart: false });
      
      const gameControlManager = new GameControlManager(mockGameController);
      let state = gameControlManager.getGameControlState();
      
      expect(state.newHandButtonEnabled).toBe(true);
      expect(state.newHandButtonText).toBe('New Hand');
      
      // Test case 2: Hand in progress - should disable
      mockGameController.getGameStats.mockReturnValue({
        isGameActive: true,
        currentPhase: 'preflop'
      });
      mockGameController.canStartGame.mockReturnValue({ canStart: false });
      
      state = gameControlManager.getGameControlState();
      
      expect(state.newHandButtonEnabled).toBe(false);
      expect(state.newHandButtonText).toBe('Hand in Progress');
      
      // Test case 3: Game not active - should disable
      mockGameController.getGameStats.mockReturnValue({
        isGameActive: false,
        currentPhase: 'waiting'
      });
      mockGameController.canStartGame.mockReturnValue({ canStart: true });
      
      state = gameControlManager.getGameControlState();
      
      expect(state.newHandButtonEnabled).toBe(false);
      expect(state.newHandButtonText).toBe('New Hand');
    });
  });

  describe('Game Phase Handling', () => {
    test('should handle all game phases correctly', () => {
      const mockGameController = createMockGameController();
      const gameControlManager = new GameControlManager(mockGameController);
      
      const phases = ['waiting', 'preflop', 'flop', 'turn', 'river', 'showdown', 'complete'];
      
      phases.forEach(phase => {
        mockGameController.getGameStats.mockReturnValue({
          isGameActive: phase !== 'waiting',
          currentPhase: phase
        });
        mockGameController.canStartGame.mockReturnValue({ canStart: phase === 'waiting' });
        
        const state = gameControlManager.getGameControlState();
        
        if (phase === 'waiting') {
          expect(state.startButtonEnabled).toBe(true);
          expect(state.newHandButtonEnabled).toBe(false);
        } else if (phase === 'complete') {
          expect(state.startButtonEnabled).toBe(false);
          expect(state.newHandButtonEnabled).toBe(true);
        } else {
          expect(state.startButtonEnabled).toBe(false);
          expect(state.newHandButtonEnabled).toBe(false);
        }
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle missing game stats gracefully', () => {
      const mockGameController = createMockGameController();
      mockGameController.getGameStats.mockReturnValue({});
      mockGameController.canStartGame.mockReturnValue({ canStart: false });
      
      const gameControlManager = new GameControlManager(mockGameController);
      
      expect(() => {
        const state = gameControlManager.getGameControlState();
        expect(state).toBeDefined();
      }).not.toThrow();
    });

    test('should handle missing canStartGame result gracefully', () => {
      const mockGameController = createMockGameController();
      mockGameController.getGameStats.mockReturnValue({
        isGameActive: false,
        currentPhase: 'waiting'
      });
      mockGameController.canStartGame.mockReturnValue({});
      
      const gameControlManager = new GameControlManager(mockGameController);
      
      expect(() => {
        const state = gameControlManager.getGameControlState();
        expect(state).toBeDefined();
      }).not.toThrow();
    });
  });
});