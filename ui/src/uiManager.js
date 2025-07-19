/**
 * UI Manager for Poker UI
 * Handles all DOM manipulation and user interactions
 */

import GameController from './gameController.js';

/**
 * UIManager class that manages all UI interactions and updates
 */
class UIManager {
  constructor() {
    this.gameController = new GameController();
    this.elements = {};
    this.currentPlayers = [];
    
    this.initializeElements();
    this.bindEvents();
  }

  /**
   * Initialize DOM element references
   */
  initializeElements() {
    // Player management elements
    this.elements.playerIdInput = document.getElementById('player-id');
    this.elements.playerNameInput = document.getElementById('player-name');
    this.elements.addPlayerBtn = document.getElementById('add-player-btn');
    this.elements.playersContainer = document.getElementById('players-container');
    
    // Game control elements
    this.elements.startGameBtn = document.getElementById('start-game-btn');
    
    // Error display elements
    this.elements.errorDisplay = document.getElementById('error-display');
    this.elements.errorMessage = document.getElementById('error-message');
    this.elements.clearErrorBtn = document.getElementById('clear-error-btn');
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Player management events
    this.elements.addPlayerBtn.addEventListener('click', () => this.handleAddPlayer());
    this.elements.clearErrorBtn.addEventListener('click', () => this.clearError());
    
    // Allow Enter key to add player
    this.elements.playerIdInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.handleAddPlayer();
    });
    this.elements.playerNameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.handleAddPlayer();
    });
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
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Get current players list
   */
  getCurrentPlayers() {
    return [...this.currentPlayers];
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