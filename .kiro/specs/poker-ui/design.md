# Design Document

## Overview

The poker UI will be a simple, single-page web application that provides a testing interface for the existing Texas Hold'em poker engine. The design prioritizes functionality over aesthetics, focusing on providing clear visibility into game state and easy access to all poker engine features. The UI will be built using vanilla HTML, CSS, and JavaScript to minimize dependencies and complexity.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────┐
│           Web Browser                   │
│  ┌─────────────────┐ ┌─────────────────┐│
│  │   HTML/CSS/JS   │ │  Poker Engine   ││
│  │      UI         │◄┤   (Bundled)    ││
│  └─────────────────┘ └─────────────────┘│
└─────────────────────────────────────────┘
```

The application will be a client-side only solution:
- **Frontend**: Simple HTML page with CSS styling and vanilla JavaScript
- **Poker Engine**: Existing poker engine bundled for browser use
- **No Backend**: Direct integration eliminates server complexity
- **Static Hosting**: Can be served from any static file server

### Technology Stack

- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6+)
- **Module Bundling**: Webpack or similar to bundle poker engine for browser
- **Testing**: Jest with jsdom for CLI-based UI testing
- **No external UI frameworks**: Keep it simple and dependency-free

## Components and Interfaces

### Core Components

#### 1. Game Controller (`gameController.js`)
- Creates and manages poker engine instance in browser
- Thin wrapper that calls poker engine methods directly
- Passes all user inputs to poker engine without processing
- Returns poker engine responses directly to UI

#### 2. UI Manager (`uiManager.js`)
- Handles all DOM manipulation and display updates
- Captures user interactions and passes them to game controller
- Displays game state and errors exactly as returned by poker engine
- No validation, processing, or business logic - pure UI display

### Frontend Components

#### 1. Game State Display
- **Players Panel**: Shows all players with their cards, chips, and status
- **Community Cards**: Displays board cards as they're dealt
- **Pot Information**: Shows total pot and side pots
- **Game Info**: Current phase, hand number, current player

#### 2. Player Management
- **Add Player Form**: Input fields for player ID and name
- **Player List**: Shows added players with remove buttons
- **Game Controls**: Start game and new hand buttons

#### 3. Action Interface
- **Current Player Highlight**: Visual indication of whose turn it is
- **Action Buttons**: Fold, Check, Call, Raise buttons based on available actions
- **Raise Input**: Amount input field for raise actions
- **Action History**: Log of recent actions taken

#### 4. Error Display
- **Error Messages**: Clear display of validation errors and game state issues
- **Debug Information**: Optional detailed error information for testing

### Data Models

The UI will use the existing data models from the poker engine without modification:

#### Poker Engine Data Models
- **Game State**: Use `pokerEngine.getGameState()` response directly
- **Player State**: Use `pokerEngine.getPlayerState(playerId)` response directly  
- **Player Actions**: Use existing action format expected by `pokerEngine.playerAction()`
- **Error Responses**: Use existing error response format from poker engine
- **Card Objects**: Use existing Card model from poker engine
- **Player Objects**: Use existing Player model from poker engine

#### No Custom Data Models
- UI will not define any custom data structures
- All data will be consumed directly from poker engine responses
- UI will pass user inputs in the format expected by poker engine methods

## Error Handling

### UI Error Display
- Display error messages returned by the poker engine
- Show errors prominently in the UI without any processing or validation
- Clear error messages when new actions are taken
- Pass all user inputs directly to poker engine without frontend validation

### Error Display Strategy
- Use the existing poker engine error response format
- Display error messages exactly as returned by the engine
- No frontend logic for error handling - just display what the engine provides
- Simple error clearing mechanism when user takes new actions

## Testing Strategy

### Test-Driven Development Approach
Since the UI needs to be testable via CLI without browser access, we'll implement a comprehensive testing strategy:

#### 1. Unit Testing with jsdom
- **DOM Testing**: Use jsdom to simulate browser environment in Node.js
- **UI Component Testing**: Test individual UI components and their behavior
- **Game Controller Testing**: Test game logic integration and state management
- **Event Handling Testing**: Test user interactions and game events

#### 2. Integration Testing
- **End-to-End Game Flow**: Test complete game scenarios from start to finish
- **Player Action Sequences**: Test various action combinations and game states
- **Error Handling**: Test error scenarios and UI error display
- **State Consistency**: Verify UI state matches poker engine state

#### 3. Visual Regression Testing
- **HTML Structure Testing**: Verify correct DOM structure generation
- **CSS Class Application**: Test proper styling class application
- **Content Validation**: Verify correct display of game information

#### 4. Manual Testing Support
- **Test Scenarios**: Predefined test scenarios for manual verification
- **Debug Mode**: Special UI mode that shows additional debugging information
- **State Inspector**: Tool to examine current game state in detail

### Testing Tools and Setup
- **Jest**: Primary testing framework (already in project)
- **jsdom**: Browser environment simulation for DOM testing
- **Testing Library**: Utilities for DOM testing and user interaction simulation
- **Custom Test Helpers**: Poker-specific testing utilities

### Test Structure
```
test/ui/
├── components/           # Individual UI component tests
├── integration/          # Full game flow tests  
├── helpers/             # Test utilities and helpers
├── fixtures/            # Test data and game states
└── setup.js             # Test environment configuration
```

## Implementation Considerations

### Simplicity Focus
- Keep code simple and readable
- Minimal dependencies - use vanilla JavaScript where possible
- Clear separation between UI logic and game logic
- Direct integration with poker engine without unnecessary abstractions

### Usability
- Clear visual hierarchy with important information prominent
- Consistent button placement and styling
- Simple, functional design that prioritizes testing capabilities
- Easy access to all poker engine features

## File Structure

```
ui/
├── src/
│   ├── index.html         # Main UI page
│   ├── styles.css         # UI styling
│   ├── gameController.js  # Game logic controller
│   ├── uiManager.js       # UI management and DOM manipulation
│   └── main.js            # Application entry point
├── test/
│   ├── ui/                # UI-specific tests
│   │   ├── components/    # Component tests
│   │   ├── integration/   # Integration tests
│   │   ├── helpers/       # Test utilities
│   │   └── setup.js       # Test environment setup
│   └── fixtures/          # Test data
├── dist/                  # Built/bundled files
├── webpack.config.js      # Webpack configuration for bundling
├── package.json           # Dependencies and scripts
└── README.md              # Setup and usage instructions
```

## Module Integration

### Poker Engine Integration
Since the poker engine is already built as Node.js modules, we need to bundle it for browser use:

#### Webpack Configuration
- Bundle poker engine modules for browser compatibility
- Handle Node.js specific dependencies (if any)
- Create development and production builds
- Enable source maps for debugging

#### Module Exports
- Export poker engine as global variable for browser access
- Maintain existing API interface
- Handle any Node.js specific code (file system, etc.)

### Browser Compatibility
- Use ES6+ features with appropriate polyfills if needed
- Ensure compatibility with modern browsers
- Handle module loading and dependency resolution
- Provide fallbacks for unsupported features