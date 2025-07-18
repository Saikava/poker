/**
 * Custom error classes for the Texas Hold'em Poker Engine
 * Provides specific error types for different validation and game state issues
 */

/**
 * Base class for all poker engine errors
 */
class PokerEngineError extends Error {
  constructor(message, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.details = details;
    this.timestamp = new Date().toISOString();
    
    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Returns a formatted error response object
   * @returns {Object} Formatted error response
   */
  toResponse() {
    return {
      success: false,
      error: {
        type: this.name,
        message: this.message,
        details: this.details,
        timestamp: this.timestamp
      }
    };
  }
}

/**
 * Error thrown when invalid input is provided to the system
 */
class InvalidInputError extends PokerEngineError {
  constructor(message, details = null) {
    super(message, details);
  }
}

/**
 * Error thrown when a player attempts an invalid action
 */
class InvalidActionError extends PokerEngineError {
  constructor(message, details = null) {
    super(message, details);
  }
}

/**
 * Error thrown when a player doesn't have sufficient chips
 */
class InsufficientChipsError extends PokerEngineError {
  constructor(message, details = null) {
    super(message, details);
  }
}

/**
 * Error thrown when an action is not valid in the current game state
 */
class GameStateError extends PokerEngineError {
  constructor(message, details = null) {
    super(message, details);
  }
}

/**
 * Error thrown when referencing a non-existent player
 */
class PlayerNotFoundError extends PokerEngineError {
  constructor(message, details = null) {
    super(message, details);
  }
}

/**
 * Error thrown when deck operations fail
 */
class DeckError extends PokerEngineError {
  constructor(message, details = null) {
    super(message, details);
  }
}

/**
 * Error thrown when hand evaluation fails
 */
class HandEvaluationError extends PokerEngineError {
  constructor(message, details = null) {
    super(message, details);
  }
}

/**
 * Error thrown when betting operations fail
 */
class BettingError extends PokerEngineError {
  constructor(message, details = null) {
    super(message, details);
  }
}

/**
 * Error thrown when pot management operations fail
 */
class PotManagementError extends PokerEngineError {
  constructor(message, details = null) {
    super(message, details);
  }
}

/**
 * Error thrown for configuration-related issues
 */
class ConfigurationError extends PokerEngineError {
  constructor(message, details = null) {
    super(message, details);
  }
}

module.exports = {
  PokerEngineError,
  InvalidInputError,
  InvalidActionError,
  InsufficientChipsError,
  GameStateError,
  PlayerNotFoundError,
  DeckError,
  HandEvaluationError,
  BettingError,
  PotManagementError,
  ConfigurationError
};