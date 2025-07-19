/**
 * Test to reproduce the actual issue where action buttons remain disabled on player's turn
 * This test uses the real PokerEngine instead of mocks to reproduce the exact bug
 */

const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

describe('Action Buttons Disabled Bug - Real Engine Test', () => {
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
        dom = new JSDOM(htmlContent, {
            runScripts: 'dangerously'
        });

        document = dom.window.document;
        window = dom.window;

        // Make document and window available globally
        global.document = document;
        global.window = window;
        global.HTMLElement = window.HTMLElement;
        global.Event = window.Event;

        // Import UIManager after setting up globals - this will use the real GameController
        UIManager = require('../src/uiManager.js');
    });

    beforeEach(() => {
        // Create fresh UI manager instance for each test - uses real GameController
        uiManager = new UIManager(document);
    });

    afterEach(() => {
        if (uiManager) {
            uiManager.destroy();
        }
    });

    afterAll(() => {
        // Clean up global references
        delete global.document;
        delete global.window;
        delete global.HTMLElement;
        delete global.Event;
    });

    test('should reproduce action buttons disabled bug with real poker engine', () => {
        // Step 1: Add two players
        const playerIdInput = document.getElementById('player-id');
        const playerNameInput = document.getElementById('player-name');

        // Add first player
        playerIdInput.value = 'player1';
        playerNameInput.value = 'Alice';
        uiManager.handleAddPlayer();

        // Add second player
        playerIdInput.value = 'player2';
        playerNameInput.value = 'Bob';
        uiManager.handleAddPlayer();

        // Verify we have 2 players
        expect(uiManager.getCurrentPlayers()).toHaveLength(2);

        // Step 2: Start the game
        const startGameBtn = document.getElementById('start-game-btn');
        expect(startGameBtn.disabled).toBe(false);

        uiManager.handleStartGame();

        // Step 3: Check the game state after starting
        const gameState = uiManager.gameController.getGameState();
        const gameStats = uiManager.gameController.getGameStats();

        // Write debug info to understand the game state structure
        const debugInfo = {
            gameState: gameState,
            gameStats: gameStats,
            currentPlayerFromBetting: gameState.betting?.currentPlayer,
            currentPlayerFromGameInfo: gameState.gameInfo?.currentPlayer,
            currentPlayerFromRoot: gameState.currentPlayer
        };

        // Log key information
        console.log('=== GAME STATE DEBUG ===');
        console.log('Game active:', gameStats.isGameActive);
        console.log('Current phase:', gameStats.currentPhase);
        console.log('Current player from betting:', gameState.betting?.currentPlayer);
        console.log('Current player from gameInfo:', gameState.gameInfo?.currentPlayer);
        console.log('Current player from root:', gameState.currentPlayer);

        // Verify game is active
        expect(gameStats.isGameActive).toBe(true);
        expect(gameStats.currentPhase).not.toBe('waiting');

        // Step 4: Check current player info display
        const currentPlayerInfo = document.getElementById('current-player-info');
        console.log('Current player info HTML:', currentPlayerInfo.innerHTML);

        // Check if the issue is in updateCurrentPlayerInfo method
        const currentPlayerIdFromBetting = gameState.betting ? gameState.betting.currentPlayer : null;
        console.log('Current player ID from betting (what updateCurrentPlayerInfo uses):', currentPlayerIdFromBetting);

        // This is where the bug manifests - should show current player, not waiting message
        expect(currentPlayerInfo.innerHTML).not.toContain('Waiting for game to start...');

        // Step 5: Check action buttons state
        const foldBtn = document.getElementById('fold-btn');
        const callBtn = document.getElementById('call-btn');
        const raiseBtn = document.getElementById('raise-btn');

        console.log('Action buttons state:');
        console.log('- Fold button disabled:', foldBtn.disabled);
        console.log('- Call button disabled:', callBtn.disabled);
        console.log('- Raise button disabled:', raiseBtn.disabled);

        // These should be enabled for the current player but are likely disabled due to the bug
        expect(foldBtn.disabled).toBe(false);
        expect(callBtn.disabled).toBe(false);
        expect(raiseBtn.disabled).toBe(false);
    });

    test('should show the exact structure of game state from real engine', () => {
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

        // Get the actual game state structure
        const gameState = uiManager.gameController.getGameState();

        console.log('Real game state structure:');
        console.log('- gameInfo.currentPlayer:', gameState.gameInfo?.currentPlayer);
        console.log('- betting.currentPlayer:', gameState.betting?.currentPlayer);
        console.log('- currentPlayer (root level):', gameState.currentPlayer);

        // Check what the updateCurrentPlayerInfo method actually receives
        const currentPlayerId = gameState.betting ? gameState.betting.currentPlayer : null;
        console.log('Current player ID from betting object:', currentPlayerId);

        // Test the updateCurrentPlayerInfo method directly
        uiManager.updateCurrentPlayerInfo(gameState, currentPlayerId);

        const currentPlayerInfo = document.getElementById('current-player-info');
        console.log('Current player info after update:', currentPlayerInfo.innerHTML);

        // This will help us understand exactly where the currentPlayer is in the real game state
        expect(gameState).toHaveProperty('gameInfo');
        expect(gameState).toHaveProperty('betting');
    });

    test('should test the updatePlayerActions method with real game state', () => {
        // Setup game
        const playerIdInput = document.getElementById('player-id');
        const playerNameInput = document.getElementById('player-name');

        playerIdInput.value = 'player1';
        playerNameInput.value = 'Alice';
        uiManager.handleAddPlayer();

        playerIdInput.value = 'player2';
        playerNameInput.value = 'Bob';
        uiManager.handleAddPlayer();

        uiManager.handleStartGame();

        // Get real game state
        const gameState = uiManager.gameController.getGameState();
        const gameStats = uiManager.gameController.getGameStats();

        console.log('Testing updatePlayerActions with real game state...');

        // Call updatePlayerActions directly
        uiManager.updatePlayerActions(gameState);

        // Check the results
        const currentPlayerInfo = document.getElementById('current-player-info');
        const foldBtn = document.getElementById('fold-btn');

        console.log('After updatePlayerActions:');
        console.log('- Current player info:', currentPlayerInfo.innerHTML);
        console.log('- Fold button disabled:', foldBtn.disabled);

        // This should reveal the exact issue
        if (currentPlayerInfo.innerHTML.includes('Waiting for game to start...')) {
            console.log('BUG REPRODUCED: Current player info shows waiting message');
            console.log('Game state betting object:', JSON.stringify(gameState.betting, null, 2));
        }
    });
});