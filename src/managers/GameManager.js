const PlayerManager = require('./PlayerManager');
const BettingManager = require('./BettingManager');
const PotManager = require('./PotManager');
const Deck = require('../models/Deck');
const { HandEvaluator } = require('../utilities/HandEvaluator');
const ValidationUtils = require('../utilities/ValidationUtils');
const { 
  GameStateError, 
  InvalidInputError, 
  PlayerNotFoundError,
  ConfigurationError
} = require('../errors/PokerErrors');

/**
 * Central coordinator for poker game state management
 * Handles game phases, community cards, and overall game flow
 */
class GameManager {
  constructor(config = {}) {
    // Validate configuration
    try {
      ValidationUtils.validateGameConfig(config);
    } catch (error) {
      throw error;
    }

    // Game configuration
    this.smallBlind = config.smallBlind || 10;
    this.bigBlind = config.bigBlind || 20;
    this.maxPlayers = config.maxPlayers || 10;
    this.minPlayers = config.minPlayers || 2;

    // Game state
    this.gamePhase = 'waiting'; // waiting, preflop, flop, turn, river, showdown, finished
    this.handNumber = 0;
    this.communityCards = [];
    this.isGameActive = false;

    // Component managers
    this.playerManager = new PlayerManager();
    this.bettingManager = new BettingManager();
    this.potManager = new PotManager();
    this.deck = new Deck();

    // Current hand state
    this.currentPlayerId = null;
    this.handResults = [];
    this.winners = [];

    // Event system
    this.eventListeners = new Map();
  }

  /**
   * Game phase constants
   */
  static get PHASES() {
    return {
      WAITING: 'waiting',
      PREFLOP: 'preflop',
      FLOP: 'flop',
      TURN: 'turn',
      RIVER: 'river',
      SHOWDOWN: 'showdown',
      FINISHED: 'finished'
    };
  }

  /**
   * Adds a player to the game
   * @param {string} id - Player ID
   * @param {string} name - Player name
   * @param {number} chips - Starting chip count
   * @returns {Object} Result of adding player
   */
  addPlayer(id, name, chips) {
    try {
      if (this.isGameActive) {
        throw new GameStateError('Cannot add players while game is active', {
          gameActive: this.isGameActive,
          playerId: id
        });
      }

      if (this.playerManager.getPlayerCount() >= this.maxPlayers) {
        throw new GameStateError(`Maximum ${this.maxPlayers} players allowed`, {
          currentPlayerCount: this.playerManager.getPlayerCount(),
          maxPlayers: this.maxPlayers,
          playerId: id
        });
      }

      const player = this.playerManager.addPlayer(id, name, chips);
      
      this.emit('playerAdded', {
        playerId: id,
        playerName: name,
        chips: chips,
        playerCount: this.playerManager.getPlayerCount()
      });

      return {
        success: true,
        player: player.getState(),
        canStartGame: this.canStartGame()
      };
    } catch (error) {
      // If it's already a custom poker engine error, re-throw it
      if (error.name && error.name.endsWith('Error') && error.toResponse) {
        throw error;
      }
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Removes a player from the game
   * @param {string} playerId - Player ID to remove
   * @returns {Object} Result of removing player
   */
  removePlayer(playerId) {
    try {
      const removed = this.playerManager.removePlayer(playerId);
      
      if (removed) {
        this.emit('playerRemoved', {
          playerId: playerId,
          playerCount: this.playerManager.getPlayerCount()
        });

        // Check if game should end due to insufficient players
        if (this.isGameActive && this.playerManager.getPlayerCount() < this.minPlayers) {
          this.endGame('insufficient_players');
        }
      }

      return {
        success: removed,
        playerCount: this.playerManager.getPlayerCount(),
        canContinueGame: this.playerManager.getPlayerCount() >= this.minPlayers
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Starts a new game
   * @returns {Object} Result of starting game
   */
  startGame() {
    try {
      if (this.isGameActive) {
        throw new Error('Game is already active');
      }

      if (!this.canStartGame()) {
        throw new Error(`Need at least ${this.minPlayers} players to start`);
      }

      this.isGameActive = true;
      this.handNumber = 0;
      
      this.emit('gameStarted', {
        playerCount: this.playerManager.getPlayerCount(),
        smallBlind: this.smallBlind,
        bigBlind: this.bigBlind
      });

      // Start first hand
      return this.startNewHand();
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Starts a new hand
   * @returns {Object} Result of starting new hand
   */
  startNewHand() {
    try {
      if (!this.isGameActive) {
        throw new Error('Game is not active');
      }

      // Reset managers for new hand first
      this.playerManager.resetPlayersForNewHand();

      // Check if we have enough players after reset
      if (this.playerManager.getActivePlayerCount() < this.minPlayers) {
        return this.endGame('insufficient_players');
      }

      // Increment hand number and reset state
      this.handNumber++;
      this.communityCards = [];
      this.handResults = [];
      this.winners = [];
      this.currentPlayerId = null;
      this.bettingManager.reset();
      this.potManager.reset();

      // Prepare deck
      this.deck.reset().shuffle();

      // Rotate dealer position (with proper handling for eliminated players)
      if (this.handNumber > 1) {
        this.rotateDealerButton();
      } else {
        // For first hand, ensure dealer position is valid
        this.playerManager.adjustDealerPositionForEliminatedPlayers();
      }

      // Collect blinds
      const blindResult = this.collectBlinds();
      if (!blindResult.success) {
        return blindResult;
      }

      // Deal hole cards
      this.dealHoleCards();

      // Set game phase to preflop
      this.setGamePhase(GameManager.PHASES.PREFLOP);

      // Start preflop betting
      this.startBettingRound();

      this.emit('handStarted', {
        handNumber: this.handNumber,
        dealerPosition: this.playerManager.dealerPosition,
        communityCards: [...this.communityCards],
        gamePhase: this.gamePhase
      });

      return {
        success: true,
        handNumber: this.handNumber,
        gamePhase: this.gamePhase,
        currentPlayer: this.currentPlayerId,
        gameState: this.getGameState()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Processes a player action
   * @param {string} playerId - Player ID
   * @param {string} action - Action type
   * @param {number} amount - Amount for raise actions
   * @returns {Object} Result of player action
   */
  processPlayerAction(playerId, action, amount = 0) {
    try {
      if (!this.isGameActive) {
        throw new Error('Game is not active');
      }

      if (this.currentPlayerId !== playerId) {
        throw new Error('Not player\'s turn');
      }

      const player = this.playerManager.getPlayer(playerId);
      if (!player) {
        throw new Error('Player not found');
      }

      // Validate action with betting manager
      const validation = this.bettingManager.validateAction(player, action, amount);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Execute player action
      const actionResult = this.playerManager.executePlayerAction(playerId, action, amount, 
        this.bettingManager.getCallAmount(player.currentBet));
      
      if (!actionResult.success) {
        throw new Error(actionResult.error);
      }

      // Process betting action
      const bettingResult = this.bettingManager.processAction(
        playerId, action, amount, player.currentBet - actionResult.amount
      );

      this.emit('playerAction', {
        playerId: playerId,
        action: action,
        amount: actionResult.amount,
        gamePhase: this.gamePhase,
        bettingState: this.bettingManager.getState()
      });

      // Check if only one player remains after this action
      const playersInHand = this.playerManager.getPlayersInHand();
      if (playersInHand.length <= 1) {
        return this.endHand('single_player');
      }

      // Check if betting round is complete
      const activePlayers = this.playerManager.getActivePlayers();
      if (this.bettingManager.isBettingComplete(activePlayers)) {
        return this.advanceGamePhase();
      } else {
        // Move to next player
        this.setNextPlayer();
        return {
          success: true,
          action: actionResult,
          nextPlayer: this.currentPlayerId,
          gameState: this.getGameState()
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Advances to the next game phase
   * @returns {Object} Result of phase advancement
   */
  advanceGamePhase() {
    try {
      // Collect bets into pot
      this.potManager.collectBets(this.playerManager.getAllPlayers());

      // Check if only one player remains
      const playersInHand = this.playerManager.getPlayersInHand();
      if (playersInHand.length <= 1) {
        return this.endHand('single_player');
      }

      // Advance to next phase
      const nextPhase = this.getNextPhase();
      if (!nextPhase) {
        return this.endHand('showdown');
      }

      this.setGamePhase(nextPhase);

      // Deal community cards for new phase
      this.dealCommunityCards();

      // Start new betting round
      this.startBettingRound();

      this.emit('phaseChanged', {
        newPhase: this.gamePhase,
        communityCards: [...this.communityCards],
        currentPlayer: this.currentPlayerId
      });

      return {
        success: true,
        newPhase: this.gamePhase,
        communityCards: [...this.communityCards],
        currentPlayer: this.currentPlayerId,
        gameState: this.getGameState()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Ends the current hand
   * @param {string} reason - Reason for ending hand
   * @returns {Object} Result of ending hand
   */
  endHand(reason) {
    try {
      this.setGamePhase(GameManager.PHASES.SHOWDOWN);

      let winners = [];

      if (reason === 'single_player') {
        // Award pot to remaining player
        const remainingPlayer = this.playerManager.getPlayersInHand()[0];
        const totalPot = this.potManager.getTotalPotAmount();
        
        winners = [{
          playerId: remainingPlayer.id,
          amount: totalPot,
          reason: 'last_player_standing'
        }];

        // Award chips to winner
        remainingPlayer.chips += totalPot;
      } else {
        // Evaluate hands and distribute winnings
        this.evaluateHands();
        const distributions = this.potManager.distributeWinnings(this.handResults);
        
        // Award chips to winners
        distributions.forEach(dist => {
          const player = this.playerManager.getPlayer(dist.playerId);
          if (player) {
            player.chips += dist.amount;
          }
        });

        winners = distributions;
      }

      this.winners = winners;
      this.setGamePhase(GameManager.PHASES.FINISHED);

      this.emit('handComplete', {
        handNumber: this.handNumber,
        winners: winners,
        finalCommunityCards: [...this.communityCards],
        handResults: this.handResults
      });

      // Check if game should continue (only end game if players are eliminated, not just folded)
      const playersWithChips = this.playerManager.getAllPlayers().filter(p => p.chips > 0);
      if (playersWithChips.length < this.minPlayers) {
        return this.endGame('insufficient_players');
      }

      return {
        success: true,
        winners: winners,
        handComplete: true,
        canContinue: true,
        gameState: this.getGameState()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Ends the game
   * @param {string} reason - Reason for ending game
   * @returns {Object} Result of ending game
   */
  endGame(reason) {
    this.isGameActive = false;
    this.setGamePhase(GameManager.PHASES.FINISHED);

    this.emit('gameEnded', {
      reason: reason,
      finalStandings: this.getFinalStandings()
    });

    return {
      success: true,
      gameEnded: true,
      reason: reason,
      finalStandings: this.getFinalStandings()
    };
  }

  /**
   * Sets the current game phase
   * @param {string} phase - New game phase
   * @private
   */
  setGamePhase(phase) {
    const oldPhase = this.gamePhase;
    this.gamePhase = phase;
    
    if (oldPhase !== phase) {
      this.emit('phaseTransition', {
        from: oldPhase,
        to: phase,
        handNumber: this.handNumber
      });
    }
  }

  /**
   * Gets the next game phase
   * @returns {string|null} Next phase or null if at end
   * @private
   */
  getNextPhase() {
    const phases = [
      GameManager.PHASES.PREFLOP,
      GameManager.PHASES.FLOP,
      GameManager.PHASES.TURN,
      GameManager.PHASES.RIVER
    ];

    const currentIndex = phases.indexOf(this.gamePhase);
    return currentIndex >= 0 && currentIndex < phases.length - 1 
      ? phases[currentIndex + 1] 
      : null;
  }

  /**
   * Deals community cards based on current phase
   * @private
   */
  dealCommunityCards() {
    switch (this.gamePhase) {
      case GameManager.PHASES.FLOP:
        // Burn one card, then deal 3 for flop
        this.deck.deal(); // burn card
        this.communityCards.push(...this.deck.dealCards(3));
        break;
      
      case GameManager.PHASES.TURN:
        // Burn one card, then deal 1 for turn
        this.deck.deal(); // burn card
        this.communityCards.push(this.deck.deal());
        break;
      
      case GameManager.PHASES.RIVER:
        // Burn one card, then deal 1 for river
        this.deck.deal(); // burn card
        this.communityCards.push(this.deck.deal());
        break;
    }

    this.emit('communityCardsDealt', {
      phase: this.gamePhase,
      newCards: this.communityCards.slice(-this.getCardsDealtForPhase()),
      allCommunityCards: [...this.communityCards]
    });
  }

  /**
   * Gets number of cards dealt for current phase
   * @returns {number} Number of cards dealt
   * @private
   */
  getCardsDealtForPhase() {
    switch (this.gamePhase) {
      case GameManager.PHASES.FLOP: return 3;
      case GameManager.PHASES.TURN: return 1;
      case GameManager.PHASES.RIVER: return 1;
      default: return 0;
    }
  }

  /**
   * Deals hole cards to all players
   * @private
   */
  dealHoleCards() {
    const players = this.playerManager.getActivePlayers();
    
    // Deal 2 cards to each player
    for (let round = 0; round < 2; round++) {
      for (const player of players) {
        player.addCards([this.deck.deal()]);
      }
    }

    this.emit('holeCardsDealt', {
      playerCount: players.length
    });
  }

  /**
   * Collects blinds from appropriate players
   * Handles heads-up play and special blind posting rules
   * @returns {Object} Result of collecting blinds
   * @private
   */
  collectBlinds() {
    try {
      const activePlayers = this.playerManager.getActivePlayers();
      
      if (activePlayers.length < 2) {
        throw new Error('Need at least 2 players to collect blinds');
      }

      const sbPlayer = this.playerManager.getSmallBlindPlayer();
      const bbPlayer = this.playerManager.getBigBlindPlayer();

      if (!sbPlayer || !bbPlayer) {
        throw new Error('Cannot determine blind positions');
      }

      // Validate that blind players are active
      if (sbPlayer.status !== 'active' && sbPlayer.status !== 'all-in') {
        throw new Error('Small blind player is not active');
      }
      
      if (bbPlayer.status !== 'active' && bbPlayer.status !== 'all-in') {
        throw new Error('Big blind player is not active');
      }

      // Post small blind
      const sbAmount = Math.min(this.smallBlind, sbPlayer.chips);
      sbPlayer.bet(sbAmount);
      this.potManager.addBet(sbPlayer.id, sbAmount);

      // Post big blind
      const bbAmount = Math.min(this.bigBlind, bbPlayer.chips);
      bbPlayer.bet(bbAmount);
      this.potManager.addBet(bbPlayer.id, bbAmount);

      // Set betting manager's current bet to big blind amount
      this.bettingManager.currentBet = bbAmount;

      this.emit('blindsPosted', {
        smallBlind: { playerId: sbPlayer.id, amount: sbAmount },
        bigBlind: { playerId: bbPlayer.id, amount: bbAmount },
        isHeadsUp: activePlayers.length === 2,
        dealerPosition: this.playerManager.dealerPosition
      });

      return { 
        success: true,
        smallBlind: { playerId: sbPlayer.id, amount: sbAmount },
        bigBlind: { playerId: bbPlayer.id, amount: bbAmount }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Starts a new betting round
   * @private
   */
  startBettingRound() {
    const roundNumber = this.getBettingRoundNumber();
    this.bettingManager.startBettingRound(roundNumber, this.bigBlind);
    
    // For preflop, set current bet to big blind amount
    if (this.gamePhase === GameManager.PHASES.PREFLOP) {
      this.bettingManager.currentBet = this.bigBlind;
    }
    
    // Set first player to act
    this.setFirstPlayerToAct();

    this.emit('bettingRoundStarted', {
      round: roundNumber,
      phase: this.gamePhase,
      firstPlayer: this.currentPlayerId
    });
  }

  /**
   * Gets betting round number for current phase
   * @returns {number} Betting round number
   * @private
   */
  getBettingRoundNumber() {
    const phaseToRound = {
      [GameManager.PHASES.PREFLOP]: 0,
      [GameManager.PHASES.FLOP]: 1,
      [GameManager.PHASES.TURN]: 2,
      [GameManager.PHASES.RIVER]: 3
    };
    return phaseToRound[this.gamePhase] || 0;
  }

  /**
   * Sets the first player to act in betting round
   * @private
   */
  setFirstPlayerToAct() {
    const activePlayers = this.playerManager.getActivePlayers();
    
    if (this.gamePhase === GameManager.PHASES.PREFLOP) {
      // Preflop: first to act is left of big blind (UTG)
      const bbPlayer = this.playerManager.getBigBlindPlayer();
      if (bbPlayer) {
        const nextPlayer = this.playerManager.getNextPlayer(bbPlayer.id);
        this.currentPlayerId = nextPlayer ? nextPlayer.id : null;
      }
    } else {
      // Post-flop: first to act is left of dealer
      const dealerPlayer = this.playerManager.getDealerPlayer();
      if (dealerPlayer) {
        const nextPlayer = this.playerManager.getNextPlayer(dealerPlayer.id);
        this.currentPlayerId = nextPlayer ? nextPlayer.id : null;
      }
    }

    // Fallback to first active player if no specific player found
    if (!this.currentPlayerId && activePlayers.length > 0) {
      this.currentPlayerId = activePlayers[0].id;
    }
  }

  /**
   * Sets the next player to act
   * @private
   */
  setNextPlayer() {
    const activePlayers = this.playerManager.getActivePlayers();
    const nextPlayer = this.bettingManager.getNextPlayerToAct(activePlayers, this.currentPlayerId);
    this.currentPlayerId = nextPlayer ? nextPlayer.id : null;
  }

  /**
   * Rotates the dealer button to the next active player
   * Handles position adjustments for eliminated players
   * @private
   */
  rotateDealerButton() {
    this.playerManager.rotateDealerButton();
    
    this.emit('dealerButtonRotated', {
      newDealerPosition: this.playerManager.dealerPosition,
      dealerPlayerId: this.playerManager.getDealerPlayer()?.id
    });
  }

  /**
   * Evaluates all player hands
   * @private
   */
  evaluateHands() {
    const playersInHand = this.playerManager.getPlayersInHand();
    this.handResults = [];

    for (const player of playersInHand) {
      const allCards = [...player.cards, ...this.communityCards];
      const handResult = HandEvaluator.evaluateHand(allCards);
      
      this.handResults.push({
        playerId: player.id,
        handType: handResult.handType,
        handStrength: handResult.strength,
        bestHand: handResult.cards,
        kickers: handResult.kickers || []
      });
    }

    // Sort by hand strength (highest first)
    this.handResults.sort((a, b) => b.handStrength - a.handStrength);
  }

  /**
   * Checks if game can start
   * @returns {boolean} True if game can start
   */
  canStartGame() {
    return this.playerManager.getPlayerCount() >= this.minPlayers && !this.isGameActive;
  }

  /**
   * Gets final standings
   * @returns {Object[]} Array of player standings
   */
  getFinalStandings() {
    return this.playerManager.getAllPlayers()
      .map(player => ({
        playerId: player.id,
        name: player.name,
        chips: player.chips,
        status: player.status
      }))
      .sort((a, b) => b.chips - a.chips);
  }

  /**
   * Gets comprehensive game state
   * @returns {Object} Complete game state
   */
  getGameState() {
    return {
      // Game info
      gamePhase: this.gamePhase,
      handNumber: this.handNumber,
      isGameActive: this.isGameActive,
      
      // Players
      players: this.playerManager.getState(),
      currentPlayer: this.currentPlayerId,
      
      // Cards
      communityCards: [...this.communityCards],
      
      // Betting
      betting: this.bettingManager.getState(),
      
      // Pots
      pots: this.potManager.getState(),
      
      // Hand results (if available)
      handResults: [...this.handResults],
      winners: [...this.winners],
      
      // Configuration
      blinds: {
        small: this.smallBlind,
        big: this.bigBlind
      }
    };
  }

  // Event system methods
  
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
}

module.exports = GameManager;