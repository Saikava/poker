// Test fixtures and sample data for poker UI testing

/**
 * Sample card objects for testing
 */
const sampleCards = {
  aceSpades: { suit: 'spades', rank: 'A' },
  kingHearts: { suit: 'hearts', rank: 'K' },
  queenDiamonds: { suit: 'diamonds', rank: 'Q' },
  jackClubs: { suit: 'clubs', rank: 'J' },
  tenSpades: { suit: 'spades', rank: '10' }
};

/**
 * Sample community card scenarios
 */
const communityCardScenarios = {
  preflop: [],
  flop: [sampleCards.aceSpades, sampleCards.kingHearts, sampleCards.queenDiamonds],
  turn: [sampleCards.aceSpades, sampleCards.kingHearts, sampleCards.queenDiamonds, sampleCards.jackClubs],
  river: [sampleCards.aceSpades, sampleCards.kingHearts, sampleCards.queenDiamonds, sampleCards.jackClubs, sampleCards.tenSpades]
};

/**
 * Sample player configurations
 */
const samplePlayers = {
  twoPlayer: [
    { id: 'player1', name: 'Alice', chips: 1000 },
    { id: 'player2', name: 'Bob', chips: 1000 }
  ],
  threePlayer: [
    { id: 'player1', name: 'Alice', chips: 1000 },
    { id: 'player2', name: 'Bob', chips: 1000 },
    { id: 'player3', name: 'Charlie', chips: 1000 }
  ],
  fullTable: Array.from({ length: 8 }, (_, i) => ({
    id: `player${i + 1}`,
    name: `Player ${i + 1}`,
    chips: 1000
  }))
};

/**
 * Sample game states for different phases
 */
const gameStates = {
  waiting: {
    phase: 'waiting',
    players: [],
    communityCards: [],
    pot: 0,
    currentPlayer: null,
    handNumber: 0
  },
  preflop: {
    phase: 'preflop',
    players: samplePlayers.twoPlayer.map(p => ({
      ...p,
      cards: [sampleCards.aceSpades, sampleCards.kingHearts],
      bet: 0,
      folded: false
    })),
    communityCards: communityCardScenarios.preflop,
    pot: 30,
    currentPlayer: 'player1',
    handNumber: 1
  },
  flop: {
    phase: 'flop',
    players: samplePlayers.twoPlayer.map(p => ({
      ...p,
      cards: [sampleCards.aceSpades, sampleCards.kingHearts],
      bet: 0,
      folded: false
    })),
    communityCards: communityCardScenarios.flop,
    pot: 60,
    currentPlayer: 'player1',
    handNumber: 1
  }
};

/**
 * Sample error messages for testing error handling
 */
const sampleErrors = {
  invalidPlayer: 'Player ID already exists',
  insufficientPlayers: 'Need at least 2 players to start game',
  invalidAction: 'Action not available for current player',
  insufficientChips: 'Player does not have enough chips',
  gameNotStarted: 'Game has not been started yet'
};

/**
 * Sample action scenarios for testing
 */
const actionScenarios = {
  fold: { type: 'fold' },
  check: { type: 'check' },
  call: { type: 'call' },
  raise: { type: 'raise', amount: 100 },
  allIn: { type: 'raise', amount: 1000 }
};

module.exports = {
  sampleCards,
  communityCardScenarios,
  samplePlayers,
  gameStates,
  sampleErrors,
  actionScenarios
};