const Player = require('../models/Player');
const { 
  PlayerNotFoundError, 
  InvalidInputError, 
  InvalidActionError 
} = require('../errors/PokerErrors');

/**
 * Manages multiple players in a poker game
 */
class PlayerManager {
  constructor() {
    this.players = new Map();
    this.playerOrder = [];
    this.dealerPosition = 0;
    this.currentPlayerIndex = 0;
  }

  /**
   * Adds a new player to the game
   * @param {string} id - Unique player identifier
   * @param {string} name - Player name
   * @param {number} chips - Starting chip count
   * @returns {Player} The created player
   */
  addPlayer(id, name, chips) {
    // Validate inputs
    if (!id || typeof id !== 'string') {
      throw new InvalidInputError('Player ID is required and must be a string', {
        provided: id,
        type: typeof id
      });
    }

    if (id.trim().length === 0) {
      throw new InvalidInputError('Player ID cannot be empty', {
        provided: id
      });
    }

    if (!name || typeof name !== 'string') {
      throw new InvalidInputError('Player name is required and must be a string', {
        provided: name,
        type: typeof name
      });
    }

    if (name.trim().length === 0) {
      throw new InvalidInputError('Player name cannot be empty', {
        provided: name
      });
    }

    if (typeof chips !== 'number' || !Number.isInteger(chips)) {
      throw new InvalidInputError('Player chips must be an integer', {
        provided: chips,
        type: typeof chips
      });
    }

    if (chips < 0) {
      throw new InvalidInputError('Player chips cannot be negative', {
        provided: chips
      });
    }

    if (this.players.has(id)) {
      throw new InvalidInputError(`Player with id ${id} already exists`, {
        playerId: id,
        existingPlayerCount: this.players.size
      });
    }

    const position = this.playerOrder.length;
    const player = new Player(id, name, chips, position);
    
    this.players.set(id, player);
    this.playerOrder.push(id);

    return player;
  }

  /**
   * Removes a player from the game
   * @param {string} playerId - Player ID to remove
   * @returns {boolean} True if player was removed
   */
  removePlayer(playerId) {
    if (!this.players.has(playerId)) {
      return false;
    }

    // Remember who the dealer was before removal
    const dealerPlayerId = this.playerOrder[this.dealerPosition];

    this.players.delete(playerId);
    const index = this.playerOrder.indexOf(playerId);
    if (index > -1) {
      this.playerOrder.splice(index, 1);
      
      // Adjust positions for remaining players
      this.updatePlayerPositions();
      
      // Find the new position of the dealer player
      if (dealerPlayerId === playerId) {
        // If we removed the dealer, move to next player
        this.dealerPosition = this.dealerPosition >= this.playerOrder.length ? 0 : this.dealerPosition;
      } else {
        // Find where the dealer player is now
        const newDealerIndex = this.playerOrder.indexOf(dealerPlayerId);
        this.dealerPosition = newDealerIndex >= 0 ? newDealerIndex : 0;
      }
    }

    return true;
  }

  /**
   * Gets a player by ID
   * @param {string} playerId - Player ID
   * @returns {Player|null} Player instance or null if not found
   */
  getPlayer(playerId) {
    return this.players.get(playerId) || null;
  }

  /**
   * Gets all active players (not folded or eliminated)
   * @returns {Player[]} Array of active players
   */
  getActivePlayers() {
    return this.playerOrder
      .map(id => this.players.get(id))
      .filter(player => player.status === 'active' || player.status === 'all-in');
  }

  /**
   * Gets all players in the game
   * @returns {Player[]} Array of all players
   */
  getAllPlayers() {
    return this.playerOrder.map(id => this.players.get(id));
  }

  /**
   * Gets players who haven't folded (active or all-in)
   * @returns {Player[]} Array of players still in hand
   */
  getPlayersInHand() {
    return this.playerOrder
      .map(id => this.players.get(id))
      .filter(player => player.status !== 'folded' && player.status !== 'eliminated');
  }

  /**
   * Gets the number of players
   * @returns {number} Total number of players
   */
  getPlayerCount() {
    return this.playerOrder.length;
  }

  /**
   * Gets the number of active players
   * @returns {number} Number of active players
   */
  getActivePlayerCount() {
    return this.getActivePlayers().length;
  }

  /**
   * Validates if a player can perform a specific action
   * @param {string} playerId - Player ID
   * @param {string} action - Action to validate
   * @param {number} callAmount - Amount needed to call
   * @param {number} minRaise - Minimum raise amount
   * @returns {boolean} True if action is valid
   */
  validatePlayerAction(playerId, action, callAmount = 0, minRaise = 0) {
    if (!playerId || typeof playerId !== 'string') {
      throw new InvalidInputError('Player ID is required and must be a string', {
        provided: playerId,
        type: typeof playerId
      });
    }

    const player = this.getPlayer(playerId);
    if (!player) {
      throw new PlayerNotFoundError(`Player ${playerId} not found`, {
        playerId: playerId,
        availablePlayers: this.playerOrder
      });
    }

    return player.canPerformAction(action, callAmount, minRaise);
  }

  /**
   * Executes a player action
   * @param {string} playerId - Player ID
   * @param {string} action - Action to perform
   * @param {number} amount - Amount for bet/raise actions
   * @param {number} callAmount - Amount needed to call (for raise)
   * @returns {Object} Action result
   */
  executePlayerAction(playerId, action, amount = 0, callAmount = 0) {
    if (!playerId || typeof playerId !== 'string') {
      throw new InvalidInputError('Player ID is required and must be a string', {
        provided: playerId,
        type: typeof playerId
      });
    }

    if (!action || typeof action !== 'string') {
      throw new InvalidInputError('Action is required and must be a string', {
        provided: action,
        type: typeof action
      });
    }

    const validActions = ['fold', 'check', 'call', 'raise'];
    if (!validActions.includes(action)) {
      throw new InvalidActionError(`Invalid action: ${action}`, {
        provided: action,
        validActions: validActions,
        playerId: playerId
      });
    }

    const player = this.getPlayer(playerId);
    if (!player) {
      throw new PlayerNotFoundError(`Player ${playerId} not found`, {
        playerId: playerId,
        availablePlayers: this.playerOrder
      });
    }

    try {
      switch (action) {
        case 'fold':
          player.fold();
          break;
        
        case 'check':
          player.check();
          break;
        
        case 'call':
          player.call(callAmount);
          break;
        
        case 'raise':
          player.raise(amount, callAmount);
          break;
      }

      return {
        success: true,
        playerId: playerId,
        action: action,
        amount: action === 'call' ? callAmount : amount,
        playerState: player.getState()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        playerId: playerId,
        action: action
      };
    }
  }

  /**
   * Rotates the dealer position
   */
  rotateDealerPosition() {
    if (this.playerOrder.length === 0) {
      return;
    }

    this.dealerPosition = (this.dealerPosition + 1) % this.playerOrder.length;
  }

  /**
   * Rotates the dealer button to the next active player
   * Handles position adjustments for eliminated players
   */
  rotateDealerButton() {
    if (this.playerOrder.length === 0) {
      return;
    }

    const activePlayers = this.getActivePlayers();
    if (activePlayers.length === 0) {
      return;
    }

    // Find the next active player after current dealer
    let nextDealerFound = false;
    let attempts = 0;
    const maxAttempts = this.playerOrder.length;

    while (!nextDealerFound && attempts < maxAttempts) {
      this.dealerPosition = (this.dealerPosition + 1) % this.playerOrder.length;
      const potentialDealerId = this.playerOrder[this.dealerPosition];
      const potentialDealer = this.getPlayer(potentialDealerId);
      
      if (potentialDealer && (potentialDealer.status === 'active' || potentialDealer.status === 'all-in')) {
        nextDealerFound = true;
      }
      
      attempts++;
    }

    // If no active player found, adjust to first active player
    if (!nextDealerFound && activePlayers.length > 0) {
      const firstActivePlayer = activePlayers[0];
      this.dealerPosition = this.playerOrder.indexOf(firstActivePlayer.id);
    }
  }

  /**
   * Adjusts dealer position when players are eliminated
   * Ensures dealer position points to an active player
   */
  adjustDealerPositionForEliminatedPlayers() {
    if (this.playerOrder.length === 0) {
      this.dealerPosition = 0;
      return;
    }

    const activePlayers = this.getActivePlayers();
    if (activePlayers.length === 0) {
      this.dealerPosition = 0;
      return;
    }

    // Check if current dealer position is valid
    const currentDealerId = this.playerOrder[this.dealerPosition];
    const currentDealer = this.getPlayer(currentDealerId);
    
    if (!currentDealer || (currentDealer.status !== 'active' && currentDealer.status !== 'all-in')) {
      // Find the next active player from current position
      let foundActiveDealer = false;
      let attempts = 0;
      const maxAttempts = this.playerOrder.length;

      while (!foundActiveDealer && attempts < maxAttempts) {
        const potentialDealerId = this.playerOrder[this.dealerPosition];
        const potentialDealer = this.getPlayer(potentialDealerId);
        
        if (potentialDealer && (potentialDealer.status === 'active' || potentialDealer.status === 'all-in')) {
          foundActiveDealer = true;
        } else {
          this.dealerPosition = (this.dealerPosition + 1) % this.playerOrder.length;
        }
        
        attempts++;
      }

      // Fallback to first active player if no valid position found
      if (!foundActiveDealer) {
        const firstActivePlayer = activePlayers[0];
        this.dealerPosition = this.playerOrder.indexOf(firstActivePlayer.id);
      }
    }
  }

  /**
   * Gets the dealer player
   * @returns {Player|null} Dealer player or null
   */
  getDealerPlayer() {
    if (this.playerOrder.length === 0) {
      return null;
    }

    const dealerId = this.playerOrder[this.dealerPosition];
    return this.getPlayer(dealerId);
  }

  /**
   * Gets the small blind player
   * Handles heads-up play and position adjustments for eliminated players
   * @returns {Player|null} Small blind player or null
   */
  getSmallBlindPlayer() {
    const activePlayers = this.getActivePlayers();
    
    if (activePlayers.length < 2) {
      return null;
    }

    // In heads-up, dealer posts small blind
    if (activePlayers.length === 2) {
      return this.getDealerPlayer();
    }

    // Multi-way: small blind is left of dealer
    const dealerPlayer = this.getDealerPlayer();
    if (!dealerPlayer) {
      return null;
    }

    return this.getNextActivePlayer(dealerPlayer.id);
  }

  /**
   * Gets the big blind player
   * Handles heads-up play and position adjustments for eliminated players
   * @returns {Player|null} Big blind player or null
   */
  getBigBlindPlayer() {
    const activePlayers = this.getActivePlayers();
    
    if (activePlayers.length < 2) {
      return null;
    }

    // In heads-up, non-dealer posts big blind
    if (activePlayers.length === 2) {
      const dealerPlayer = this.getDealerPlayer();
      if (!dealerPlayer) {
        return null;
      }
      return this.getNextActivePlayer(dealerPlayer.id);
    }

    // Multi-way: big blind is two positions left of dealer
    const sbPlayer = this.getSmallBlindPlayer();
    if (!sbPlayer) {
      return null;
    }

    return this.getNextActivePlayer(sbPlayer.id);
  }

  /**
   * Gets the next active player after the specified player
   * Skips eliminated and folded players
   * @param {string} playerId - Current player ID
   * @returns {Player|null} Next active player or null
   */
  getNextActivePlayer(playerId) {
    const currentIndex = this.playerOrder.indexOf(playerId);
    if (currentIndex === -1) {
      return null;
    }

    const activePlayers = this.getActivePlayers();
    if (activePlayers.length <= 1) {
      return null;
    }

    // Find next active player
    for (let i = 1; i < this.playerOrder.length; i++) {
      const nextIndex = (currentIndex + i) % this.playerOrder.length;
      const nextPlayerId = this.playerOrder[nextIndex];
      const nextPlayer = this.getPlayer(nextPlayerId);
      
      if (nextPlayer && (nextPlayer.status === 'active' || nextPlayer.status === 'all-in')) {
        return nextPlayer;
      }
    }

    return null;
  }

  /**
   * Resets all players for a new hand
   */
  resetPlayersForNewHand() {
    this.players.forEach(player => {
      player.resetForNewHand();
    });

    // Remove eliminated players
    const eliminatedPlayers = [];
    this.players.forEach((player, id) => {
      if (player.chips === 0 && player.status !== 'all-in') {
        player.eliminate();
        eliminatedPlayers.push(id);
      }
    });

    // Clean up eliminated players
    eliminatedPlayers.forEach(id => {
      this.removePlayer(id);
    });
  }

  /**
   * Updates player positions after player removal
   * @private
   */
  updatePlayerPositions() {
    this.playerOrder.forEach((playerId, index) => {
      const player = this.players.get(playerId);
      if (player) {
        player.position = index;
      }
    });
  }

  /**
   * Gets the next player in turn order
   * @param {string} currentPlayerId - Current player ID
   * @returns {Player|null} Next player or null
   */
  getNextPlayer(currentPlayerId) {
    const currentIndex = this.playerOrder.indexOf(currentPlayerId);
    if (currentIndex === -1) {
      return null;
    }

    const activePlayers = this.getActivePlayers();
    if (activePlayers.length <= 1) {
      return null;
    }

    // Find next active player
    for (let i = 1; i < this.playerOrder.length; i++) {
      const nextIndex = (currentIndex + i) % this.playerOrder.length;
      const nextPlayerId = this.playerOrder[nextIndex];
      const nextPlayer = this.getPlayer(nextPlayerId);
      
      if (nextPlayer && (nextPlayer.status === 'active' || nextPlayer.status === 'all-in')) {
        return nextPlayer;
      }
    }

    return null;
  }

  /**
   * Gets current game state for all players
   * @returns {Object} Player manager state
   */
  getState() {
    return {
      players: this.getAllPlayers().map(player => player.getState()),
      playerOrder: [...this.playerOrder],
      dealerPosition: this.dealerPosition,
      activePlayerCount: this.getActivePlayerCount(),
      playersInHand: this.getPlayersInHand().length
    };
  }
}

module.exports = PlayerManager;