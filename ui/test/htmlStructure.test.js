// Tests for HTML structure and CSS class application
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

describe('HTML Structure and CSS Classes', () => {
  let dom;
  let document;
  let window;

  beforeAll(() => {
    // Load the HTML file
    const htmlPath = path.join(__dirname, '../src/index.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    
    // Create JSDOM instance
    dom = new JSDOM(htmlContent);
    document = dom.window.document;
    window = dom.window;
    
    // Make document and window available globally for tests
    global.document = document;
    global.window = window;
  });

  afterAll(() => {
    // Clean up global references
    delete global.document;
    delete global.window;
  });

  describe('Basic HTML Structure', () => {
    test('has proper DOCTYPE and html structure', () => {
      expect(document.doctype.name).toBe('html');
      expect(document.documentElement.tagName).toBe('HTML');
      expect(document.documentElement.getAttribute('lang')).toBe('en');
    });

    test('has proper head section with required meta tags', () => {
      const head = document.head;
      expect(head).toBeTruthy();
      
      const charset = head.querySelector('meta[charset]');
      expect(charset.getAttribute('charset')).toBe('UTF-8');
      
      const viewport = head.querySelector('meta[name="viewport"]');
      expect(viewport.getAttribute('content')).toBe('width=device-width, initial-scale=1.0');
      
      const title = head.querySelector('title');
      expect(title.textContent).toBe('Poker Engine UI');
      
      const cssLink = head.querySelector('link[rel="stylesheet"]');
      expect(cssLink.getAttribute('href')).toBe('styles.css');
    });

    test('has main app container', () => {
      const app = document.getElementById('app');
      expect(app).toBeTruthy();
      expect(app.tagName).toBe('DIV');
    });

    test('has header with title', () => {
      const header = document.querySelector('.app-header');
      expect(header).toBeTruthy();
      expect(header.tagName).toBe('HEADER');
      
      const title = header.querySelector('h1');
      expect(title).toBeTruthy();
      expect(title.textContent).toBe('Poker Engine UI');
    });

    test('has main content area', () => {
      const main = document.querySelector('.app-main');
      expect(main).toBeTruthy();
      expect(main.tagName).toBe('MAIN');
    });

    test('includes main.js script', () => {
      const script = document.querySelector('script[src="main.js"]');
      expect(script).toBeTruthy();
    });
  });

  describe('Player Management Section', () => {
    let playerManagement;

    beforeAll(() => {
      playerManagement = document.getElementById('player-management');
    });

    test('has player management section with correct structure', () => {
      expect(playerManagement).toBeTruthy();
      expect(playerManagement.tagName).toBe('SECTION');
      expect(playerManagement.classList.contains('player-management')).toBe(true);
      
      const heading = playerManagement.querySelector('h2');
      expect(heading.textContent).toBe('Player Management');
    });

    test('has add player form with required inputs', () => {
      const form = playerManagement.querySelector('.add-player-form');
      expect(form).toBeTruthy();
      
      const playerIdInput = document.getElementById('player-id');
      expect(playerIdInput).toBeTruthy();
      expect(playerIdInput.type).toBe('text');
      expect(playerIdInput.required).toBe(true);
      
      const playerNameInput = document.getElementById('player-name');
      expect(playerNameInput).toBeTruthy();
      expect(playerNameInput.type).toBe('text');
      expect(playerNameInput.required).toBe(true);
      
      const addButton = document.getElementById('add-player-btn');
      expect(addButton).toBeTruthy();
      expect(addButton.type).toBe('button');
      expect(addButton.classList.contains('btn')).toBe(true);
      expect(addButton.classList.contains('btn-primary')).toBe(true);
    });

    test('has player list container', () => {
      const playerList = document.getElementById('player-list');
      expect(playerList).toBeTruthy();
      
      const heading = playerList.querySelector('h3');
      expect(heading.textContent).toBe('Players');
      
      const container = document.getElementById('players-container');
      expect(container).toBeTruthy();
    });

    test('has proper form labels', () => {
      const playerIdLabel = playerManagement.querySelector('label[for="player-id"]');
      expect(playerIdLabel).toBeTruthy();
      expect(playerIdLabel.textContent).toBe('Player ID:');
      
      const playerNameLabel = playerManagement.querySelector('label[for="player-name"]');
      expect(playerNameLabel).toBeTruthy();
      expect(playerNameLabel.textContent).toBe('Player Name:');
    });
  });

  describe('Game Controls Section', () => {
    let gameControls;

    beforeAll(() => {
      gameControls = document.getElementById('game-controls');
    });

    test('has game controls section with correct structure', () => {
      expect(gameControls).toBeTruthy();
      expect(gameControls.tagName).toBe('SECTION');
      expect(gameControls.classList.contains('game-controls')).toBe(true);
      
      const heading = gameControls.querySelector('h2');
      expect(heading.textContent).toBe('Game Controls');
    });

    test('has control buttons with proper attributes', () => {
      const startGameBtn = document.getElementById('start-game-btn');
      expect(startGameBtn).toBeTruthy();
      expect(startGameBtn.type).toBe('button');
      expect(startGameBtn.classList.contains('btn')).toBe(true);
      expect(startGameBtn.classList.contains('btn-success')).toBe(true);
      expect(startGameBtn.disabled).toBe(true);
      expect(startGameBtn.textContent).toBe('Start Game');
      
      const newHandBtn = document.getElementById('new-hand-btn');
      expect(newHandBtn).toBeTruthy();
      expect(newHandBtn.type).toBe('button');
      expect(newHandBtn.classList.contains('btn')).toBe(true);
      expect(newHandBtn.classList.contains('btn-secondary')).toBe(true);
      expect(newHandBtn.disabled).toBe(true);
      expect(newHandBtn.textContent).toBe('New Hand');
    });

    test('has game info display elements', () => {
      const gameInfo = document.getElementById('game-info');
      expect(gameInfo).toBeTruthy();
      
      const gamePhase = document.getElementById('game-phase');
      expect(gamePhase).toBeTruthy();
      expect(gamePhase.textContent).toBe('Not Started');
      
      const handNumber = document.getElementById('hand-number');
      expect(handNumber).toBeTruthy();
      expect(handNumber.textContent).toBe('0');
      
      const currentPlayer = document.getElementById('current-player');
      expect(currentPlayer).toBeTruthy();
      expect(currentPlayer.textContent).toBe('None');
    });

    test('has proper info item structure', () => {
      const infoItems = gameControls.querySelectorAll('.info-item');
      expect(infoItems.length).toBe(3);
      
      infoItems.forEach(item => {
        const label = item.querySelector('.label');
        const value = item.querySelector('.value');
        expect(label).toBeTruthy();
        expect(value).toBeTruthy();
      });
    });
  });

  describe('Game State Section', () => {
    let gameState;

    beforeAll(() => {
      gameState = document.getElementById('game-state');
    });

    test('has game state section with correct structure', () => {
      expect(gameState).toBeTruthy();
      expect(gameState.tagName).toBe('SECTION');
      expect(gameState.classList.contains('game-state')).toBe(true);
      
      const heading = gameState.querySelector('h2');
      expect(heading.textContent).toBe('Game State');
    });

    test('has community cards display', () => {
      const communityCards = document.getElementById('community-cards');
      expect(communityCards).toBeTruthy();
      
      const heading = communityCards.querySelector('h3');
      expect(heading.textContent).toBe('Community Cards');
      
      const container = document.getElementById('community-cards-container');
      expect(container).toBeTruthy();
      expect(container.classList.contains('cards-container')).toBe(true);
    });

    test('has pot information display', () => {
      const potInfo = document.getElementById('pot-info');
      expect(potInfo).toBeTruthy();
      
      const heading = potInfo.querySelector('h3');
      expect(heading.textContent).toBe('Pot Information');
      
      const totalPot = document.getElementById('total-pot');
      expect(totalPot).toBeTruthy();
      expect(totalPot.textContent).toBe('$0');
      
      const sidePots = document.getElementById('side-pots');
      expect(sidePots).toBeTruthy();
      expect(sidePots.textContent).toBe('None');
    });

    test('has players state display', () => {
      const playersState = document.getElementById('players-state');
      expect(playersState).toBeTruthy();
      
      const heading = playersState.querySelector('h3');
      expect(heading.textContent).toBe('Players');
      
      const playersGrid = document.getElementById('players-grid');
      expect(playersGrid).toBeTruthy();
      expect(playersGrid.classList.contains('players-grid')).toBe(true);
    });
  });

  describe('Player Actions Section', () => {
    let playerActions;

    beforeAll(() => {
      playerActions = document.getElementById('player-actions');
    });

    test('has player actions section with correct structure', () => {
      expect(playerActions).toBeTruthy();
      expect(playerActions.tagName).toBe('SECTION');
      expect(playerActions.classList.contains('player-actions')).toBe(true);
      
      const heading = playerActions.querySelector('h2');
      expect(heading.textContent).toBe('Player Actions');
    });

    test('has current player info display', () => {
      const currentPlayerInfo = document.getElementById('current-player-info');
      expect(currentPlayerInfo).toBeTruthy();
      expect(currentPlayerInfo.textContent).toContain('Waiting for game to start...');
    });

    test('has action buttons with proper classes and states', () => {
      const foldBtn = document.getElementById('fold-btn');
      expect(foldBtn).toBeTruthy();
      expect(foldBtn.classList.contains('btn')).toBe(true);
      expect(foldBtn.classList.contains('btn-danger')).toBe(true);
      expect(foldBtn.classList.contains('action-btn')).toBe(true);
      expect(foldBtn.disabled).toBe(true);
      expect(foldBtn.textContent).toBe('Fold');
      
      const checkBtn = document.getElementById('check-btn');
      expect(checkBtn).toBeTruthy();
      expect(checkBtn.classList.contains('btn')).toBe(true);
      expect(checkBtn.classList.contains('btn-secondary')).toBe(true);
      expect(checkBtn.classList.contains('action-btn')).toBe(true);
      expect(checkBtn.disabled).toBe(true);
      expect(checkBtn.textContent).toBe('Check');
      
      const callBtn = document.getElementById('call-btn');
      expect(callBtn).toBeTruthy();
      expect(callBtn.classList.contains('btn')).toBe(true);
      expect(callBtn.classList.contains('btn-primary')).toBe(true);
      expect(callBtn.classList.contains('action-btn')).toBe(true);
      expect(callBtn.disabled).toBe(true);
      expect(callBtn.textContent).toBe('Call');
      
      const raiseBtn = document.getElementById('raise-btn');
      expect(raiseBtn).toBeTruthy();
      expect(raiseBtn.classList.contains('btn')).toBe(true);
      expect(raiseBtn.classList.contains('btn-warning')).toBe(true);
      expect(raiseBtn.classList.contains('action-btn')).toBe(true);
      expect(raiseBtn.disabled).toBe(true);
      expect(raiseBtn.textContent).toBe('Raise');
    });

    test('has raise controls with proper structure', () => {
      const raiseControls = document.getElementById('raise-controls');
      expect(raiseControls).toBeTruthy();
      expect(raiseControls.style.display).toBe('none');
      
      const raiseAmount = document.getElementById('raise-amount');
      expect(raiseAmount).toBeTruthy();
      expect(raiseAmount.type).toBe('number');
      expect(raiseAmount.min).toBe('0');
      expect(raiseAmount.step).toBe('1');
      
      const confirmRaiseBtn = document.getElementById('confirm-raise-btn');
      expect(confirmRaiseBtn).toBeTruthy();
      expect(confirmRaiseBtn.classList.contains('btn')).toBe(true);
      expect(confirmRaiseBtn.classList.contains('btn-warning')).toBe(true);
      
      const cancelRaiseBtn = document.getElementById('cancel-raise-btn');
      expect(cancelRaiseBtn).toBeTruthy();
      expect(cancelRaiseBtn.classList.contains('btn')).toBe(true);
      expect(cancelRaiseBtn.classList.contains('btn-secondary')).toBe(true);
    });
  });

  describe('Error Display Section', () => {
    let errorDisplay;

    beforeAll(() => {
      errorDisplay = document.getElementById('error-display');
    });

    test('has error display section with correct structure', () => {
      expect(errorDisplay).toBeTruthy();
      expect(errorDisplay.tagName).toBe('SECTION');
      expect(errorDisplay.classList.contains('error-display')).toBe(true);
      expect(errorDisplay.style.display).toBe('none');
      
      const heading = errorDisplay.querySelector('h2');
      expect(heading.textContent).toBe('Error');
    });

    test('has error message container and clear button', () => {
      const errorMessage = document.getElementById('error-message');
      expect(errorMessage).toBeTruthy();
      expect(errorMessage.classList.contains('error-message')).toBe(true);
      
      const clearErrorBtn = document.getElementById('clear-error-btn');
      expect(clearErrorBtn).toBeTruthy();
      expect(clearErrorBtn.classList.contains('btn')).toBe(true);
      expect(clearErrorBtn.classList.contains('btn-secondary')).toBe(true);
      expect(clearErrorBtn.textContent).toBe('Clear Error');
    });
  });

  describe('Hand Results Section', () => {
    let handResults;

    beforeAll(() => {
      handResults = document.getElementById('hand-results');
    });

    test('has hand results section with correct structure', () => {
      expect(handResults).toBeTruthy();
      expect(handResults.tagName).toBe('SECTION');
      expect(handResults.classList.contains('hand-results')).toBe(true);
      expect(handResults.style.display).toBe('none');
      
      const heading = handResults.querySelector('h2');
      expect(heading.textContent).toBe('Hand Results');
    });

    test('has results content container', () => {
      const resultsContent = document.getElementById('results-content');
      expect(resultsContent).toBeTruthy();
      expect(resultsContent.classList.contains('results-content')).toBe(true);
    });
  });

  describe('CSS Classes and Styling Structure', () => {
    test('has proper button classes applied', () => {
      const buttons = document.querySelectorAll('.btn');
      expect(buttons.length).toBeGreaterThan(0);
      
      // Check specific button types
      const primaryBtns = document.querySelectorAll('.btn-primary');
      expect(primaryBtns.length).toBeGreaterThan(0);
      
      const secondaryBtns = document.querySelectorAll('.btn-secondary');
      expect(secondaryBtns.length).toBeGreaterThan(0);
      
      const successBtns = document.querySelectorAll('.btn-success');
      expect(successBtns.length).toBeGreaterThan(0);
      
      const warningBtns = document.querySelectorAll('.btn-warning');
      expect(warningBtns.length).toBeGreaterThan(0);
      
      const dangerBtns = document.querySelectorAll('.btn-danger');
      expect(dangerBtns.length).toBeGreaterThan(0);
    });

    test('has proper form structure classes', () => {
      const formGroups = document.querySelectorAll('.form-group');
      expect(formGroups.length).toBeGreaterThan(0);
      
      formGroups.forEach(group => {
        const label = group.querySelector('label');
        const input = group.querySelector('input');
        expect(label).toBeTruthy();
        expect(input).toBeTruthy();
      });
    });

    test('has proper info item structure classes', () => {
      const infoItems = document.querySelectorAll('.info-item');
      expect(infoItems.length).toBeGreaterThan(0);
      
      infoItems.forEach(item => {
        const label = item.querySelector('.label');
        const value = item.querySelector('.value');
        expect(label).toBeTruthy();
        expect(value).toBeTruthy();
      });
    });

    test('has proper container classes', () => {
      expect(document.querySelector('.app-header')).toBeTruthy();
      expect(document.querySelector('.app-main')).toBeTruthy();
      expect(document.querySelector('.cards-container')).toBeTruthy();
      expect(document.querySelector('.players-grid')).toBeTruthy();
      expect(document.querySelector('.action-buttons')).toBeTruthy();
      expect(document.querySelector('.control-buttons')).toBeTruthy();
    });

    test('sections have proper semantic structure', () => {
      const sections = document.querySelectorAll('section');
      expect(sections.length).toBe(6); // player-management, game-controls, game-state, player-actions, error-display, hand-results
      
      sections.forEach(section => {
        const heading = section.querySelector('h2');
        expect(heading).toBeTruthy();
        expect(section.id).toBeTruthy();
      });
    });
  });

  describe('Accessibility and Semantic HTML', () => {
    test('has proper form labels associated with inputs', () => {
      const playerIdLabel = document.querySelector('label[for="player-id"]');
      const playerIdInput = document.getElementById('player-id');
      expect(playerIdLabel).toBeTruthy();
      expect(playerIdInput).toBeTruthy();
      
      const playerNameLabel = document.querySelector('label[for="player-name"]');
      const playerNameInput = document.getElementById('player-name');
      expect(playerNameLabel).toBeTruthy();
      expect(playerNameInput).toBeTruthy();
      
      const raiseAmountLabel = document.querySelector('label[for="raise-amount"]');
      const raiseAmountInput = document.getElementById('raise-amount');
      expect(raiseAmountLabel).toBeTruthy();
      expect(raiseAmountInput).toBeTruthy();
    });

    test('uses semantic HTML elements', () => {
      expect(document.querySelector('header')).toBeTruthy();
      expect(document.querySelector('main')).toBeTruthy();
      expect(document.querySelectorAll('section').length).toBeGreaterThan(0);
      expect(document.querySelectorAll('h1, h2, h3').length).toBeGreaterThan(0);
    });

    test('has proper button types', () => {
      const buttons = document.querySelectorAll('button');
      buttons.forEach(button => {
        expect(button.type).toBe('button');
      });
    });

    test('required form fields are marked as required', () => {
      const playerIdInput = document.getElementById('player-id');
      const playerNameInput = document.getElementById('player-name');
      
      expect(playerIdInput.required).toBe(true);
      expect(playerNameInput.required).toBe(true);
    });
  });
});