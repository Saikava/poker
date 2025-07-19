# Poker Engine UI

A simple web-based user interface for testing the Texas Hold'em poker engine. This UI provides a functional interface to interact with the poker engine without requiring CLI commands, making it easy to test game functionality through a web browser.

## Features

- **Player Management**: Add and remove players with ID and name
- **Game Controls**: Start games and new hands with visual feedback
- **Game State Display**: View community cards, pot information, and player states
- **Player Actions**: Control all players and perform actions (fold, check, call, raise)
- **Error Handling**: Clear error messages and validation feedback
- **Real-time Updates**: Live display of game state changes
- **Debug & Performance Tools**: Access to poker engine performance stats and optimization
- **Comprehensive Testing**: Full test coverage with automated testing

## Quick Start

### Prerequisites

- Node.js (version 14 or higher)
- npm (comes with Node.js)

### Installation

1. Clone the repository and navigate to the UI directory:
```bash
cd ui
```

2. Install dependencies:
```bash
npm install
```

3. Build the application:
```bash
npm run build
```

4. Open the built application:
   - Open `dist/index.html` in your web browser
   - Or use the development server: `npm start`

## Usage

### Development Server

For development with hot reloading:

```bash
npm start
```

This will start a development server at `http://localhost:8080` and automatically open your browser.

### Production Build

To create an optimized production build:

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Testing the Application

1. **Add Players**: 
   - Enter a unique Player ID and Player Name
   - Click "Add Player" to add them to the game
   - Add at least 2 players to start a game

2. **Start Game**:
   - Once you have enough players, the "Start Game" button will be enabled
   - Click to initialize the poker game

3. **Play the Game**:
   - The current player will be highlighted
   - Available actions (fold, check, call, raise) will be enabled
   - Click action buttons to make moves for the current player
   - Game state updates automatically after each action

4. **View Game Information**:
   - Community cards are displayed as they're dealt
   - Pot information shows total and side pots
   - Player states show cards, chips, and current bets
   - Hand results are displayed when hands complete

5. **Debug and Performance Tools**:
   - Click "Show Performance Stats" to view detailed engine statistics
   - Use "Optimize Engine" to improve performance during long testing sessions
   - "Show Game Config" displays current configuration and game statistics
   - Debug information helps with troubleshooting and development

## Available Scripts

### Development
- `npm start` - Start development server and open browser
- `npm run dev` - Build in development mode with watch
- `npm run serve` - Start development server without opening browser

### Production
- `npm run build` - Create optimized production build
- `npm run preview` - Preview production build

### Testing
- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode

### Utilities
- `npm run clean` - Remove build directory
- `npm run analyze` - Analyze bundle size (requires build first)

## Project Structure

```
ui/
├── src/                    # Source files
│   ├── index.html         # Main HTML template
│   ├── main.js           # Application entry point
│   ├── gameController.js  # Game logic controller
│   ├── uiManager.js      # UI management and DOM manipulation
│   └── styles.css        # Application styles
├── test/                  # Test files
│   ├── setup.js          # Test environment setup
│   ├── *.test.js         # Individual test files
│   └── fixtures/         # Test data and helpers
├── dist/                  # Built files (generated)
├── webpack.config.js      # Build configuration
├── package.json          # Dependencies and scripts
└── BUILD.md              # Detailed build documentation
```

## Architecture

The poker UI is built as a single-page application with the following components:

- **Game Controller**: Thin wrapper around the poker engine for browser compatibility
- **UI Manager**: Handles all DOM manipulation and user interactions
- **Poker Engine Integration**: Direct integration with existing poker engine modules

### Key Design Principles

- **Simplicity**: Minimal dependencies, vanilla JavaScript
- **Direct Integration**: No unnecessary abstractions over the poker engine
- **Testing Focus**: Comprehensive test coverage for reliability
- **Browser Compatibility**: Works in modern browsers without additional setup

## Testing

The application includes comprehensive test coverage:

- **Unit Tests**: Individual component testing
- **Integration Tests**: Full game flow testing
- **DOM Tests**: HTML structure and interaction testing
- **Error Handling Tests**: Validation and error display testing

Run tests with:
```bash
npm test
```

For continuous testing during development:
```bash
npm run test:watch
```

## Browser Compatibility

The application works in modern browsers that support:
- ES6+ JavaScript features
- DOM APIs
- CSS3 features used in styling

Tested browsers:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Troubleshooting

### Common Issues

**Application won't load:**
- Check browser console for JavaScript errors
- Verify all files exist in `dist/` directory after building
- Try rebuilding: `npm run clean && npm run build`

**Players can't be added:**
- Check that both Player ID and Player Name are provided
- Ensure Player IDs are unique
- Check browser console for poker engine errors

**Game won't start:**
- Verify you have at least 2 players added
- Check that players have sufficient chips
- Look for error messages in the UI error display

**Actions don't work:**
- Ensure it's the correct player's turn (highlighted player)
- Check that the action is available (button should be enabled)
- Verify game is in an active state

### Debug Mode

For debugging:
1. Use development build: `npm run build:dev`
2. Open browser developer tools
3. Check console for detailed error messages
4. Use source maps to debug original source files

### Performance Issues

If the application is slow:
1. Check bundle size: `npm run analyze`
2. Use production build for better performance
3. Check browser developer tools for performance bottlenecks

## Development

### Adding New Features

1. Implement feature in appropriate source file (`gameController.js` or `uiManager.js`)
2. Add corresponding tests in `test/` directory
3. Update UI elements in `index.html` and `styles.css` if needed
4. Run tests to ensure nothing breaks: `npm test`
5. Test manually in browser

### Code Style

- Use ES6+ JavaScript features
- Follow existing code patterns and naming conventions
- Add JSDoc comments for public methods
- Keep functions focused and single-purpose
- Handle errors gracefully with user-friendly messages

### Testing Guidelines

- Write tests for new functionality
- Test both success and error cases
- Use descriptive test names
- Mock external dependencies when appropriate
- Maintain high test coverage

## Limitations and Known Issues

### Current Limitations

1. **Single Game Instance**: Only supports one game at a time
2. **No Persistence**: Game state is lost on page refresh
3. **Manual Player Control**: All players are controlled by the same user
4. **Basic Styling**: Functional but minimal visual design
5. **No Multiplayer**: Designed for testing, not real multiplayer games

### Known Issues

1. **Raise Validation**: Some edge cases in raise amount validation may not be caught
2. **Side Pot Display**: Complex side pot scenarios may not display perfectly
3. **Mobile Responsiveness**: Not optimized for mobile devices
4. **Accessibility**: Limited accessibility features implemented

### Future Improvements

- Add game state persistence
- Improve mobile responsiveness
- Add more sophisticated styling
- Implement accessibility features
- Add game replay functionality
- Support for multiple simultaneous games

## Contributing

This is a testing tool for the poker engine. When contributing:

1. Ensure all tests pass: `npm test`
2. Test manually in browser
3. Follow existing code patterns
4. Add tests for new functionality
5. Update documentation as needed

## License

This project uses the same license as the main poker engine project.

## Support

For issues or questions:
1. Check this README for common solutions
2. Review the BUILD.md file for build-specific issues
3. Check browser console for error messages
4. Run tests to identify specific problems: `npm test`