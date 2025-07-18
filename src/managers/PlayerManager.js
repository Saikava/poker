const Player = require('../models/Player');

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
    if (this.players.has(id)) {
      throw new Error(`Player with id ${id} already exists`);
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
    const player = this.getPlayer(playerId);
    if (!player) {
      throw new Error(`Player ${playerId} not found`);
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
    const player = this.getPlayer(playerId);
    if (!player) {
      throw new Error(`Player ${playerId} not found`);
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
        
        default:
          throw new Error(`Invalid action: ${action}`);
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
   * @returns {Player|null} Small blind player or null
   */
  getSmallBlindPlayer() {
    if (this.playerOrder.length < 2) {
      return null;
    }

    // In heads-up, dealer posts small blind
    if (this.playerOrder.length === 2) {
      return this.getDealerPlayer();
    }

    const sbPosition = (this.dealerPosition + 1) % this.playerOrder.length;
    const sbId = this.playerOrder[sbPosition];
    return this.getPlayer(sbId);
  }

  /**
   * Gets the big blind player
   * @returns {Player|null} Big blind player or null
   */
  getBigBlindPlayer() {
    if (this.playerOrder.length < 2) {
      return null;
    }

    // In heads-up, non-dealer posts big blind
    if (this.playerOrder.length === 2) {
      const bbPosition = (this.dealerPosition + 1) % this.playerOrder.length;
      const bbId = this.playerOrder[bbPosition];
      return this.getPlayer(bbId);
    }

    const bbPosition = (this.dealerPosition + 2) % this.playerOrder.length;
    const bbId = this.playerOrder[bbPosition];
    return this.getPlayer(bbId);
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