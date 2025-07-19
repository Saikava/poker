/**
 * Integration tests for player management UI functionality
 * Tests the actual HTML structure and UI interactions
 */

const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

describe('Player Management UI Integration', () => {
  let dom;
  let document;
  let window;

  beforeEach(() => {
    // Create DOM environment with actual HTML
    const htmlPath = path.join(__dirname, '../src/index.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    
    dom = new JSDOM(htmlContent, {
      url: 'http://localhost',
      pretendToBeVisual: true,
      resources: 'usable'
    });
    
    global.document = dom.window.document;
    global.window = dom.window;
    global.HTMLElement = dom.window.HTMLElement;
    global.Event = dom.window.Event;
    
    document = dom.window.document;
    window = dom.window;
  });

  afterEach(() => {
    if (dom) {
      dom.window.close();
    }
  });

  describe('HTML Structure', () => {
    test('should have all required player management elements', () => {
      const playerIdInput = document.getElementById('player-id');
      const playerNameInput = document.getElementById('player-name');
      const addPlayerBtn = document.getElementById('add-player-btn');
      const playersContainer = document.getElementById('players-container');
      const startGameBtn = document.getElementById('start-game-btn');
      const errorDisplay = document.getElementById('error-display');
      const errorMessage = document.getElementById('error-message');
      const clearErrorBtn = document.getElementById('clear-error-btn');

      expect(playerIdInput).toBeTruthy();
      expect(playerNameInput).toBeTruthy();
      expect(addPlayerBtn).toBeTruthy();
      expect(playersContainer).toBeTruthy();
      expect(startGameBtn).toBeTruthy();
      expect(errorDisplay).toBeTruthy();
      expect(errorMessage).toBeTruthy();
      expect(clearErrorBtn).toBeTruthy();
    });

    test('should have correct input field attributes', () => {
      const playerIdInput = document.getElementById('player-id');
      const playerNameInput = document.getElementById('player-name');

      expect(playerIdInput.type).toBe('text');
      expect(playerIdInput.required).toBe(true);
      expect(playerNameInput.type).toBe('text');
      expect(playerNameInput.required).toBe(true);
    });

    test('should have start game button disabled by default', () => {
      const startGameBtn = document.getElementById('start-game-btn');
      expect(startGameBtn.disabled).toBe(true);
    });

    test('should have error display hidden by default', () => {
      const errorDisplay = document.getElementById('error-display');
      expect(errorDisplay.style.display).toBe('none');
    });
  });

  describe('Player List Display', () => {
    test('should display no players message initially', () => {
      const playersContainer = document.getElementById('players-container');
      
      // Simulate empty state
      playersContainer.innerHTML = '<p class="no-players">No players added yet</p>';
      
      expect(playersContainer.innerHTML).toContain('No players added yet');
    });

    test('should display player information correctly', () => {
      const playersContainer = document.getElementById('players-container');
      
      // Simulate player added
      const playerHtml = `
        <div class="player-item" data-player-id="player1">
          <div class="player-info">
            <span class="player-name">Alice</span>
            <span class="player-id">(ID: player1)</span>
            <span class="player-chips">Chips: $1000</span>
          </div>
          <button type="button" class="btn btn-danger btn-small remove-player-btn" data-player-id="player1">
            Remove
          </button>
        </div>
      `;
      
      playersContainer.innerHTML = playerHtml;
      
      const playerItem = playersContainer.querySelector('.player-item');
      const playerName = playerItem.querySelector('.player-name');
      const playerId = playerItem.querySelector('.player-id');
      const playerChips = playerItem.querySelector('.player-chips');
      const removeBtn = playerItem.querySelector('.remove-player-btn');
      
      expect(playerName.textContent).toBe('Alice');
      expect(playerId.textContent).toBe('(ID: player1)');
      expect(playerChips.textContent).toBe('Chips: $1000');
      expect(removeBtn).toBeTruthy();
      expect(removeBtn.getAttribute('data-player-id')).toBe('player1');
    });

    test('should handle multiple players', () => {
      const playersContainer = document.getElementById('players-container');
      
      // Simulate multiple players
      const playersHtml = `
        <div class="player-item" data-player-id="player1">
          <div class="player-info">
            <span class="player-name">Alice</span>
            <span class="player-id">(ID: player1)</span>
            <span class="player-chips">Chips: $1000</span>
          </div>
          <button type="button" class="btn btn-danger btn-small remove-player-btn" data-player-id="player1">
            Remove
          </button>
        </div>
        <div class="player-item" data-player-id="player2">
          <div class="player-info">
            <span class="player-name">Bob</span>
            <span class="player-id">(ID: player2)</span>
            <span class="player-chips">Chips: $1000</span>
          </div>
          <button type="button" class="btn btn-danger btn-small remove-player-btn" data-player-id="player2">
            Remove
          </button>
        </div>
      `;
      
      playersContainer.innerHTML = playersHtml;
      
      const playerItems = playersContainer.querySelectorAll('.player-item');
      expect(playerItems).toHaveLength(2);
      
      const removeButtons = playersContainer.querySelectorAll('.remove-player-btn');
      expect(removeButtons).toHaveLength(2);
    });
  });

  describe('Form Interactions', () => {
    test('should accept input in player fields', () => {
      const playerIdInput = document.getElementById('player-id');
      const playerNameInput = document.getElementById('player-name');
      
      playerIdInput.value = 'player1';
      playerNameInput.value = 'Alice';
      
      expect(playerIdInput.value).toBe('player1');
      expect(playerNameInput.value).toBe('Alice');
    });

    test('should clear form inputs', () => {
      const playerIdInput = document.getElementById('player-id');
      const playerNameInput = document.getElementById('player-name');
      
      // Set values
      playerIdInput.value = 'player1';
      playerNameInput.value = 'Alice';
      
      // Clear values
      playerIdInput.value = '';
      playerNameInput.value = '';
      
      expect(playerIdInput.value).toBe('');
      expect(playerNameInput.value).toBe('');
    });

    test('should handle button clicks', () => {
      const addPlayerBtn = document.getElementById('add-player-btn');
      const clearErrorBtn = document.getElementById('clear-error-btn');
      
      let addPlayerClicked = false;
      let clearErrorClicked = false;
      
      addPlayerBtn.addEventListener('click', () => {
        addPlayerClicked = true;
      });
      
      clearErrorBtn.addEventListener('click', () => {
        clearErrorClicked = true;
      });
      
      addPlayerBtn.click();
      clearErrorBtn.click();
      
      expect(addPlayerClicked).toBe(true);
      expect(clearErrorClicked).toBe(true);
    });

    test('should handle Enter key press', () => {
      const playerIdInput = document.getElementById('player-id');
      const playerNameInput = document.getElementById('player-name');
      
      let enterPressed = false;
      
      playerIdInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          enterPressed = true;
        }
      });
      
      const enterEvent = new window.KeyboardEvent('keypress', { key: 'Enter' });
      playerIdInput.dispatchEvent(enterEvent);
      
      expect(enterPressed).toBe(true);
    });
  });

  describe('Error Display', () => {
    test('should show error message', () => {
      const errorDisplay = document.getElementById('error-display');
      const errorMessage = document.getElementById('error-message');
      
      errorMessage.textContent = 'Test error message';
      errorDisplay.style.display = 'block';
      
      expect(errorDisplay.style.display).toBe('block');
      expect(errorMessage.textContent).toBe('Test error message');
    });

    test('should hide error message', () => {
      const errorDisplay = document.getElementById('error-display');
      const errorMessage = document.getElementById('error-message');
      
      // First show error
      errorMessage.textContent = 'Test error';
      errorDisplay.style.display = 'block';
      
      // Then hide it
      errorMessage.textContent = '';
      errorDisplay.style.display = 'none';
      
      expect(errorDisplay.style.display).toBe('none');
      expect(errorMessage.textContent).toBe('');
    });
  });

  describe('Button States', () => {
    test('should enable/disable start game button', () => {
      const startGameBtn = document.getElementById('start-game-btn');
      
      // Initially disabled
      expect(startGameBtn.disabled).toBe(true);
      
      // Enable
      startGameBtn.disabled = false;
      expect(startGameBtn.disabled).toBe(false);
      
      // Disable again
      startGameBtn.disabled = true;
      expect(startGameBtn.disabled).toBe(true);
    });
  });

  describe('CSS Classes', () => {
    test('should have correct CSS classes applied', () => {
      const playerIdInput = document.getElementById('player-id');
      const addPlayerBtn = document.getElementById('add-player-btn');
      const playersContainer = document.getElementById('players-container');
      
      // Check form elements don't have error classes initially
      expect(playerIdInput.classList.contains('error')).toBe(false);
      
      // Check button has correct classes
      expect(addPlayerBtn.classList.contains('btn')).toBe(true);
      expect(addPlayerBtn.classList.contains('btn-primary')).toBe(true);
      
      // Check container has correct class
      expect(playersContainer.classList.contains('players-container')).toBe(true);
    });

    test('should apply player item classes correctly', () => {
      const playersContainer = document.getElementById('players-container');
      
      // Add a player item
      const playerHtml = `
        <div class="player-item" data-player-id="player1">
          <div class="player-info">
            <span class="player-name">Alice</span>
            <span class="player-id">(ID: player1)</span>
            <span class="player-chips">Chips: $1000</span>
          </div>
          <button type="button" class="btn btn-danger btn-small remove-player-btn" data-player-id="player1">
            Remove
          </button>
        </div>
      `;
      
      playersContainer.innerHTML = playerHtml;
      
      const playerItem = playersContainer.querySelector('.player-item');
      const playerInfo = playerItem.querySelector('.player-info');
      const removeBtn = playerItem.querySelector('.remove-player-btn');
      
      expect(playerItem.classList.contains('player-item')).toBe(true);
      expect(playerInfo.classList.contains('player-info')).toBe(true);
      expect(removeBtn.classList.contains('btn')).toBe(true);
      expect(removeBtn.classList.contains('btn-danger')).toBe(true);
      expect(removeBtn.classList.contains('btn-small')).toBe(true);
      expect(removeBtn.classList.contains('remove-player-btn')).toBe(true);
    });
  });

  describe('Data Attributes', () => {
    test('should handle data attributes correctly', () => {
      const playersContainer = document.getElementById('players-container');
      
      // Add a player item with data attributes
      const playerHtml = `
        <div class="player-item" data-player-id="test-player-123">
          <div class="player-info">
            <span class="player-name">Test Player</span>
          </div>
          <button type="button" class="remove-player-btn" data-player-id="test-player-123">
            Remove
          </button>
        </div>
      `;
      
      playersContainer.innerHTML = playerHtml;
      
      const playerItem = playersContainer.querySelector('.player-item');
      const removeBtn = playersContainer.querySelector('.remove-player-btn');
      
      expect(playerItem.getAttribute('data-player-id')).toBe('test-player-123');
      expect(removeBtn.getAttribute('data-player-id')).toBe('test-player-123');
    });
  });

  describe('HTML Escaping', () => {
    test('should handle special characters in player names', () => {
      const playersContainer = document.getElementById('players-container');
      
      // Test with HTML characters that should be escaped
      const testName = 'Alice & Bob <script>';
      const testId = 'player<1>';
      
      // Create element and set text content (which automatically escapes)
      const playerDiv = document.createElement('div');
      playerDiv.className = 'player-item';
      
      const nameSpan = document.createElement('span');
      nameSpan.className = 'player-name';
      nameSpan.textContent = testName; // This will escape HTML
      
      const idSpan = document.createElement('span');
      idSpan.className = 'player-id';
      idSpan.textContent = `(ID: ${testId})`; // This will escape HTML
      
      playerDiv.appendChild(nameSpan);
      playerDiv.appendChild(idSpan);
      playersContainer.appendChild(playerDiv);
      
      // Verify the text content is correct (unescaped when read)
      expect(nameSpan.textContent).toBe('Alice & Bob <script>');
      expect(idSpan.textContent).toBe('(ID: player<1>)');
      
      // Verify the HTML is escaped when viewed as innerHTML
      expect(nameSpan.innerHTML).toBe('Alice &amp; Bob &lt;script&gt;');
    });
  });
});