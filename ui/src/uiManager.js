/**
 * UI Manager for Poker UI
 * Handles all DOM manipulation and user interactions
 */

import GameController from './gameController.js';

/**
 * UIManager class that manages all UI interactions and updates
 */
class UIManager {
  constructor(documentRef = null) {
    this.gameController = new GameController();
    this.elements = {};
    this.currentPlayers = [];
    this.document = documentRef || (typeof document !== 'undefined' ? document : null);
    
    this.initializeElements();
    this.bindEvents();
  }

  /**
   * Initialize DOM element references
   */
  initializeElements() {
    if (!this.document) {
      console.warn('Document not available, skipping element initialization');
      return;
    }
    
    // Player management elements
    this.elements.playerIdInput = this.document.getElementById('player-id');
    this.elements.playerNameInput = this.document.getElementById('player-name');
    this.elements.addPlayerBtn = this.document.getElementById('add-player-btn');
    this.elements.playersContainer = this.document.getElementById('players-container');
    
    // Game control elements
    this.elements.startGameBtn = this.document.getElementById('start-game-btn');
    
    // Game state display elements
    this.elements.gamePhase = this.document.getElementById('game-phase');
    this.elements.handNumber = this.document.getElementById('hand-number');
    this.elements.currentPlayer = this.document.getElementById('current-player');
    this.elements.totalPot = this.document.getElementById('total-pot');
    this.elements.sidePots = this.document.getElementById('side-pots');
    this.elements.communityCardsContainer = this.document.getElementById('community-cards-container');
    this.elements.playersGrid = this.document.getElementById('players-grid');
    
    // Error display elements
    this.elements.errorDisplay = this.document.getElementById('error-display');
    this.elements.errorMessage = this.document.getElementById('error-message');
    this.elements.clearErrorBtn = this.document.getElementById('clear-error-btn');
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Player management events
    if (this.elements.addPlayerBtn) {
      this.elements.addPlayerBtn.addEventListener('click', () => this.handleAddPlayer());
    }
    if (this.elements.clearErrorBtn) {
      this.elements.clearErrorBtn.addEventListener('click', () => this.clearError());
    }
    
    // Allow Enter key to add player
    if (this.elements.playerIdInput) {
      this.elements.playerIdInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.handleAddPlayer();
      });
    }
    if (this.elements.playerNameInput) {
      this.elements.playerNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.handleAddPlayer();
      });
    }
  }

  /**
   * Handle adding a new player
   */
  handleAddPlayer() {
    const playerId = this.elements.playerIdInput.value.trim();
    const playerName = this.elements.playerNameInput.value.trim();

    // Clear any existing errors
    this.clearError();

    // Basic client-side validation (minimal, let poker engine handle most validation)
    if (!playerId || !playerName) {
      this.showError('Both Player ID and Player Name are required');
      return;
    }

    // Add player through game controller
    const result = this.gameController.addPlayer({
      id: playerId,
      name: playerName,
      chips: this.gameController.getConfig().startingChips
    });

    if (result.success) {
      // Add player to local tracking
      this.currentPlayers.push({
        id: playerId,
        name: playerName,
        chips: this.gameController.getConfig().startingChips
      });

      // Update UI
      this.updatePlayerList();
      this.clearPlayerForm();
      this.updateStartGameButton();
    } else {
      // Display error from poker engine
      const errorMessage = result.error ? result.error.message : 'Failed to add player';
      this.showError(errorMessage);
    }
  }

  /**
   * Handle removing a player
   */
  handleRemovePlayer(playerId) {
    // Clear any existing errors
    this.clearError();

    // Remove player through game controller
    const result = this.gameController.removePlayer(playerId);

    if (result.success) {
      // Remove player from local tracking
      this.currentPlayers = this.currentPlayers.filter(player => player.id !== playerId);

      // Update UI
      this.updatePlayerList();
      this.updateStartGameButton();
    } else {
      // Display error from poker engine
      const errorMessage = result.error ? result.error.message : 'Failed to remove player';
      this.showError(errorMessage);
    }
  }

  /**
   * Update the player list display
   */
  updatePlayerList() {
    const container = this.elements.playersContainer;
    
    if (this.currentPlayers.length === 0) {
      container.innerHTML = '<p class="no-players">No players added yet</p>';
      return;
    }

    const playersHtml = this.currentPlayers.map(player => `
      <div class="player-item" data-player-id="${player.id}">
        <div class="player-info">
          <span class="player-name">${this.escapeHtml(player.name)}</span>
          <span class="player-id">(ID: ${this.escapeHtml(player.id)})</span>
          <span class="player-chips">Chips: $${player.chips}</span>
        </div>
        <button type="button" class="btn btn-danger btn-small remove-player-btn" data-player-id="${player.id}">
          Remove
        </button>
      </div>
    `).join('');

    container.innerHTML = playersHtml;

    // Bind remove button events
    container.querySelectorAll('.remove-player-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const playerId = e.target.getAttribute('data-player-id');
        this.handleRemovePlayer(playerId);
      });
    });
  }

  /**
   * Clear the player form inputs
   */
  clearPlayerForm() {
    this.elements.playerIdInput.value = '';
    this.elements.playerNameInput.value = '';
    this.elements.playerIdInput.focus();
  }

  /**
   * Update the start game button state
   */
  updateStartGameButton() {
    const canStartResult = this.gameController.canStartGame();
    this.elements.startGameBtn.disabled = !canStartResult.canStart;
  }

  /**
   * Show error message
   */
  showError(message) {
    this.elements.errorMessage.textContent = message;
    this.elements.errorDisplay.style.display = 'block';
  }

  /**
   * Clear error message
   */
  clearError() {
    this.elements.errorMessage.textContent = '';
    this.elements.errorDisplay.style.display = 'none';
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const div = this.document ? this.document.createElement('div') : document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Escape HTML attribute to prevent XSS
   */
  escapeHtmlAttribute(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }

  /**
   * Get current players list
   */
  getCurrentPlayers() {
    return [...this.currentPlayers];
  }

  /**
   * Update game state display
   */
  updateGameStateDisplay() {
    try {
      const gameState = this.gameController.getGameState();
      const gameStats = this.gameController.getGameStats();
      
      // Update game info
      this.updateGameInfo(gameStats);
      
      // Update pot information
      this.updatePotDisplay(gameState);
      
      // Update community cards
      this.updateCommunityCards(gameState);
      
      // Update players display
      this.updatePlayersDisplay(gameState);
    } catch (error) {
      // Handle errors gracefully - in a real app, you might want to show an error message
      console.error('Error updating game state display:', error);
    }
  }

  /**
   * Update game information display (phase, hand number, current player)
   */
  updateGameInfo(gameStats) {
    // Update game phase
    const phaseDisplayNames = {
      'waiting': 'Not Started',
      'preflop': 'Pre-Flop',
      'flop': 'Flop',
      'turn': 'Turn',
      'river': 'River',
      'showdown': 'Showdown',
      'complete': 'Hand Complete'
    };
    
    const displayPhase = phaseDisplayNames[gameStats.currentPhase] || gameStats.currentPhase;
    if (this.elements.gamePhase) {
      this.elements.gamePhase.textContent = displayPhase;
    }
    
    // Update hand number
    if (this.elements.handNumber) {
      this.elements.handNumber.textContent = gameStats.handNumber.toString();
    }
    
    // Update current player - use the gameState passed to updateGameStateDisplay to avoid double calls
    if (this.elements.currentPlayer) {
      const gameState = this.gameController.getGameState();
      if (gameState.betting && gameState.betting.currentPlayer) {
        const currentPlayerData = gameState.players ? gameState.players.find(p => p.id === gameState.betting.currentPlayer) : null;
        const displayName = currentPlayerData ? currentPlayerData.name : gameState.betting.currentPlayer;
        this.elements.currentPlayer.textContent = displayName;
      } else {
        this.elements.currentPlayer.textContent = 'None';
      }
    }
  }

  /**
   * Update pot information display
   */
  updatePotDisplay(gameState) {
    // Update total pot
    const totalPot = gameState.pots ? gameState.pots.total : 0;
    if (this.elements.totalPot) {
      this.elements.totalPot.textContent = `$${totalPot}`;
    }
    
    // Update side pots
    if (this.elements.sidePots) {
      if (gameState.pots && gameState.pots.sidePots && gameState.pots.sidePots.length > 0) {
        const sidePotText = gameState.pots.sidePots.map((pot, index) => 
          `Side Pot ${index + 1}: $${pot.amount}`
        ).join(', ');
        this.elements.sidePots.textContent = sidePotText;
      } else {
        this.elements.sidePots.textContent = 'None';
      }
    }
  }

  /**
   * Update community cards display
   */
  updateCommunityCards(gameState) {
    if (!this.elements.communityCardsContainer) {
      return;
    }
    
    const communityCards = gameState.table ? gameState.table.communityCards : [];
    
    if (communityCards.length === 0) {
      this.elements.communityCardsContainer.innerHTML = '<p class="no-cards">No community cards dealt yet</p>';
      return;
    }
    
    const cardsHtml = communityCards.map(card => this.createCardElement(card)).join('');
    this.elements.communityCardsContainer.innerHTML = cardsHtml;
  }

  /**
   * Update players display in the game state section
   */
  updatePlayersDisplay(gameState) {
    if (!this.elements.playersGrid) {
      return;
    }
    
    const players = gameState.players || [];
    
    if (players.length === 0) {
      this.elements.playersGrid.innerHTML = '<p class="no-players">No players in game</p>';
      return;
    }
    
    const currentPlayerId = gameState.betting ? gameState.betting.currentPlayer : null;
    
    const playersHtml = players.map(player => {
      const isCurrentPlayer = player.id === currentPlayerId;
      const playerCards = player.cards || [];
      const playerBet = player.bet || 0;
      const playerChips = player.chips || 0;
      const isFolded = player.folded || false;
      
      const cardsHtml = playerCards.length > 0 
        ? playerCards.map(card => this.createCardElement(card, true)).join('')
        : '<div class="no-cards-small">No cards</div>';
      
      const statusClasses = ['player-state'];
      if (isCurrentPlayer) statusClasses.push('current-player');
      if (isFolded) statusClasses.push('folded');
      
      return `
        <div class="${statusClasses.join(' ')}" data-player-id="${this.escapeHtmlAttribute(player.id)}">
          <div class="player-header">
            <span class="player-name">${this.escapeHtml(player.name)}</span>
            <span class="player-id">(${this.escapeHtml(player.id)})</span>
          </div>
          <div class="player-cards">
            ${cardsHtml}
          </div>
          <div class="player-stats">
            <div><strong>Chips:</strong> $${playerChips}</div>
            <div><strong>Current Bet:</strong> $${playerBet}</div>
            <div><strong>Status:</strong> ${isFolded ? 'Folded' : 'Active'}</div>
          </div>
        </div>
      `;
    }).join('');
    
    this.elements.playersGrid.innerHTML = playersHtml;
  }

  /**
   * Create a card element HTML
   */
  createCardElement(card, isSmall = false) {
    if (!card || !card.rank || !card.suit) {
      return `<div class="card ${isSmall ? 'small' : ''}">?</div>`;
    }
    
    const suitSymbols = {
      'hearts': '♥',
      'diamonds': '♦',
      'clubs': '♣',
      'spades': '♠'
    };
    
    const suitColors = {
      'hearts': 'red',
      'diamonds': 'red',
      'clubs': 'black',
      'spades': 'black'
    };
    
    const displayRank = card.rank === '10' ? 'T' : card.rank;
    const suitSymbol = suitSymbols[card.suit.toLowerCase()] || card.suit;
    const colorClass = suitColors[card.suit.toLowerCase()] || 'black';
    
    return `
      <div class="card ${colorClass} ${isSmall ? 'small' : ''}" data-rank="${card.rank}" data-suit="${card.suit}">
        <div class="card-rank">${displayRank}</div>
        <div class="card-suit">${suitSymbol}</div>
      </div>
    `;
  }

  /**
   * Get game controller instance
   */
  getGameController() {
    return this.gameController;
  }

  /**
   * Destroy UI manager and clean up
   */
  destroy() {
    if (this.gameController) {
      this.gameController.destroy();
    }
  }
}

export default UIManager;