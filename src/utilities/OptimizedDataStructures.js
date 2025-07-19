/**
 * Optimized data structures for poker engine performance
 * Designed to handle large player counts efficiently
 */

/**
 * Optimized player collection with fast lookups and iteration
 */
class OptimizedPlayerCollection {
  constructor() {
    this.players = new Map(); // Fast O(1) lookups by ID
    this.activePlayerIds = new Set(); // Fast O(1) active player checks
    this.playerOrder = []; // Maintains seating order
    this.positionMap = new Map(); // Position to player ID mapping
    this.dealerPosition = 0;
  }

  /**
   * Adds a player to the collection
   * @param {Player} player - Player object
   */
  addPlayer(player) {
    this.players.set(player.id, player);
    this.activePlayerIds.add(player.id);
    this.playerOrder.push(player.id);
    this.positionMap.set(player.position, player.id);
  }

  /**
   * Removes a player from the collection
   * @param {string} playerId - Player ID
   * @returns {boolean} True if player was removed
   */
  removePlayer(playerId) {
    const player = this.players.get(playerId);
    if (!player) return false;

    this.players.delete(playerId);
    this.activePlayerIds.delete(playerId);
    
    const orderIndex = this.playerOrder.indexOf(playerId);
    if (orderIndex > -1) {
      this.playerOrder.splice(orderIndex, 1);
    }
    
    this.positionMap.delete(player.position);
    this.rebuildPositionMap();
    
    return true;
  }

  /**
   * Gets a player by ID - O(1) lookup
   * @param {string} playerId - Player ID
   * @returns {Player|null} Player object or null
   */
  getPlayer(playerId) {
    return this.players.get(playerId) || null;
  }

  /**
   * Gets all active players - O(n) where n is active players
   * @returns {Player[]} Array of active players
   */
  getActivePlayers() {
    const activePlayers = [];
    for (const playerId of this.activePlayerIds) {
      const player = this.players.get(playerId);
      if (player && (player.status === 'active' || player.status === 'all-in')) {
        activePlayers.push(player);
      } else {
        // Remove from active set if status changed
        this.activePlayerIds.delete(playerId);
      }
    }
    return activePlayers;
  }

  /**
   * Gets all players in seating order
   * @returns {Player[]} Array of all players
   */
  getAllPlayers() {
    return this.playerOrder.map(id => this.players.get(id)).filter(Boolean);
  }

  /**
   * Updates player status efficiently
   * @param {string} playerId - Player ID
   * @param {string} status - New status
   */
  updatePlayerStatus(playerId, status) {
    const player = this.players.get(playerId);
    if (!player) return;

    const wasActive = this.activePlayerIds.has(playerId);
    const shouldBeActive = status === 'active' || status === 'all-in';

    player.status = status;

    if (wasActive && !shouldBeActive) {
      this.activePlayerIds.delete(playerId);
    } else if (!wasActive && shouldBeActive) {
      this.activePlayerIds.add(playerId);
    }
  }

  /**
   * Gets the next active player after given position
   * @param {number} position - Current position
   * @returns {Player|null} Next active player
   */
  getNextActivePlayer(position) {
    const playerCount = this.playerOrder.length;
    if (playerCount === 0) return null;

    for (let i = 1; i < playerCount; i++) {
      const nextPos = (position + i) % playerCount;
      const playerId = this.positionMap.get(nextPos);
      if (playerId && this.activePlayerIds.has(playerId)) {
        return this.players.get(playerId);
      }
    }
    return null;
  }

  /**
   * Rebuilds position mapping after player removal
   * @private
   */
  rebuildPositionMap() {
    this.positionMap.clear();
    this.playerOrder.forEach((playerId, index) => {
      const player = this.players.get(playerId);
      if (player) {
        player.position = index;
        this.positionMap.set(index, playerId);
      }
    });
  }

  /**
   * Gets collection size
   * @returns {number} Number of players
   */
  size() {
    return this.players.size;
  }

  /**
   * Gets active player count
   * @returns {number} Number of active players
   */
  activeCount() {
    return this.activePlayerIds.size;
  }

  /**
   * Clears the collection
   */
  clear() {
    this.players.clear();
    this.activePlayerIds.clear();
    this.playerOrder.length = 0;
    this.positionMap.clear();
    this.dealerPosition = 0;
  }
}

/**
 * Optimized betting round tracker
 */
class OptimizedBettingTracker {
  constructor() {
    this.playerBets = new Map(); // Player ID -> bet amount
    this.playerActions = new Map(); // Player ID -> last action
    this.actionOrder = []; // Order of actions taken
    this.currentBet = 0;
    this.totalPot = 0;
    this.lastAggressor = null;
  }

  /**
   * Records a player action
   * @param {string} playerId - Player ID
   * @param {string} action - Action taken
   * @param {number} amount - Bet amount
   */
  recordAction(playerId, action, amount = 0) {
    this.playerActions.set(playerId, action);
    this.actionOrder.push({ playerId, action, amount, timestamp: Date.now() });

    if (action === 'raise' || action === 'call') {
      const currentBet = this.playerBets.get(playerId) || 0;
      this.playerBets.set(playerId, currentBet + amount);
      this.totalPot += amount;

      if (action === 'raise') {
        this.currentBet = Math.max(this.currentBet, currentBet + amount);
        this.lastAggressor = playerId;
      }
    }
  }

  /**
   * Gets the call amount for a player
   * @param {string} playerId - Player ID
   * @returns {number} Amount needed to call
   */
  getCallAmount(playerId) {
    const playerBet = this.playerBets.get(playerId) || 0;
    return Math.max(0, this.currentBet - playerBet);
  }

  /**
   * Checks if betting is complete
   * @param {Player[]} activePlayers - Active players
   * @returns {boolean} True if betting is complete
   */
  isBettingComplete(activePlayers) {
    if (activePlayers.length <= 1) return true;

    let playersWhoCanAct = 0;
    let playersWhoHaveActed = 0;

    for (const player of activePlayers) {
      if (player.status === 'active') {
        playersWhoCanAct++;
        const action = this.playerActions.get(player.id);
        const playerBet = this.playerBets.get(player.id) || 0;
        
        if (action && (action === 'fold' || playerBet === this.currentBet || action === 'check')) {
          playersWhoHaveActed++;
        }
      }
    }

    return playersWhoHaveActed >= playersWhoCanAct;
  }

  /**
   * Resets for new betting round
   */
  reset() {
    this.playerBets.clear();
    this.playerActions.clear();
    this.actionOrder.length = 0;
    this.currentBet = 0;
    this.totalPot = 0;
    this.lastAggressor = null;
  }

  /**
   * Gets betting statistics
   * @returns {Object} Betting statistics
   */
  getStats() {
    return {
      totalActions: this.actionOrder.length,
      totalPot: this.totalPot,
      currentBet: this.currentBet,
      lastAggressor: this.lastAggressor,
      uniqueActors: this.playerActions.size
    };
  }
}

/**
 * Optimized pot manager for complex side pot calculations
 */
class OptimizedPotManager {
  constructor() {
    this.pots = [];
    this.playerContributions = new Map(); // Player ID -> total contributed
    this.eligibilityMatrix = new Map(); // Pot index -> Set of eligible player IDs
  }

  /**
   * Adds a bet to the pot system
   * @param {string} playerId - Player ID
   * @param {number} amount - Bet amount
   */
  addBet(playerId, amount) {
    const currentContribution = this.playerContributions.get(playerId) || 0;
    this.playerContributions.set(playerId, currentContribution + amount);
    
    // Add to main pot initially
    if (this.pots.length === 0) {
      this.pots.push({
        amount: 0,
        eligiblePlayers: new Set(),
        isMainPot: true
      });
    }
    
    this.pots[0].amount += amount;
    this.pots[0].eligiblePlayers.add(playerId);
  }

  /**
   * Creates side pots for all-in scenarios
   * @param {Player[]} players - All players in hand
   */
  createSidePots(players) {
    // Sort players by total contribution (all-in amounts)
    const sortedContributions = Array.from(this.playerContributions.entries())
      .sort((a, b) => a[1] - b[1]);

    this.pots = [];
    let previousLevel = 0;

    for (let i = 0; i < sortedContributions.length; i++) {
      const [playerId, contribution] = sortedContributions[i];
      const levelAmount = contribution - previousLevel;
      
      if (levelAmount > 0) {
        // Create pot for this level
        const eligiblePlayers = new Set();
        
        // All players who contributed at least this much are eligible
        for (let j = i; j < sortedContributions.length; j++) {
          eligiblePlayers.add(sortedContributions[j][0]);
        }
        
        this.pots.push({
          amount: levelAmount * eligiblePlayers.size,
          eligiblePlayers,
          isMainPot: i === 0,
          level: i
        });
      }
      
      previousLevel = contribution;
    }
  }

  /**
   * Distributes winnings efficiently
   * @param {Object[]} handResults - Hand evaluation results
   * @returns {Object[]} Distribution results
   */
  distributeWinnings(handResults) {
    const distributions = [];
    
    for (const pot of this.pots) {
      // Find eligible winners for this pot
      const eligibleResults = handResults.filter(result => 
        pot.eligiblePlayers.has(result.playerId)
      );
      
      if (eligibleResults.length === 0) continue;
      
      // Sort by hand strength
      eligibleResults.sort((a, b) => b.handStrength - a.handStrength);
      
      // Find all players with the best hand
      const bestStrength = eligibleResults[0].handStrength;
      const winners = eligibleResults.filter(result => result.handStrength === bestStrength);
      
      // Split pot among winners
      const winAmount = Math.floor(pot.amount / winners.length);
      const remainder = pot.amount % winners.length;
      
      winners.forEach((winner, index) => {
        const amount = winAmount + (index < remainder ? 1 : 0);
        distributions.push({
          playerId: winner.playerId,
          amount,
          potType: pot.isMainPot ? 'main' : 'side',
          potLevel: pot.level || 0
        });
      });
    }
    
    return distributions;
  }

  /**
   * Gets total pot amount
   * @returns {number} Total pot amount
   */
  getTotalAmount() {
    return this.pots.reduce((total, pot) => total + pot.amount, 0);
  }

  /**
   * Resets the pot manager
   */
  reset() {
    this.pots = [];
    this.playerContributions.clear();
    this.eligibilityMatrix.clear();
  }
}

module.exports = {
  OptimizedPlayerCollection,
  OptimizedBettingTracker,
  OptimizedPotManager
};