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
    this.elements.newHandBtn = this.document.getElementById('new-hand-btn');
    
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
    
    // Hand results display elements
    this.elements.handResultsSection = this.document.getElementById('hand-results');
    this.elements.handResultsContent = this.document.getElementById('results-content');
    
    // Player action elements
    this.elements.currentPlayerInfo = this.document.getElementById('current-player-info');
    this.elements.actionButtons = this.document.getElementById('action-buttons');
    this.elements.foldBtn = this.document.getElementById('fold-btn');
    this.elements.checkBtn = this.document.getElementById('check-btn');
    this.elements.callBtn = this.document.getElementById('call-btn');
    this.elements.raiseBtn = this.document.getElementById('raise-btn');
    this.elements.raiseControls = this.document.getElementById('raise-controls');
    this.elements.raiseAmount = this.document.getElementById('raise-amount');
    this.elements.confirmRaiseBtn = this.document.getElementById('confirm-raise-btn');
    this.elements.cancelRaiseBtn = this.document.getElementById('cancel-raise-btn');
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
    
    // Game control events
    if (this.elements.startGameBtn) {
      this.elements.startGameBtn.addEventListener('click', () => this.handleStartGame());
    }
    if (this.elements.newHandBtn) {
      this.elements.newHandBtn.addEventListener('click', () => this.handleNewHand());
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
    
    // Player action events
    if (this.elements.foldBtn) {
      this.elements.foldBtn.addEventListener('click', () => this.handlePlayerAction('fold'));
    }
    if (this.elements.checkBtn) {
      this.elements.checkBtn.addEventListener('click', () => this.handlePlayerAction('check'));
    }
    if (this.elements.callBtn) {
      this.elements.callBtn.addEventListener('click', () => this.handlePlayerAction('call'));
    }
    if (this.elements.raiseBtn) {
      this.elements.raiseBtn.addEventListener('click', () => this.handleRaiseClick());
    }
    if (this.elements.confirmRaiseBtn) {
      this.elements.confirmRaiseBtn.addEventListener('click', () => this.handleConfirmRaise());
    }
    if (this.elements.cancelRaiseBtn) {
      this.elements.cancelRaiseBtn.addEventListener('click', () => this.handleCancelRaise());
    }
    
    // Allow Enter key to confirm raise
    if (this.elements.raiseAmount) {
      this.elements.raiseAmount.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.handleConfirmRaise();
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
   * Update player list from game state to keep chip counts current
   */
  updatePlayerListFromGameState(gameState) {
    if (!gameState.players || gameState.players.length === 0) {
      return;
    }
    
    // Update current players with latest chip counts from game state
    gameState.players.forEach(gamePlayer => {
      const localPlayer = this.currentPlayers.find(p => p.id === gamePlayer.id);
      if (localPlayer) {
        localPlayer.chips = gamePlayer.chips || localPlayer.chips;
        localPlayer.name = gamePlayer.name || localPlayer.name;
      }
    });
    
    // Refresh the player list display with updated chip counts
    this.updatePlayerList();
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
   * Handle starting a new game
   */
  handleStartGame() {
    // Clear any existing errors
    this.clearError();

    // Start game through game controller
    const result = this.gameController.startGame();

    if (result.success) {
      // Update UI to reflect game started
      this.refreshUI();
    } else {
      // Display error from poker engine
      const errorMessage = result.error ? result.error.message : 'Failed to start game';
      this.showError(errorMessage);
    }
  }

  /**
   * Handle starting a new hand
   */
  handleNewHand() {
    // Clear any existing errors
    this.clearError();

    // Start new hand through game controller
    const result = this.gameController.startNewHand();

    if (result.success) {
      // Update UI to reflect new hand started
      this.refreshUI();
    } else {
      // Display error from poker engine
      const errorMessage = result.error ? result.error.message : 'Failed to start new hand';
      this.showError(errorMessage);
    }
  }

  /**
   * Update game control buttons based on current game state
   */
  updateGameControls() {
    const gameStats = this.gameController.getGameStats();
    const canStartResult = this.gameController.canStartGame();

    // Update start game button
    if (gameStats.isGameActive) {
      this.elements.startGameBtn.disabled = true;
      this.elements.startGameBtn.textContent = 'Game Active';
    } else {
      this.elements.startGameBtn.disabled = !canStartResult.canStart;
      this.elements.startGameBtn.textContent = 'Start Game';
    }

    // Update new hand button
    if (gameStats.isGameActive && (gameStats.currentPhase === 'complete' || gameStats.currentPhase === 'waiting')) {
      this.elements.newHandBtn.disabled = false;
      this.elements.newHandBtn.textContent = 'New Hand';
    } else if (gameStats.isGameActive) {
      this.elements.newHandBtn.disabled = true;
      this.elements.newHandBtn.textContent = 'Hand in Progress';
    } else {
      this.elements.newHandBtn.disabled = true;
      this.elements.newHandBtn.textContent = 'New Hand';
    }
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
   * Update game state display - comprehensive refresh of all UI elements
   */
  updateGameStateDisplay() {
    try {
      const gameState = this.gameController.getGameState();
      const gameStats = this.gameController.getGameStats();
      
      // Update game info
      this.updateGameInfo(gameStats);
      
      // Update game controls
      this.updateGameControls();
      
      // Update pot information
      this.updatePotDisplay(gameState);
      
      // Update community cards
      this.updateCommunityCards(gameState);
      
      // Update players display
      this.updatePlayersDisplay(gameState);
      
      // Update player actions
      this.updatePlayerActions(gameState);
      
      // Update hand results if hand is complete
      this.updateHandResults(gameState, gameStats);
      
      // Update player list to reflect current chip counts
      this.updatePlayerListFromGameState(gameState);
    } catch (error) {
      // Handle errors gracefully - in a real app, you might want to show an error message
      console.error('Error updating game state display:', error);
    }
  }

  /**
   * Refresh all UI components - called after any poker engine interaction
   */
  refreshUI() {
    this.updateGameStateDisplay();
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
   * Update player actions display and functionality
   */
  updatePlayerActions(gameState) {
    if (!this.elements.currentPlayerInfo || !this.elements.actionButtons) {
      return;
    }
    
    const currentPlayerId = gameState.betting ? gameState.betting.currentPlayer : null;
    const gameStats = this.gameController.getGameStats();
    
    // Update current player info
    this.updateCurrentPlayerInfo(gameState, currentPlayerId);
    
    // Update action buttons based on available actions
    this.updateActionButtons(currentPlayerId, gameStats);
  }

  /**
   * Update current player information display
   */
  updateCurrentPlayerInfo(gameState, currentPlayerId) {
    if (!currentPlayerId || !gameState.players) {
      this.elements.currentPlayerInfo.innerHTML = '<p>Waiting for game to start...</p>';
      return;
    }
    
    const currentPlayer = gameState.players.find(p => p.id === currentPlayerId);
    if (!currentPlayer) {
      this.elements.currentPlayerInfo.innerHTML = '<p>No current player</p>';
      return;
    }
    
    const callAmount = gameState.betting ? gameState.betting.callAmount : 0;
    const minRaise = gameState.betting ? gameState.betting.minRaise : 0;
    
    this.elements.currentPlayerInfo.innerHTML = `
      <div class="current-player-highlight">
        <strong>Current Player: ${this.escapeHtml(currentPlayer.name)} (${this.escapeHtml(currentPlayer.id)})</strong>
        <div class="player-action-info">
          <span>Chips: ${currentPlayer.chips}</span>
          <span>Current Bet: ${currentPlayer.bet || 0}</span>
          ${callAmount > 0 ? `<span>Call Amount: ${callAmount}</span>` : ''}
          ${minRaise > 0 ? `<span>Min Raise: ${minRaise}</span>` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Update action buttons based on available actions
   */
  updateActionButtons(currentPlayerId, gameStats) {
    // Disable all buttons by default
    this.elements.foldBtn.disabled = true;
    this.elements.checkBtn.disabled = true;
    this.elements.callBtn.disabled = true;
    this.elements.raiseBtn.disabled = true;
    
    // Hide raise controls
    this.elements.raiseControls.style.display = 'none';
    
    // If no current player or game not active, keep buttons disabled
    if (!currentPlayerId || !gameStats.isGameActive) {
      return;
    }
    
    // Get available actions from game controller
    const actionsResult = this.gameController.getPlayerActions(currentPlayerId);
    if (!actionsResult.success || !actionsResult.actions) {
      return;
    }
    
    const availableActions = actionsResult.actions;
    
    // Enable buttons based on available actions
    if (availableActions.includes('fold')) {
      this.elements.foldBtn.disabled = false;
    }
    if (availableActions.includes('check')) {
      this.elements.checkBtn.disabled = false;
    }
    if (availableActions.includes('call')) {
      this.elements.callBtn.disabled = false;
      // Update call button text with amount if available
      const callAmount = actionsResult.callAmount || 0;
      this.elements.callBtn.textContent = callAmount > 0 ? `Call ${callAmount}` : 'Call';
    }
    if (availableActions.includes('raise')) {
      this.elements.raiseBtn.disabled = false;
    }
  }

  /**
   * Handle player action (fold, check, call)
   */
  handlePlayerAction(action) {
    // Clear any existing errors
    this.clearError();
    
    const gameState = this.gameController.getGameState();
    const currentPlayerId = gameState.betting ? gameState.betting.currentPlayer : null;
    
    if (!currentPlayerId) {
      this.showError('No current player to perform action');
      return;
    }
    
    // Perform action through game controller
    const result = this.gameController.playerAction({
      playerId: currentPlayerId,
      action: action
    });
    
    if (result.success) {
      // Update UI to reflect action taken
      this.refreshUI();
    } else {
      // Display error from poker engine
      const errorMessage = result.error ? result.error.message : `Failed to perform ${action} action`;
      this.showError(errorMessage);
    }
  }

  /**
   * Handle raise button click - show raise controls
   */
  handleRaiseClick() {
    // Clear any existing errors
    this.clearError();
    
    const gameState = this.gameController.getGameState();
    const currentPlayerId = gameState.betting ? gameState.betting.currentPlayer : null;
    
    if (!currentPlayerId) {
      this.showError('No current player to perform raise');
      return;
    }
    
    // Get available actions to get min raise amount
    const actionsResult = this.gameController.getPlayerActions(currentPlayerId);
    if (!actionsResult.success) {
      this.showError('Unable to get raise information');
      return;
    }
    
    const minRaise = actionsResult.minRaise || 0;
    const maxRaise = actionsResult.maxRaise || 1000;
    
    // Set up raise input
    this.elements.raiseAmount.min = minRaise;
    this.elements.raiseAmount.max = maxRaise;
    this.elements.raiseAmount.value = minRaise;
    this.elements.raiseAmount.placeholder = `Min: ${minRaise}, Max: ${maxRaise}`;
    
    // Show raise controls
    this.elements.raiseControls.style.display = 'block';
    this.elements.raiseAmount.focus();
  }

  /**
   * Handle confirm raise action
   */
  handleConfirmRaise() {
    // Clear any existing errors
    this.clearError();
    
    const gameState = this.gameController.getGameState();
    const currentPlayerId = gameState.betting ? gameState.betting.currentPlayer : null;
    
    if (!currentPlayerId) {
      this.showError('No current player to perform raise');
      return;
    }
    
    const raiseAmount = parseInt(this.elements.raiseAmount.value);
    
    // Basic validation
    if (isNaN(raiseAmount) || raiseAmount <= 0) {
      this.showError('Please enter a valid raise amount');
      return;
    }
    
    // Perform raise action through game controller
    const result = this.gameController.playerAction({
      playerId: currentPlayerId,
      action: 'raise',
      amount: raiseAmount
    });
    
    if (result.success) {
      // Hide raise controls and update UI
      this.elements.raiseControls.style.display = 'none';
      this.refreshUI();
    } else {
      // Display error from poker engine
      const errorMessage = result.error ? result.error.message : 'Failed to perform raise action';
      this.showError(errorMessage);
    }
  }

  /**
   * Handle cancel raise action
   */
  handleCancelRaise() {
    // Hide raise controls without performing action
    this.elements.raiseControls.style.display = 'none';
    this.elements.raiseAmount.value = '';
  }

  /**
   * Update hand results display when hand is complete
   */
  updateHandResults(gameState, gameStats) {
    if (!this.elements.handResultsSection || !this.elements.handResultsContent) {
      return;
    }
    
    // Show hand results only when hand is complete
    if (gameStats.currentPhase === 'complete' && gameState.handResults) {
      this.elements.handResultsSection.style.display = 'block';
      
      const results = gameState.handResults;
      let resultsHtml = '<div class="hand-results-summary">';
      
      // Display winners
      if (results.winners && results.winners.length > 0) {
        resultsHtml += '<h3>Hand Winners</h3>';
        results.winners.forEach((winner, index) => {
          const player = gameState.players ? gameState.players.find(p => p.id === winner.playerId) : null;
          const playerName = player ? player.name : winner.playerId;
          
          resultsHtml += `
            <div class="winner-info">
              <div class="winner-player">
                <strong>${this.escapeHtml(playerName)} (${this.escapeHtml(winner.playerId)})</strong>
              </div>
              <div class="winner-hand">
                Hand: ${this.escapeHtml(winner.handType || 'Unknown')}
              </div>
              <div class="winner-amount">
                Won: $${winner.amount || 0}
              </div>
            </div>
          `;
        });
      }
      
      // Display pot distribution
      if (results.potDistribution) {
        resultsHtml += '<h3>Pot Distribution</h3>';
        resultsHtml += `<div class="pot-distribution">Total Pot: $${results.potDistribution.totalPot || 0}</div>`;
        
        if (results.potDistribution.mainPot) {
          resultsHtml += `<div class="main-pot">Main Pot: $${results.potDistribution.mainPot}</div>`;
        }
        
        if (results.potDistribution.sidePots && results.potDistribution.sidePots.length > 0) {
          results.potDistribution.sidePots.forEach((sidePot, index) => {
            resultsHtml += `<div class="side-pot">Side Pot ${index + 1}: $${sidePot.amount}</div>`;
          });
        }
      }
      
      // Display all player hands if available
      if (results.playerHands && results.playerHands.length > 0) {
        resultsHtml += '<h3>Player Hands</h3>';
        results.playerHands.forEach(playerHand => {
          const player = gameState.players ? gameState.players.find(p => p.id === playerHand.playerId) : null;
          const playerName = player ? player.name : playerHand.playerId;
          
          resultsHtml += `
            <div class="player-hand-result">
              <div class="player-name">${this.escapeHtml(playerName)} (${this.escapeHtml(playerHand.playerId)})</div>
              <div class="hand-type">${this.escapeHtml(playerHand.handType || 'Folded')}</div>
              <div class="hand-cards">
                ${playerHand.cards ? playerHand.cards.map(card => this.createCardElement(card, true)).join('') : 'No cards shown'}
              </div>
            </div>
          `;
        });
      }
      
      resultsHtml += '</div>';
      this.elements.handResultsContent.innerHTML = resultsHtml;
    } else {
      // Hide hand results when hand is not complete
      this.elements.handResultsSection.style.display = 'none';
    }
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