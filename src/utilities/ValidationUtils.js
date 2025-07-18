const {
  InvalidInputError,
  ConfigurationError,
  InvalidActionError
} = require('../errors/PokerErrors');

/**
 * Utility class for input validation throughout the poker engine
 */
class ValidationUtils {
  /**
   * Validates player configuration
   * @param {Object} playerConfig - Player configuration object
   * @throws {InvalidInputError} If validation fails
   */
  static validatePlayerConfig(playerConfig) {
    if (!playerConfig || typeof playerConfig !== 'object') {
      throw new InvalidInputError('Player configuration must be an object', {
        provided: playerConfig,
        type: typeof playerConfig
      });
    }

    if (!playerConfig.id || typeof playerConfig.id !== 'string') {
      throw new InvalidInputError('Player ID is required and must be a string', {
        provided: playerConfig.id,
        type: typeof playerConfig.id
      });
    }

    if (playerConfig.id.trim().length === 0) {
      throw new InvalidInputError('Player ID cannot be empty', {
        provided: playerConfig.id
      });
    }

    if (!playerConfig.name || typeof playerConfig.name !== 'string') {
      throw new InvalidInputError('Player name is required and must be a string', {
        provided: playerConfig.name,
        type: typeof playerConfig.name
      });
    }

    if (playerConfig.name.trim().length === 0) {
      throw new InvalidInputError('Player name cannot be empty', {
        provided: playerConfig.name
      });
    }

    if (playerConfig.chips !== undefined) {
      if (typeof playerConfig.chips !== 'number' || !Number.isInteger(playerConfig.chips)) {
        throw new InvalidInputError('Player chips must be an integer', {
          provided: playerConfig.chips,
          type: typeof playerConfig.chips
        });
      }

      if (playerConfig.chips < 0) {
        throw new InvalidInputError('Player chips cannot be negative', {
          provided: playerConfig.chips
        });
      }
    }
  }

  /**
   * Validates game configuration
   * @param {Object} config - Game configuration object
   * @throws {ConfigurationError} If validation fails
   */
  static validateGameConfig(config) {
    if (!config || typeof config !== 'object') {
      throw new ConfigurationError('Game configuration must be an object', {
        provided: config,
        type: typeof config
      });
    }

    // Validate small blind
    if (config.smallBlind !== undefined) {
      if (typeof config.smallBlind !== 'number' || !Number.isInteger(config.smallBlind)) {
        throw new ConfigurationError('Small blind must be an integer', {
          provided: config.smallBlind,
          type: typeof config.smallBlind
        });
      }

      if (config.smallBlind <= 0) {
        throw new ConfigurationError('Small blind must be positive', {
          provided: config.smallBlind
        });
      }
    }

    // Validate big blind
    if (config.bigBlind !== undefined) {
      if (typeof config.bigBlind !== 'number' || !Number.isInteger(config.bigBlind)) {
        throw new ConfigurationError('Big blind must be an integer', {
          provided: config.bigBlind,
          type: typeof config.bigBlind
        });
      }

      if (config.bigBlind <= 0) {
        throw new ConfigurationError('Big blind must be positive', {
          provided: config.bigBlind
        });
      }
    }

    // Validate blind relationship
    if (config.smallBlind !== undefined && config.bigBlind !== undefined) {
      if (config.smallBlind >= config.bigBlind) {
        throw new ConfigurationError('Small blind must be less than big blind', {
          smallBlind: config.smallBlind,
          bigBlind: config.bigBlind
        });
      }
    }

    // Validate max players
    if (config.maxPlayers !== undefined) {
      if (typeof config.maxPlayers !== 'number' || !Number.isInteger(config.maxPlayers)) {
        throw new ConfigurationError('Max players must be an integer', {
          provided: config.maxPlayers,
          type: typeof config.maxPlayers
        });
      }

      if (config.maxPlayers < 2 || config.maxPlayers > 23) {
        throw new ConfigurationError('Max players must be between 2 and 23', {
          provided: config.maxPlayers,
          validRange: { min: 2, max: 23 }
        });
      }
    }

    // Validate min players
    if (config.minPlayers !== undefined) {
      if (typeof config.minPlayers !== 'number' || !Number.isInteger(config.minPlayers)) {
        throw new ConfigurationError('Min players must be an integer', {
          provided: config.minPlayers,
          type: typeof config.minPlayers
        });
      }

      if (config.minPlayers < 2) {
        throw new ConfigurationError('Min players must be at least 2', {
          provided: config.minPlayers,
          minimum: 2
        });
      }
    }

    // Validate min/max player relationship
    if (config.minPlayers !== undefined && config.maxPlayers !== undefined) {
      if (config.minPlayers > config.maxPlayers) {
        throw new ConfigurationError('Min players cannot exceed max players', {
          minPlayers: config.minPlayers,
          maxPlayers: config.maxPlayers
        });
      }
    }

    // Validate starting chips
    if (config.startingChips !== undefined) {
      if (typeof config.startingChips !== 'number' || !Number.isInteger(config.startingChips)) {
        throw new ConfigurationError('Starting chips must be an integer', {
          provided: config.startingChips,
          type: typeof config.startingChips
        });
      }

      if (config.startingChips <= 0) {
        throw new ConfigurationError('Starting chips must be positive', {
          provided: config.startingChips
        });
      }
    }
  }

  /**
   * Validates player action configuration
   * @param {Object} actionConfig - Action configuration object
   * @throws {InvalidActionError} If validation fails
   */
  static validateActionConfig(actionConfig) {
    if (!actionConfig || typeof actionConfig !== 'object') {
      throw new InvalidActionError('Action configuration must be an object', {
        provided: actionConfig,
        type: typeof actionConfig
      });
    }

    if (!actionConfig.playerId || typeof actionConfig.playerId !== 'string') {
      throw new InvalidActionError('Player ID is required and must be a string', {
        provided: actionConfig.playerId,
        type: typeof actionConfig.playerId
      });
    }

    if (actionConfig.playerId.trim().length === 0) {
      throw new InvalidActionError('Player ID cannot be empty', {
        provided: actionConfig.playerId
      });
    }

    if (!actionConfig.action || typeof actionConfig.action !== 'string') {
      throw new InvalidActionError('Action is required and must be a string', {
        provided: actionConfig.action,
        type: typeof actionConfig.action
      });
    }

    const validActions = ['fold', 'check', 'call', 'raise'];
    if (!validActions.includes(actionConfig.action)) {
      throw new InvalidActionError('Invalid action type', {
        provided: actionConfig.action,
        validActions: validActions
      });
    }

    // Validate amount for raise actions
    if (actionConfig.action === 'raise') {
      if (actionConfig.amount === undefined || actionConfig.amount === null) {
        throw new InvalidActionError('Raise action requires an amount', {
          action: actionConfig.action,
          amount: actionConfig.amount
        });
      }

      if (typeof actionConfig.amount !== 'number' || !Number.isInteger(actionConfig.amount)) {
        throw new InvalidActionError('Raise amount must be an integer', {
          provided: actionConfig.amount,
          type: typeof actionConfig.amount
        });
      }

      if (actionConfig.amount <= 0) {
        throw new InvalidActionError('Raise amount must be positive', {
          provided: actionConfig.amount
        });
      }
    }
  }

  /**
   * Validates a string parameter
   * @param {*} value - Value to validate
   * @param {string} paramName - Parameter name for error messages
   * @param {boolean} allowEmpty - Whether empty strings are allowed
   * @throws {InvalidInputError} If validation fails
   */
  static validateString(value, paramName, allowEmpty = false) {
    if (value === undefined || value === null) {
      throw new InvalidInputError(`${paramName} is required`, {
        parameter: paramName,
        provided: value
      });
    }

    if (typeof value !== 'string') {
      throw new InvalidInputError(`${paramName} must be a string`, {
        parameter: paramName,
        provided: value,
        type: typeof value
      });
    }

    if (!allowEmpty && value.trim().length === 0) {
      throw new InvalidInputError(`${paramName} cannot be empty`, {
        parameter: paramName,
        provided: value
      });
    }
  }

  /**
   * Validates a positive integer parameter
   * @param {*} value - Value to validate
   * @param {string} paramName - Parameter name for error messages
   * @param {number} min - Minimum allowed value (default: 1)
   * @param {number} max - Maximum allowed value (optional)
   * @throws {InvalidInputError} If validation fails
   */
  static validatePositiveInteger(value, paramName, min = 1, max = null) {
    if (value === undefined || value === null) {
      throw new InvalidInputError(`${paramName} is required`, {
        parameter: paramName,
        provided: value
      });
    }

    if (typeof value !== 'number' || !Number.isInteger(value)) {
      throw new InvalidInputError(`${paramName} must be an integer`, {
        parameter: paramName,
        provided: value,
        type: typeof value
      });
    }

    if (value < min) {
      throw new InvalidInputError(`${paramName} must be at least ${min}`, {
        parameter: paramName,
        provided: value,
        minimum: min
      });
    }

    if (max !== null && value > max) {
      throw new InvalidInputError(`${paramName} cannot exceed ${max}`, {
        parameter: paramName,
        provided: value,
        maximum: max
      });
    }
  }

  /**
   * Validates a non-negative integer parameter
   * @param {*} value - Value to validate
   * @param {string} paramName - Parameter name for error messages
   * @param {number} max - Maximum allowed value (optional)
   * @throws {InvalidInputError} If validation fails
   */
  static validateNonNegativeInteger(value, paramName, max = null) {
    if (value === undefined || value === null) {
      throw new InvalidInputError(`${paramName} is required`, {
        parameter: paramName,
        provided: value
      });
    }

    if (typeof value !== 'number' || !Number.isInteger(value)) {
      throw new InvalidInputError(`${paramName} must be an integer`, {
        parameter: paramName,
        provided: value,
        type: typeof value
      });
    }

    if (value < 0) {
      throw new InvalidInputError(`${paramName} cannot be negative`, {
        parameter: paramName,
        provided: value
      });
    }

    if (max !== null && value > max) {
      throw new InvalidInputError(`${paramName} cannot exceed ${max}`, {
        parameter: paramName,
        provided: value,
        maximum: max
      });
    }
  }

  /**
   * Validates an array parameter
   * @param {*} value - Value to validate
   * @param {string} paramName - Parameter name for error messages
   * @param {number} minLength - Minimum array length (default: 0)
   * @param {number} maxLength - Maximum array length (optional)
   * @throws {InvalidInputError} If validation fails
   */
  static validateArray(value, paramName, minLength = 0, maxLength = null) {
    if (value === undefined || value === null) {
      throw new InvalidInputError(`${paramName} is required`, {
        parameter: paramName,
        provided: value
      });
    }

    if (!Array.isArray(value)) {
      throw new InvalidInputError(`${paramName} must be an array`, {
        parameter: paramName,
        provided: value,
        type: typeof value
      });
    }

    if (value.length < minLength) {
      throw new InvalidInputError(`${paramName} must have at least ${minLength} items`, {
        parameter: paramName,
        provided: value.length,
        minimum: minLength
      });
    }

    if (maxLength !== null && value.length > maxLength) {
      throw new InvalidInputError(`${paramName} cannot have more than ${maxLength} items`, {
        parameter: paramName,
        provided: value.length,
        maximum: maxLength
      });
    }
  }
}

module.exports = ValidationUtils;