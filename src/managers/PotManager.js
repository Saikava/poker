/**
 * Manages main pot and side pot calculations in a poker game
 */
class PotManager {
  constructor() {
    this.pots = [];
    this.playerContributions = new Map(); // playerId -> total contributed
  }

  /**
   * Represents a single pot
   */
  static createPot(amount = 0, eligiblePlayers = [], isMainPot = true) {
    return {
      amount,
      eligiblePlayers: [...eligiblePlayers],
      isMainPot
    };
  }

  /**
   * Adds a bet to the pot system
   * @param {string} playerId - Player ID
   * @param {number} amount - Bet amount
   */
  addBet(playerId, amount) {
    if (amount <= 0) {
      return;
    }

    // Track total contribution from this player
    const currentContribution = this.playerContributions.get(playerId) || 0;
    this.playerContributions.set(playerId, currentContribution + amount);

    // Add to main pot if it exists, otherwise create it
    if (this.pots.length === 0) {
      this.pots.push(PotManager.createPot(amount, [playerId], true));
    } else {
      this.pots[0].amount += amount;
      if (!this.pots[0].eligiblePlayers.includes(playerId)) {
        this.pots[0].eligiblePlayers.push(playerId);
      }
    }
  }

  /**
   * Creates side pots when players go all-in with different amounts
   * @param {Player[]} players - Array of all players
   */
  createSidePots(players) {
    // Get all players who have contributed to the pot
    const contributingPlayers = players.filter(player => 
      this.playerContributions.has(player.id) && 
      this.playerContributions.get(player.id) > 0
    );

    if (contributingPlayers.length === 0) {
      return;
    }

    // Check if any players are all-in - if not, create single main pot
    const allInPlayers = contributingPlayers.filter(player => 
      player.status === 'all-in' || player.chips === 0
    );

    // Clear existing pots
    this.pots = [];

    if (allInPlayers.length === 0) {
      // No all-ins, create single main pot
      const totalAmount = Array.from(this.playerContributions.values())
        .reduce((sum, amount) => sum + amount, 0);
      const eligiblePlayers = contributingPlayers
        .filter(p => p.status !== 'folded' && p.status !== 'eliminated')
        .map(p => p.id);
      
      if (totalAmount > 0) {
        this.pots.push(PotManager.createPot(totalAmount, eligiblePlayers, true));
      }
      return;
    }

    // Sort players by their total contribution (ascending)
    contributingPlayers.sort((a, b) => {
      const aContrib = this.playerContributions.get(a.id) || 0;
      const bContrib = this.playerContributions.get(b.id) || 0;
      return aContrib - bContrib;
    });

    let previousContribution = 0;
    let remainingPlayers = [...contributingPlayers];

    // Create pots for each contribution level
    for (let i = 0; i < contributingPlayers.length; i++) {
      const player = contributingPlayers[i];
      const playerContribution = this.playerContributions.get(player.id) || 0;

      if (playerContribution > previousContribution) {
        const potAmount = (playerContribution - previousContribution) * remainingPlayers.length;
        const eligiblePlayers = remainingPlayers
          .filter(p => p.status !== 'folded' && p.status !== 'eliminated')
          .map(p => p.id);

        if (potAmount > 0 && eligiblePlayers.length > 0) {
          const isMainPot = this.pots.length === 0;
          this.pots.push(PotManager.createPot(potAmount, eligiblePlayers, isMainPot));
        }

        previousContribution = playerContribution;
      }

      // Remove players who are all-in at this level
      if (player.status === 'all-in' || player.chips === 0) {
        remainingPlayers = remainingPlayers.filter(p => p.id !== player.id);
      }
    }

    // Ensure we have at least one pot
    if (this.pots.length === 0) {
      const totalAmount = Array.from(this.playerContributions.values())
        .reduce((sum, amount) => sum + amount, 0);
      const eligiblePlayers = contributingPlayers
        .filter(p => p.status !== 'folded' && p.status !== 'eliminated')
        .map(p => p.id);
      
      if (totalAmount > 0) {
        this.pots.push(PotManager.createPot(totalAmount, eligiblePlayers, true));
      }
    }
  }

  /**
   * Distributes winnings from all pots
   * @param {Object[]} handResults - Array of hand evaluation results
   * @returns {Object[]} Array of winner objects with pot distributions
   */
  distributeWinnings(handResults) {
    const distributions = [];

    for (let potIndex = 0; potIndex < this.pots.length; potIndex++) {
      const pot = this.pots[potIndex];
      
      if (pot.amount === 0) {
        continue;
      }

      // Filter hand results to only eligible players for this pot
      const eligibleResults = handResults.filter(result => 
        pot.eligiblePlayers.includes(result.playerId)
      );

      if (eligibleResults.length === 0) {
        continue;
      }

      // Sort by hand strength (highest first)
      eligibleResults.sort((a, b) => b.handStrength - a.handStrength);

      // Find all players with the winning hand strength
      const winningStrength = eligibleResults[0].handStrength;
      const winners = eligibleResults.filter(result => 
        result.handStrength === winningStrength
      );

      // Distribute pot among winners
      const winningsPerPlayer = Math.floor(pot.amount / winners.length);
      const remainder = pot.amount % winners.length;

      winners.forEach((winner, index) => {
        const winAmount = winningsPerPlayer + (index < remainder ? 1 : 0);
        
        distributions.push({
          playerId: winner.playerId,
          amount: winAmount,
          potIndex: potIndex,
          isMainPot: pot.isMainPot,
          handType: winner.handType,
          sharedWith: winners.length > 1 ? winners.map(w => w.playerId) : null
        });
      });
    }

    return distributions;
  }

  /**
   * Gets the total amount in all pots
   * @returns {number} Total pot amount
   */
  getTotalPotAmount() {
    return this.pots.reduce((total, pot) => total + pot.amount, 0);
  }

  /**
   * Gets the main pot amount
   * @returns {number} Main pot amount
   */
  getMainPotAmount() {
    const mainPot = this.pots.find(pot => pot.isMainPot);
    return mainPot ? mainPot.amount : 0;
  }

  /**
   * Gets all side pots
   * @returns {Object[]} Array of side pots
   */
  getSidePots() {
    return this.pots.filter(pot => !pot.isMainPot);
  }

  /**
   * Gets the number of side pots
   * @returns {number} Number of side pots
   */
  getSidePotCount() {
    return this.getSidePots().length;
  }

  /**
   * Checks if a player is eligible for a specific pot
   * @param {string} playerId - Player ID
   * @param {number} potIndex - Pot index (0 = main pot)
   * @returns {boolean} True if player is eligible
   */
  isPlayerEligibleForPot(playerId, potIndex) {
    if (potIndex < 0 || potIndex >= this.pots.length) {
      return false;
    }

    return this.pots[potIndex].eligiblePlayers.includes(playerId);
  }

  /**
   * Gets player's total contribution to all pots
   * @param {string} playerId - Player ID
   * @returns {number} Total contribution amount
   */
  getPlayerContribution(playerId) {
    return this.playerContributions.get(playerId) || 0;
  }

  /**
   * Resets all pots for a new hand
   */
  reset() {
    this.pots = [];
    this.playerContributions.clear();
  }

  /**
   * Collects bets from all players and creates appropriate pots
   * @param {Player[]} players - Array of all players
   */
  collectBets(players) {
    // Reset pots and contributions for this collection
    this.pots = [];
    this.playerContributions.clear();

    // Collect all current bets
    players.forEach(player => {
      if (player.currentBet > 0) {
        this.addBet(player.id, player.currentBet);
      }
    });

    // Create side pots if needed
    this.createSidePots(players);
  }

  /**
   * Gets detailed pot information
   * @returns {Object} Pot state information
   */
  getState() {
    return {
      pots: this.pots.map((pot, index) => ({
        index,
        amount: pot.amount,
        eligiblePlayers: [...pot.eligiblePlayers],
        isMainPot: pot.isMainPot
      })),
      totalAmount: this.getTotalPotAmount(),
      mainPotAmount: this.getMainPotAmount(),
      sidePotCount: this.getSidePotCount(),
      playerContributions: Object.fromEntries(this.playerContributions)
    };
  }

  /**
   * Validates pot integrity
   * @param {Player[]} players - Array of all players
   * @returns {Object} Validation result
   */
  validatePots(players) {
    const result = { valid: true, errors: [] };

    // Check that total pot amount matches total contributions
    const totalContributions = Array.from(this.playerContributions.values())
      .reduce((sum, amount) => sum + amount, 0);
    const totalPotAmount = this.getTotalPotAmount();

    if (totalContributions !== totalPotAmount) {
      result.valid = false;
      result.errors.push(`Total contributions (${totalContributions}) don't match total pot amount (${totalPotAmount})`);
    }

    // Check that all eligible players exist
    this.pots.forEach((pot, index) => {
      pot.eligiblePlayers.forEach(playerId => {
        const player = players.find(p => p.id === playerId);
        if (!player) {
          result.valid = false;
          result.errors.push(`Pot ${index} references non-existent player ${playerId}`);
        }
      });
    });

    return result;
  }
}

module.exports = PotManager;