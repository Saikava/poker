/**
 * Game Controller for Poker UI
 * Provides a browser-compatible wrapper around the poker engine
 */

// Import the poker engine using the webpack alias
import PokerEngine from '@poker-engine/PokerEngine';

/**
 * GameController class that wraps the poker engine for browser use
 * Acts as a thin wrapper that passes calls directly to the poker engine
 */
class GameController {
  /**
   * Creates a new game controller instance
   * @param {Object} config - Game configuration options
   */
  constructor(config = {}) {
    // Default configuration for UI testing
    const defaultConfig = {
      smallBlind: 10,
      bigBlind: 20,
      maxPlayers: 6, // Smaller for UI testing
      minPlayers: 2,
      startingChips: 1000
    };

    // Merge provided config with defaults
    this.config = { ...defaultConfig, ...config };
    
    // Initialize the poker engine
    this.pokerEngine = new PokerEngine(this.config);
    
    // Track initialization state
    this.isInitialized = true;
  }

  /**
   * Player management methods
   */

  /**
   * Adds a player to the game
   * @param {Object} playerConfig - Player configuration
   * @param {string} playerConfig.id - Unique player identifier
   * @param {string} playerConfig.name - Player name
   * @param {number} [playerConfig.chips] - Starting chip count
   * @returns {Object} Result from poker engine
   */
  addPlayer(playerConfig) {
    if (!this.isInitialized) {
      return {
        success: false,
        error: {
          type: 'GameStateError',
          message: 'Game controller not initialized'
        }
      };
    }

    return this.pokerEngine.addPlayer(playerConfig);
  }

  /**
   * Removes a player from the game
   * @param {string} playerId - Player ID to remove
   * @returns {Object} Result from poker engine
   */
  removePlayer(playerId) {
    if (!this.isInitialized) {
      return {
        success: false,
        error: {
          type: 'GameStateError',
          message: 'Game controller not initialized'
        }
      };
    }

    return this.pokerEngine.removePlayer(playerId);
  }

  /**
   * Game control methods
   */

  /**
   * Starts a new game
   * @returns {Object} Result from poker engine
   */
  startGame() {
    if (!this.isInitialized) {
      return {
        success: false,
        error: {
          type: 'GameStateError',
          message: 'Game controller not initialized'
        }
      };
    }

    return this.pokerEngine.startGame();
  }

  /**
   * Starts a new hand
   * @returns {Object} Result from poker engine
   */
  startNewHand() {
    if (!this.isInitialized) {
      return {
        success: false,
        error: {
          type: 'GameStateError',
          message: 'Game controller not initialized'
        }
      };
    }

    return this.pokerEngine.startNewHand();
  }

  /**
   * Player action methods
   */

  /**
   * Processes a player action
   * @param {Object} actionConfig - Action configuration
   * @param {string} actionConfig.playerId - Player ID
   * @param {string} actionConfig.action - Action type ('fold', 'check', 'call', 'raise')
   * @param {number} [actionConfig.amount] - Amount for raise actions
   * @returns {Object} Result from poker engine
   */
  playerAction(actionConfig) {
    if (!this.isInitialized) {
      return {
        success: false,
        error: {
          type: 'GameStateError',
          message: 'Game controller not initialized'
        }
      };
    }

    return this.pokerEngine.playerAction(actionConfig);
  }

  /**
   * Gets available actions for a player
   * @param {string} playerId - Player ID
   * @returns {Object} Result from poker engine
   */
  getPlayerActions(playerId) {
    if (!this.isInitialized) {
      return {
        success: false,
        error: {
          type: 'GameStateError',
          message: 'Game controller not initialized'
        }
      };
    }

    return this.pokerEngine.getPlayerActions(playerId);
  }

  /**
   * Game state query methods
   */

  /**
   * Gets comprehensive game state
   * @returns {Object} Complete game state from poker engine
   */
  getGameState() {
    if (!this.isInitialized) {
      return {
        gameInfo: { isActive: false },
        players: [],
        table: { communityCards: [] },
        betting: {},
        pots: { total: 0 },
        config: this.config
      };
    }

    return this.pokerEngine.getGameState();
  }

  /**
   * Gets state for a specific player
   * @param {string} playerId - Player ID
   * @returns {Object} Player-specific state from poker engine
   */
  getPlayerState(playerId) {
    if (!this.isInitialized) {
      return {
        success: false,
        error: {
          type: 'GameStateError',
          message: 'Game controller not initialized'
        }
      };
    }

    return this.pokerEngine.getPlayerState(playerId);
  }

  /**
   * Checks if the game can start
   * @returns {Object} Result from poker engine
   */
  canStartGame() {
    if (!this.isInitialized) {
      return {
        canStart: false,
        playerCount: 0,
        minPlayers: this.config.minPlayers,
        maxPlayers: this.config.maxPlayers,
        isGameActive: false
      };
    }

    return this.pokerEngine.canStartGame();
  }

  /**
   * Gets game statistics
   * @returns {Object} Game statistics from poker engine
   */
  getGameStats() {
    if (!this.isInitialized) {
      return {
        handNumber: 0,
        totalPlayers: 0,
        activePlayers: 0,
        playersInHand: 0,
        totalPot: 0,
        sidePotCount: 0,
        currentPhase: 'waiting',
        isGameActive: false,
        config: this.config
      };
    }

    return this.pokerEngine.getGameStats();
  }

  /**
   * Event system methods
   */

  /**
   * Adds an event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (this.isInitialized && this.pokerEngine) {
      this.pokerEngine.on(event, callback);
    }
  }

  /**
   * Removes an event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function to remove
   */
  off(event, callback) {
    if (this.isInitialized && this.pokerEngine) {
      this.pokerEngine.off(event, callback);
    }
  }

  /**
   * Utility methods
   */

  /**
   * Gets the current configuration
   * @returns {Object} Current game configuration
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Checks if the controller is properly initialized
   * @returns {boolean} True if initialized
   */
  isReady() {
    return this.isInitialized && this.pokerEngine !== null;
  }

  /**
   * Destroys the game controller and cleans up resources
   */
  destroy() {
    if (this.pokerEngine) {
      this.pokerEngine.destroy();
      this.pokerEngine = null;
    }
    this.isInitialized = false;
  }

  /**
   * Performance and debugging methods
   */

  /**
   * Gets performance statistics
   * @returns {Object} Performance statistics from poker engine
   */
  getPerformanceStats() {
    if (!this.isInitialized) {
      return {
        handEvaluationCache: {},
        memoryManager: {},
        gameStats: this.getGameStats(),
        eventListeners: { totalListeners: 0, eventTypes: 0 }
      };
    }

    return this.pokerEngine.getPerformanceStats();
  }

  /**
   * Optimizes controller performance
   * @param {Object} options - Optimization options
   */
  optimize(options = {}) {
    if (this.isInitialized && this.pokerEngine) {
      this.pokerEngine.optimize(options);
    }
  }
}

export default GameController;