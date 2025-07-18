/**
 * Manages betting rounds and turn order in a poker game
 */
class BettingManager {
  constructor() {
    this.currentBet = 0;
    this.minRaise = 0;
    this.lastRaiseAmount = 0;
    this.bettingRound = 0; // 0=preflop, 1=flop, 2=turn, 3=river
    this.actionCount = 0;
    this.playersActed = new Set();
    this.lastAggressorId = null;
    this.bettingComplete = false;
  }

  /**
   * Starts a new betting round
   * @param {number} roundNumber - Betting round number (0-3)
   * @param {number} bigBlindAmount - Big blind amount for minimum bet
   */
  startBettingRound(roundNumber, bigBlindAmount = 0) {
    this.bettingRound = roundNumber;
    this.currentBet = 0;
    this.minRaise = bigBlindAmount || this.minRaise;
    this.lastRaiseAmount = this.minRaise;
    this.actionCount = 0;
    this.playersActed.clear();
    this.lastAggressorId = null;
    this.bettingComplete = false;
  }

  /**
   * Processes a player's betting action
   * @param {string} playerId - Player ID
   * @param {string} action - Action type ('fold', 'check', 'call', 'raise')
   * @param {number} amount - Bet amount (for raise actions)
   * @param {number} playerCurrentBet - Player's current bet in this round
   * @returns {Object} Action result with betting state
   */
  processAction(playerId, action, amount = 0, playerCurrentBet = 0) {
    if (this.bettingComplete) {
      throw new Error('Betting round is already complete');
    }

    const result = {
      success: true,
      playerId,
      action,
      amount: 0,
      newCurrentBet: this.currentBet,
      newMinRaise: this.minRaise,
      bettingComplete: false
    };

    switch (action) {
      case 'fold':
        // No betting changes for fold
        break;

      case 'check':
        if (this.currentBet > playerCurrentBet) {
          throw new Error('Cannot check when there is a bet to call');
        }
        break;

      case 'call':
        const callAmount = this.currentBet - playerCurrentBet;
        if (callAmount <= 0) {
          throw new Error('No amount to call');
        }
        result.amount = callAmount;
        break;

      case 'raise':
        const callAmount2 = this.currentBet - playerCurrentBet;
        const totalRaise = callAmount2 + amount;
        
        if (amount < this.minRaise) {
          throw new Error(`Raise amount must be at least ${this.minRaise}`);
        }

        this.currentBet = playerCurrentBet + totalRaise;
        this.lastRaiseAmount = amount;
        this.minRaise = amount; // Next raise must be at least this amount
        this.lastAggressorId = playerId;
        
        // Reset players acted since there's a new bet to respond to
        this.playersActed.clear();
        
        result.amount = totalRaise;
        result.newCurrentBet = this.currentBet;
        result.newMinRaise = this.minRaise;
        break;

      default:
        throw new Error(`Invalid action: ${action}`);
    }

    this.playersActed.add(playerId);
    this.actionCount++;

    return result;
  }

  /**
   * Checks if betting round is complete
   * @param {Player[]} activePlayers - Array of active players
   * @returns {boolean} True if betting is complete
   */
  isBettingComplete(activePlayers) {
    if (this.bettingComplete) {
      return true;
    }

    // If only one player remains in the hand, betting is complete
    const playersInHand = activePlayers.filter(player => 
      player.status !== 'folded' && player.status !== 'eliminated'
    );
    
    if (playersInHand.length <= 1) {
      this.bettingComplete = true;
      return true;
    }

    // Find players who can still act (active and either haven't acted or need to match bet)
    const playersWhoNeedToAct = activePlayers.filter(player => {
      if (player.status !== 'active') {
        return false; // Can't act if not active
      }
      
      // Player needs to act if they haven't acted yet OR their bet is less than current bet
      return !this.playersActed.has(player.id) || player.currentBet < this.currentBet;
    });

    // If no players need to act, betting is complete
    if (playersWhoNeedToAct.length === 0) {
      this.bettingComplete = true;
      return true;
    }

    return false;
  }

  /**
   * Gets the next player who needs to act
   * @param {Player[]} activePlayers - Array of active players in turn order
   * @param {string} currentPlayerId - Current player ID (optional)
   * @returns {Player|null} Next player to act or null
   */
  getNextPlayerToAct(activePlayers, currentPlayerId = null) {
    if (this.bettingComplete) {
      return null;
    }

    // Filter players who can still act
    const playersWhoCanAct = activePlayers.filter(player => 
      player.status === 'active' && 
      (player.currentBet < this.currentBet || !this.playersActed.has(player.id))
    );

    if (playersWhoCanAct.length === 0) {
      return null;
    }

    // If no current player specified, return first player who can act
    if (!currentPlayerId) {
      return playersWhoCanAct[0];
    }

    // Find current player index
    const currentIndex = activePlayers.findIndex(player => player.id === currentPlayerId);
    if (currentIndex === -1) {
      return playersWhoCanAct[0];
    }

    // Find next player in turn order who can act
    for (let i = 1; i < activePlayers.length; i++) {
      const nextIndex = (currentIndex + i) % activePlayers.length;
      const nextPlayer = activePlayers[nextIndex];
      
      if (playersWhoCanAct.includes(nextPlayer)) {
        return nextPlayer;
      }
    }

    return null;
  }

  /**
   * Gets the amount a player needs to call
   * @param {number} playerCurrentBet - Player's current bet
   * @returns {number} Amount to call
   */
  getCallAmount(playerCurrentBet) {
    return Math.max(0, this.currentBet - playerCurrentBet);
  }

  /**
   * Gets the minimum raise amount for a player
   * @param {number} playerCurrentBet - Player's current bet
   * @returns {number} Minimum raise amount
   */
  getMinRaiseAmount(playerCurrentBet) {
    const callAmount = this.getCallAmount(playerCurrentBet);
    return callAmount + this.minRaise;
  }

  /**
   * Validates if a player can perform a specific action
   * @param {Player} player - Player object
   * @param {string} action - Action to validate
   * @param {number} amount - Amount for raise actions
   * @returns {Object} Validation result
   */
  validateAction(player, action, amount = 0) {
    const result = { valid: true, error: null };

    if (player.status === 'folded' || player.status === 'eliminated') {
      result.valid = false;
      result.error = 'Player cannot act when folded or eliminated';
      return result;
    }

    const callAmount = this.getCallAmount(player.currentBet);

    switch (action) {
      case 'fold':
        // Can always fold
        break;

      case 'check':
        if (callAmount > 0) {
          result.valid = false;
          result.error = 'Cannot check when there is a bet to call';
        }
        break;

      case 'call':
        if (callAmount <= 0) {
          result.valid = false;
          result.error = 'No amount to call';
        } else if (player.chips < callAmount) {
          result.valid = false;
          result.error = 'Insufficient chips to call';
        }
        break;

      case 'raise':
        const minRaiseTotal = this.getMinRaiseAmount(player.currentBet);
        const totalRaiseAmount = callAmount + amount;
        
        if (amount < this.minRaise) {
          result.valid = false;
          result.error = `Raise amount must be at least ${this.minRaise}`;
        } else if (player.chips < totalRaiseAmount) {
          result.valid = false;
          result.error = 'Insufficient chips for raise';
        }
        break;

      default:
        result.valid = false;
        result.error = `Invalid action: ${action}`;
    }

    return result;
  }

  /**
   * Resets betting manager for new hand
   */
  reset() {
    this.currentBet = 0;
    this.minRaise = 0;
    this.lastRaiseAmount = 0;
    this.bettingRound = 0;
    this.actionCount = 0;
    this.playersActed.clear();
    this.lastAggressorId = null;
    this.bettingComplete = false;
  }

  /**
   * Gets current betting state
   * @returns {Object} Betting state
   */
  getState() {
    return {
      currentBet: this.currentBet,
      minRaise: this.minRaise,
      lastRaiseAmount: this.lastRaiseAmount,
      bettingRound: this.bettingRound,
      actionCount: this.actionCount,
      playersActed: Array.from(this.playersActed),
      lastAggressorId: this.lastAggressorId,
      bettingComplete: this.bettingComplete
    };
  }
}

module.exports = BettingManager;