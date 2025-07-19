const GameManager = require('./managers/GameManager');
const ValidationUtils = require('./utilities/ValidationUtils');
const { memoryManager } = require('./utilities/MemoryManager');
const { 
  InvalidInputError, 
  PlayerNotFoundError, 
  GameStateError,
  ConfigurationError
} = require('./errors/PokerErrors');

/**
 * Main entry point for the Texas Hold'em Poker Engine
 * Provides a clean API interface for poker game management
 */
class PokerEngine {
  /**
   * Creates a new poker engine instance
   * @param {Object} config - Game configuration options
   * @param {number} config.smallBlind - Small blind amount (default: 10)
   * @param {number} config.bigBlind - Big blind amount (default: 20)
   * @param {number} config.maxPlayers - Maximum number of players (default: 10)
   * @param {number} config.minPlayers - Minimum number of players (default: 2)
   * @param {number} config.startingChips - Default starting chips for players (default: 1000)
   */
  constructor(config = {}) {
    // Validate configuration
    try {
      ValidationUtils.validateGameConfig(config);
    } catch (error) {
      throw error;
    }

    // Game configuration with defaults
    this.config = {
      smallBlind: config.smallBlind || 10,
      bigBlind: config.bigBlind || 20,
      maxPlayers: config.maxPlayers || 10,
      minPlayers: config.minPlayers || 2,
      startingChips: config.startingChips || 1000,
      ...config
    };

    // Initialize game manager with configuration
    this.gameManager = new GameManager({
      smallBlind: this.config.smallBlind,
      bigBlind: this.config.bigBlind,
      maxPlayers: this.config.maxPlayers,
      minPlayers: this.config.minPlayers
    });

    // Event system
    this.eventListeners = new Map();
    this.setupEventForwarding();

    // Register cleanup callback for memory management
    memoryManager.registerCleanupCallback(() => {
      this.performCleanup();
    });
  }

  /**
   * Game initialization methods
   */

  /**
   * Adds a player to the game
   * @param {Object} playerConfig - Player configuration
   * @param {string} playerConfig.id - Unique player identifier
   * @param {string} playerConfig.name - Player name
   * @param {number} [playerConfig.chips] - Starting chip count (uses default if not specified)
   * @returns {Object} Result object with success status and player data
   */
  addPlayer(playerConfig) {
    try {
      // Validate player configuration using ValidationUtils
      ValidationUtils.validatePlayerConfig(playerConfig);

      const chips = playerConfig.chips || this.config.startingChips;
      const result = this.gameManager.addPlayer(playerConfig.id, playerConfig.name, chips);

      if (result.success) {
        return {
          success: true,
          player: result.player,
          gameInfo: {
            playerCount: this.gameManager.playerManager.getPlayerCount(),
            canStartGame: result.canStartGame,
            maxPlayers: this.config.maxPlayers
          }
        };
      } else {
        return {
          success: false,
          error: {
            type: 'GameStateError',
            message: result.error,
            details: { playerId: playerConfig.id }
          }
        };
      }
    } catch (error) {
      // Handle custom poker engine errors
      if (error.name && error.name.endsWith('Error') && error.toResponse) {
        return error.toResponse();
      }
      
      return {
        success: false,
        error: {
          type: 'UnexpectedError',
          message: error.message,
          details: { playerConfig }
        }
      };
    }
  }

  /**
   * Removes a player from the game
   * @param {string} playerId - Player ID to remove
   * @returns {Object} Result object with success status
   */
  removePlayer(playerId) {
    try {
      // Validate player ID using ValidationUtils
      ValidationUtils.validateString(playerId, 'Player ID');

      const result = this.gameManager.removePlayer(playerId);

      if (result.success) {
        return {
          success: true,
          gameInfo: {
            playerCount: result.playerCount,
            canContinueGame: result.canContinueGame
          }
        };
      } else {
        return {
          success: false,
          error: {
            type: 'PlayerNotFoundError',
            message: result.error || 'Player not found',
            details: { playerId }
          }
        };
      }
    } catch (error) {
      // Handle custom poker engine errors
      if (error.name && error.name.endsWith('Error') && error.toResponse) {
        return error.toResponse();
      }
      
      return {
        success: false,
        error: {
          type: 'UnexpectedError',
          message: error.message,
          details: { playerId }
        }
      };
    }
  }

  /**
   * Starts a new game
   * @returns {Object} Result object with success status and initial game state
   */
  startGame() {
    try {
      const result = this.gameManager.startGame();

      if (result.success) {
        return {
          success: true,
          gameState: this.getGameState(),
          message: 'Game started successfully'
        };
      } else {
        return {
          success: false,
          error: {
            type: 'GameStateError',
            message: result.error,
            details: {
              playerCount: this.gameManager.playerManager.getPlayerCount(),
              minPlayers: this.config.minPlayers
            }
          }
        };
      }
    } catch (error) {
      return {
        success: false,
        error: {
          type: 'UnexpectedError',
          message: error.message
        }
      };
    }
  }

  /**
   * Starts a new hand
   * @returns {Object} Result object with success status and game state
   */
  startNewHand() {
    try {
      const result = this.gameManager.startNewHand();

      if (result.success) {
        return {
          success: true,
          gameState: this.getGameState(),
          handNumber: result.handNumber
        };
      } else {
        return {
          success: false,
          error: {
            type: 'GameStateError',
            message: result.error
          }
        };
      }
    } catch (error) {
      return {
        success: false,
        error: {
          type: 'UnexpectedError',
          message: error.message
        }
      };
    }
  }

  /**
   * Player action processing methods
   */

  /**
   * Processes a player action
   * @param {Object} actionConfig - Action configuration
   * @param {string} actionConfig.playerId - Player ID
   * @param {string} actionConfig.action - Action type ('fold', 'check', 'call', 'raise')
   * @param {number} [actionConfig.amount] - Amount for raise actions
   * @returns {Object} Result object with success status and updated game state
   */
  playerAction(actionConfig) {
    try {
      // Validate action configuration using ValidationUtils
      ValidationUtils.validateActionConfig(actionConfig);

      const { playerId, action, amount = 0 } = actionConfig;

      const result = this.gameManager.processPlayerAction(playerId, action, amount);

      if (result.success) {
        return {
          success: true,
          action: {
            playerId,
            action,
            amount: result.action?.amount || amount
          },
          gameState: this.getGameState(),
          nextPlayer: result.nextPlayer,
          handComplete: result.handComplete || false,
          gameEnded: result.gameEnded || false
        };
      } else {
        return {
          success: false,
          error: {
            type: this.getErrorType(result.error),
            message: result.error,
            details: { playerId, action, amount }
          }
        };
      }
    } catch (error) {
      // Handle custom poker engine errors
      if (error.name && error.name.endsWith('Error') && error.toResponse) {
        return error.toResponse();
      }
      
      return {
        success: false,
        error: {
          type: 'UnexpectedError',
          message: error.message,
          details: { actionConfig }
        }
      };
    }
  }

  /**
   * Gets available actions for a player
   * @param {string} playerId - Player ID
   * @returns {Object} Result object with available actions
   */
  getPlayerActions(playerId) {
    try {
      // Validate player ID using ValidationUtils
      ValidationUtils.validateString(playerId, 'Player ID');

      const player = this.gameManager.playerManager.getPlayer(playerId);
      if (!player) {
        return {
          success: false,
          error: {
            type: 'PlayerNotFoundError',
            message: 'Player not found',
            details: { playerId }
          }
        };
      }

      const callAmount = this.gameManager.bettingManager.getCallAmount(player.currentBet);
      const minRaise = this.gameManager.bettingManager.minRaise;
      const availableActions = player.getAvailableActions(callAmount, minRaise);

      return {
        success: true,
        playerId,
        availableActions,
        actionDetails: {
          callAmount,
          minRaise: minRaise,
          minRaiseTotal: callAmount + minRaise,
          playerChips: player.chips,
          canCheck: callAmount === 0,
          canCall: callAmount > 0 && player.chips >= callAmount,
          canRaise: player.chips >= (callAmount + minRaise)
        }
      };
    } catch (error) {
      // Handle custom poker engine errors
      if (error.name && error.name.endsWith('Error') && error.toResponse) {
        return error.toResponse();
      }
      
      return {
        success: false,
        error: {
          type: 'UnexpectedError',
          message: error.message,
          details: { playerId }
        }
      };
    }
  }

  /**
   * Game state query methods
   */

  /**
   * Gets comprehensive game state
   * @returns {Object} Complete game state information
   */
  getGameState() {
    const gameState = this.gameManager.getGameState();
    
    return {
      // Game information
      gameInfo: {
        isActive: gameState.isGameActive,
        phase: gameState.gamePhase,
        handNumber: gameState.handNumber,
        currentPlayer: gameState.currentPlayer
      },
      
      // Player information
      players: gameState.players.players.map(player => ({
        id: player.id,
        name: player.name,
        chips: player.chips,
        cards: player.cards,
        position: player.position,
        status: player.status,
        currentBet: player.currentBet,
        totalBet: player.totalBet,
        isDealer: gameState.players.dealerPosition === player.position,
        isCurrentPlayer: gameState.currentPlayer === player.id
      })),
      
      // Table information
      table: {
        communityCards: gameState.communityCards,
        dealerPosition: gameState.players.dealerPosition,
        activePlayerCount: gameState.players.activePlayerCount,
        playersInHand: gameState.players.playersInHand
      },
      
      // Betting information
      betting: {
        currentBet: gameState.betting.currentBet,
        minRaise: gameState.betting.minRaise,
        bettingRound: gameState.betting.bettingRound,
        bettingComplete: gameState.betting.bettingComplete,
        lastAggressor: gameState.betting.lastAggressorId
      },
      
      // Pot information
      pots: {
        total: gameState.pots.totalAmount,
        main: gameState.pots.mainPotAmount,
        sidePots: gameState.pots.pots.filter(pot => !pot.isMainPot),
        details: gameState.pots.pots
      },
      
      // Game configuration
      config: {
        smallBlind: gameState.blinds.small,
        bigBlind: gameState.blinds.big,
        maxPlayers: this.config.maxPlayers,
        minPlayers: this.config.minPlayers
      },
      
      // Hand results (if available)
      handResults: gameState.handResults,
      winners: gameState.winners
    };
  }

  /**
   * Gets state for a specific player
   * @param {string} playerId - Player ID
   * @returns {Object} Player-specific state information
   */
  getPlayerState(playerId) {
    try {
      // Validate player ID using ValidationUtils
      ValidationUtils.validateString(playerId, 'Player ID');

      const player = this.gameManager.playerManager.getPlayer(playerId);
      if (!player) {
        return {
          success: false,
          error: {
            type: 'PlayerNotFoundError',
            message: 'Player not found',
            details: { playerId }
          }
        };
      }

      const gameState = this.getGameState();
      const playerState = gameState.players.find(p => p.id === playerId);
      const actions = this.getPlayerActions(playerId);

      return {
        success: true,
        player: playerState,
        gamePhase: gameState.gameInfo.phase,
        isCurrentPlayer: gameState.gameInfo.currentPlayer === playerId,
        availableActions: actions.success ? actions.availableActions : [],
        actionDetails: actions.success ? actions.actionDetails : null,
        communityCards: gameState.table.communityCards,
        potTotal: gameState.pots.total
      };
    } catch (error) {
      // Handle custom poker engine errors
      if (error.name && error.name.endsWith('Error') && error.toResponse) {
        return error.toResponse();
      }
      
      return {
        success: false,
        error: {
          type: 'UnexpectedError',
          message: error.message,
          details: { playerId }
        }
      };
    }
  }

  /**
   * Checks if the game can start
   * @returns {Object} Result indicating if game can start
   */
  canStartGame() {
    const playerCount = this.gameManager.playerManager.getPlayerCount();
    const canStart = this.gameManager.canStartGame();

    return {
      canStart,
      playerCount,
      minPlayers: this.config.minPlayers,
      maxPlayers: this.config.maxPlayers,
      isGameActive: this.gameManager.isGameActive
    };
  }

  /**
   * Gets game statistics
   * @returns {Object} Game statistics and information
   */
  getGameStats() {
    const gameState = this.getGameState();
    
    return {
      handNumber: gameState.gameInfo.handNumber,
      totalPlayers: gameState.players.length,
      activePlayers: gameState.table.activePlayerCount,
      playersInHand: gameState.table.playersInHand,
      totalPot: gameState.pots.total,
      sidePotCount: gameState.pots.sidePots.length,
      currentPhase: gameState.gameInfo.phase,
      isGameActive: gameState.gameInfo.isActive,
      config: gameState.config
    };
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
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  /**
   * Removes an event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function to remove
   */
  off(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Sets up event forwarding from GameManager
   * @private
   */
  setupEventForwarding() {
    // Forward all GameManager events through the PokerEngine
    const eventsToForward = [
      'gameStarted',
      'handStarted',
      'playerAdded',
      'playerRemoved',
      'playerAction',
      'phaseChanged',
      'communityCardsDealt',
      'handComplete',
      'gameEnded',
      'blindsPosted',
      'dealerButtonRotated',
      'bettingRoundStarted'
    ];

    eventsToForward.forEach(eventName => {
      this.gameManager.on(eventName, (data) => {
        this.emit(eventName, {
          ...data,
          timestamp: Date.now(),
          gameState: this.getGameState()
        });
      });
    });
  }

  /**
   * Emits an event to all listeners
   * @param {string} event - Event name
   * @param {*} data - Event data
   * @private
   */
  emit(event, data) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Utility methods
   */

  /**
   * Determines error type based on error message
   * @param {string} errorMessage - Error message
   * @returns {string} Error type
   * @private
   */
  getErrorType(errorMessage) {
    if (errorMessage.includes('not found')) {
      return 'PlayerNotFoundError';
    }
    if (errorMessage.includes('turn') || errorMessage.includes('Not player\'s turn')) {
      return 'GameStateError';
    }
    if (errorMessage.includes('chips') || errorMessage.includes('insufficient')) {
      return 'InsufficientChipsError';
    }
    if (errorMessage.includes('game') || errorMessage.includes('phase') || errorMessage.includes('active')) {
      return 'GameStateError';
    }
    return 'InvalidActionError';
  }

  /**
   * Performance and cleanup methods
   */

  /**
   * Gets comprehensive performance statistics
   * @returns {Object} Performance statistics
   */
  getPerformanceStats() {
    const { HandEvaluator } = require('./utilities/HandEvaluator');
    
    return {
      handEvaluationCache: HandEvaluator.getCacheStats(),
      memoryManager: memoryManager.getMemoryStats(),
      gameStats: this.getGameStats(),
      eventListeners: {
        totalListeners: Array.from(this.eventListeners.values())
          .reduce((total, listeners) => total + listeners.length, 0),
        eventTypes: this.eventListeners.size
      }
    };
  }

  /**
   * Optimizes engine performance
   * @param {Object} options - Optimization options
   */
  optimize(options = {}) {
    const { HandEvaluator } = require('./utilities/HandEvaluator');
    
    // Optimize hand evaluation cache
    if (options.optimizeCache !== false) {
      HandEvaluator.optimizeCache(options.cacheTargetSize);
    }

    // Optimize memory manager
    if (options.optimizeMemory !== false) {
      memoryManager.optimize();
    }

    // Clean up event listeners if requested
    if (options.cleanupEvents) {
      this.cleanupEventListeners();
    }
  }

  /**
   * Performs cleanup operations
   * @private
   */
  performCleanup() {
    // Clear any temporary data structures
    if (this.gameManager) {
      // Let GameManager handle its own cleanup
      if (typeof this.gameManager.cleanup === 'function') {
        this.gameManager.cleanup();
      }
    }

    // Clean up event listeners that might have accumulated
    this.cleanupEventListeners();
  }

  /**
   * Cleans up unused event listeners
   * @private
   */
  cleanupEventListeners() {
    // Remove listeners that might be stale
    this.eventListeners.forEach((listeners, eventName) => {
      // Filter out any null or undefined listeners
      const validListeners = listeners.filter(listener => 
        typeof listener === 'function'
      );
      
      if (validListeners.length !== listeners.length) {
        this.eventListeners.set(eventName, validListeners);
      }
      
      // Remove empty event arrays
      if (validListeners.length === 0) {
        this.eventListeners.delete(eventName);
      }
    });
  }

  /**
   * Destroys the engine and cleans up all resources
   */
  destroy() {
    // Unregister from memory manager
    memoryManager.unregisterCleanupCallback(this.performCleanup);

    // Clear all event listeners
    this.eventListeners.clear();

    // Clean up game manager
    if (this.gameManager && typeof this.gameManager.destroy === 'function') {
      this.gameManager.destroy();
    }

    // Clear references
    this.gameManager = null;
    this.config = null;
  }

  /**
   * Validates configuration on creation
   * @param {Object} config - Configuration to validate
   * @returns {Object} Validation result
   * @private
   */
  static validateConfig(config) {
    const errors = [];

    if (config.smallBlind && (config.smallBlind <= 0 || !Number.isInteger(config.smallBlind))) {
      errors.push('Small blind must be a positive integer');
    }

    if (config.bigBlind && (config.bigBlind <= 0 || !Number.isInteger(config.bigBlind))) {
      errors.push('Big blind must be a positive integer');
    }

    if (config.smallBlind && config.bigBlind && config.smallBlind >= config.bigBlind) {
      errors.push('Small blind must be less than big blind');
    }

    if (config.maxPlayers && (config.maxPlayers < 2 || config.maxPlayers > 23)) {
      errors.push('Max players must be between 2 and 23');
    }

    if (config.minPlayers && (config.minPlayers < 2 || config.minPlayers > config.maxPlayers)) {
      errors.push('Min players must be at least 2 and not exceed max players');
    }

    if (config.startingChips && config.startingChips <= 0) {
      errors.push('Starting chips must be positive');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

module.exports = PokerEngine;