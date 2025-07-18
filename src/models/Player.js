/**
 * Represents a poker player with chip tracking and action methods
 */
class Player {
  /**
   * Creates a new Player instance
   * @param {string} id - Unique player identifier
   * @param {string} name - Player name
   * @param {number} chips - Starting chip count
   * @param {number} position - Player position at table
   */
  constructor(id, name, chips, position = 0) {
    this.id = id;
    this.name = name;
    this.chips = chips;
    this.cards = [];
    this.position = position;
    this.status = 'active';
    this.currentBet = 0;
    this.totalBet = 0;
  }

  /**
   * Places a bet of the specified amount
   * @param {number} amount - Amount to bet
   * @returns {boolean} True if bet was successful
   */
  bet(amount) {
    if (amount <= 0) {
      throw new Error('Bet amount must be positive');
    }
    
    if (amount > this.chips) {
      throw new Error('Insufficient chips for bet');
    }

    this.chips -= amount;
    this.currentBet += amount;
    this.totalBet += amount;

    // Check if player is all-in
    if (this.chips === 0) {
      this.status = 'all-in';
    }

    return true;
  }

  /**
   * Folds the player's hand
   */
  fold() {
    if (this.status === 'folded' || this.status === 'eliminated') {
      throw new Error('Player cannot fold in current status');
    }
    
    this.status = 'folded';
    this.cards = [];
  }

  /**
   * Checks (passes action without betting)
   * @returns {boolean} True if check was successful
   */
  check() {
    if (this.status !== 'active') {
      throw new Error('Player cannot check in current status');
    }
    
    return true;
  }

  /**
   * Calls the current bet amount
   * @param {number} callAmount - Amount needed to call
   * @returns {boolean} True if call was successful
   */
  call(callAmount) {
    if (callAmount <= 0) {
      return this.check();
    }

    const amountToCall = Math.min(callAmount, this.chips);
    return this.bet(amountToCall);
  }

  /**
   * Raises the bet by the specified amount
   * @param {number} raiseAmount - Amount to raise by
   * @param {number} callAmount - Amount needed to call first
   * @returns {boolean} True if raise was successful
   */
  raise(raiseAmount, callAmount = 0) {
    if (raiseAmount <= 0) {
      throw new Error('Raise amount must be positive');
    }

    const totalAmount = callAmount + raiseAmount;
    return this.bet(totalAmount);
  }

  /**
   * Resets player for new hand
   */
  resetForNewHand() {
    this.cards = [];
    this.currentBet = 0;
    this.totalBet = 0;
    
    if (this.status === 'folded') {
      this.status = 'active';
    }
    
    // Don't reset eliminated or all-in status
  }

  /**
   * Adds cards to player's hand
   * @param {Card[]} cards - Cards to add
   */
  addCards(cards) {
    this.cards.push(...cards);
  }

  /**
   * Checks if player can perform a specific action
   * @param {string} action - Action to validate ('fold', 'check', 'call', 'raise')
   * @param {number} callAmount - Amount needed to call (for call/raise actions)
   * @param {number} minRaise - Minimum raise amount (for raise action)
   * @returns {boolean} True if action is valid
   */
  canPerformAction(action, callAmount = 0, minRaise = 0) {
    if (this.status === 'folded' || this.status === 'eliminated') {
      return false;
    }

    switch (action) {
      case 'fold':
        return this.status === 'active' || this.status === 'all-in';
      
      case 'check':
        return this.status === 'active' && callAmount === 0;
      
      case 'call':
        return this.status === 'active' && callAmount > 0 && this.chips > 0;
      
      case 'raise':
        const totalRaiseAmount = callAmount + minRaise;
        return this.status === 'active' && this.chips >= totalRaiseAmount;
      
      default:
        return false;
    }
  }

  /**
   * Gets available actions for this player
   * @param {number} callAmount - Amount needed to call
   * @param {number} minRaise - Minimum raise amount
   * @returns {string[]} Array of available actions
   */
  getAvailableActions(callAmount = 0, minRaise = 0) {
    const actions = [];

    if (this.canPerformAction('fold', callAmount, minRaise)) {
      actions.push('fold');
    }
    
    if (this.canPerformAction('check', callAmount, minRaise)) {
      actions.push('check');
    }
    
    if (this.canPerformAction('call', callAmount, minRaise)) {
      actions.push('call');
    }
    
    if (this.canPerformAction('raise', callAmount, minRaise)) {
      actions.push('raise');
    }

    return actions;
  }

  /**
   * Marks player as eliminated
   */
  eliminate() {
    this.status = 'eliminated';
    this.chips = 0;
    this.cards = [];
  }

  /**
   * Gets player's current state
   * @returns {Object} Player state object
   */
  getState() {
    return {
      id: this.id,
      name: this.name,
      chips: this.chips,
      cards: [...this.cards],
      position: this.position,
      status: this.status,
      currentBet: this.currentBet,
      totalBet: this.totalBet
    };
  }
}

module.exports = Player;