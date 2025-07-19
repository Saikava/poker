/**
 * Test to verify the fix for action buttons disabled bug
 * 
 * BUG DESCRIPTION:
 * Action buttons (fold, call, raise) remained disabled on player's turn because
 * the UI Manager was looking for 'actions' property in getPlayerActions response,
 * but the actual property name is 'availableActions'.
 * 
 * FIX APPLIED:
 * 1. Changed updateActionButtons method to use 'availableActions' instead of 'actions'
 * 2. Updated call amount reference to use 'actionDetails.callAmount'
 * 3. Updated handleRaiseClick method to use 'actionDetails.minRaise' and 'actionDetails.maxRaise'
 */

const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

describe('Action Buttons Fix Verification', () => {
  let dom;
  let document;
  let window;
  let UIManager;
  let uiManager;

  beforeAll(() => {
    // Load the HTML file
    const htmlPath = path.join(__dirname, '../src/index.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    
    // Create JSDOM instance
    dom = new JSDOM(htmlContent);
    
    document = dom.window.document;
    window = dom.window;
    
    // Make document and window available globally
    global.document = document;
    global.window = window;
    global.HTMLElement = window.HTMLElement;
    global.Event = window.Event;

    // Import UIManager after setting up globals
    UIManager = require('../src/uiManager.js');
  });

  afterAll(() => {
    // Clean up global references
    delete global.document;
    delete global.window;
    delete global.HTMLElement;
    delete global.Event;
  });

  test('should enable action buttons correctly with real poker engine', () => {
    uiManager = new UIManager(document);
    
    // Add players and start game
    const playerIdInput = document.getElementById('player-id');
    const playerNameInput = document.getElementById('player-name');
    
    playerIdInput.value = 'player1';
    playerNameInput.value = 'Alice';
    uiManager.handleAddPlayer();
    
    playerIdInput.value = 'player2';
    playerNameInput.value = 'Bob';
    uiManager.handleAddPlayer();
    
    uiManager.handleStartGame();
    
    // Get game state
    const gameState = uiManager.gameController.getGameState();
    const gameStats = uiManager.gameController.getGameStats();
    const currentPlayerId = gameState.betting?.currentPlayer;
    
    // Verify the bug exists - buttons should be disabled due to wrong property name
    const foldBtn = document.getElementById('fold-btn');
    const callBtn = document.getElementById('call-btn');
    const raiseBtn = document.getElementById('raise-btn');
    
    // After fix: buttons are now enabled because code correctly uses 'availableActions'
    expect(foldBtn.disabled).toBe(false);
    expect(callBtn.disabled).toBe(false);
    expect(raiseBtn.disabled).toBe(false);
    
    // Verify that getPlayerActions returns the correct structure
    const actionsResult = uiManager.gameController.getPlayerActions(currentPlayerId);
    expect(actionsResult.success).toBe(true);
    expect(actionsResult.availableActions).toEqual(['fold', 'call', 'raise']);
    expect(actionsResult.actionDetails).toBeDefined();
    expect(actionsResult.actionDetails.callAmount).toBe(10);
    
    // Verify call button shows correct amount
    expect(callBtn.textContent).toBe('Call 10');
    
    if (uiManager) {
      uiManager.destroy();
    }
  });

  test('should verify raise functionality works with correct property names', () => {
    uiManager = new UIManager(document);
    
    // Add players and start game
    const playerIdInput = document.getElementById('player-id');
    const playerNameInput = document.getElementById('player-name');
    
    playerIdInput.value = 'player1';
    playerNameInput.value = 'Alice';
    uiManager.handleAddPlayer();
    
    playerIdInput.value = 'player2';
    playerNameInput.value = 'Bob';
    uiManager.handleAddPlayer();
    
    uiManager.handleStartGame();
    
    // Get game state
    const gameState = uiManager.gameController.getGameState();
    const currentPlayerId = gameState.betting?.currentPlayer;
    
    // Test raise functionality - this should work with the fixed property names
    const raiseBtn = document.getElementById('raise-btn');
    const raiseControls = document.getElementById('raise-controls');
    const raiseAmount = document.getElementById('raise-amount');
    
    // Click raise button to show controls
    raiseBtn.click();
    
    // Verify raise controls are shown with correct min/max values
    expect(raiseControls.style.display).toBe('block');
    expect(raiseAmount.min).not.toBe('0'); // Should have a proper min value
    expect(raiseAmount.value).not.toBe('0'); // Should have a proper default value
    
    // Verify the raise amount input has proper values from actionDetails
    const actionsResult = uiManager.gameController.getPlayerActions(currentPlayerId);
    expect(actionsResult.actionDetails).toBeDefined();
    expect(actionsResult.actionDetails.minRaise).toBeGreaterThan(0);
    
    if (uiManager) {
      uiManager.destroy();
    }
  });
});