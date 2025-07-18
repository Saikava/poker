const Player = require('../../src/models/Player');

describe('Player', () => {
  let player;

  beforeEach(() => {
    player = new Player('player1', 'Alice', 1000, 0);
  });

  describe('constructor', () => {
    test('should create player with correct initial values', () => {
      expect(player.id).toBe('player1');
      expect(player.name).toBe('Alice');
      expect(player.chips).toBe(1000);
      expect(player.position).toBe(0);
      expect(player.status).toBe('active');
      expect(player.currentBet).toBe(0);
      expect(player.totalBet).toBe(0);
      expect(player.cards).toEqual([]);
    });

    test('should use default position if not provided', () => {
      const newPlayer = new Player('player2', 'Bob', 500);
      expect(newPlayer.position).toBe(0);
    });
  });

  describe('bet', () => {
    test('should place a valid bet', () => {
      const result = player.bet(100);
      
      expect(result).toBe(true);
      expect(player.chips).toBe(900);
      expect(player.currentBet).toBe(100);
      expect(player.totalBet).toBe(100);
      expect(player.status).toBe('active');
    });

    test('should go all-in when betting all chips', () => {
      player.bet(1000);
      
      expect(player.chips).toBe(0);
      expect(player.status).toBe('all-in');
      expect(player.currentBet).toBe(1000);
    });

    test('should throw error for negative bet amount', () => {
      expect(() => player.bet(-50)).toThrow('Bet amount must be positive');
    });

    test('should throw error for zero bet amount', () => {
      expect(() => player.bet(0)).toThrow('Bet amount must be positive');
    });

    test('should throw error for insufficient chips', () => {
      expect(() => player.bet(1500)).toThrow('Insufficient chips for bet');
    });

    test('should accumulate multiple bets', () => {
      player.bet(100);
      player.bet(200);
      
      expect(player.chips).toBe(700);
      expect(player.currentBet).toBe(300);
      expect(player.totalBet).toBe(300);
    });
  });

  describe('fold', () => {
    test('should fold successfully when active', () => {
      player.fold();
      
      expect(player.status).toBe('folded');
      expect(player.cards).toEqual([]);
    });

    test('should throw error when already folded', () => {
      player.fold();
      expect(() => player.fold()).toThrow('Player cannot fold in current status');
    });

    test('should throw error when eliminated', () => {
      player.eliminate();
      expect(() => player.fold()).toThrow('Player cannot fold in current status');
    });

    test('should clear cards when folding', () => {
      player.addCards([{ suit: 'hearts', rank: 'A' }, { suit: 'spades', rank: 'K' }]);
      player.fold();
      
      expect(player.cards).toEqual([]);
    });
  });

  describe('check', () => {
    test('should check successfully when active', () => {
      const result = player.check();
      expect(result).toBe(true);
    });

    test('should throw error when not active', () => {
      player.fold();
      expect(() => player.check()).toThrow('Player cannot check in current status');
    });
  });

  describe('call', () => {
    test('should call with valid amount', () => {
      const result = player.call(100);
      
      expect(result).toBe(true);
      expect(player.chips).toBe(900);
      expect(player.currentBet).toBe(100);
    });

    test('should check when call amount is zero', () => {
      const result = player.call(0);
      
      expect(result).toBe(true);
      expect(player.chips).toBe(1000);
      expect(player.currentBet).toBe(0);
    });

    test('should go all-in when call amount exceeds chips', () => {
      const result = player.call(1500);
      
      expect(result).toBe(true);
      expect(player.chips).toBe(0);
      expect(player.currentBet).toBe(1000);
      expect(player.status).toBe('all-in');
    });
  });

  describe('raise', () => {
    test('should raise with valid amount', () => {
      const result = player.raise(200, 100);
      
      expect(result).toBe(true);
      expect(player.chips).toBe(700);
      expect(player.currentBet).toBe(300);
    });

    test('should raise without call amount', () => {
      const result = player.raise(150);
      
      expect(result).toBe(true);
      expect(player.chips).toBe(850);
      expect(player.currentBet).toBe(150);
    });

    test('should throw error for negative raise amount', () => {
      expect(() => player.raise(-50)).toThrow('Raise amount must be positive');
    });

    test('should throw error for zero raise amount', () => {
      expect(() => player.raise(0)).toThrow('Raise amount must be positive');
    });
  });

  describe('resetForNewHand', () => {
    test('should reset player state for new hand', () => {
      player.bet(100);
      player.addCards([{ suit: 'hearts', rank: 'A' }]);
      
      player.resetForNewHand();
      
      expect(player.cards).toEqual([]);
      expect(player.currentBet).toBe(0);
      expect(player.totalBet).toBe(0);
      expect(player.status).toBe('active');
    });

    test('should reset folded status to active', () => {
      player.fold();
      player.resetForNewHand();
      
      expect(player.status).toBe('active');
    });

    test('should not reset eliminated status', () => {
      player.eliminate();
      player.resetForNewHand();
      
      expect(player.status).toBe('eliminated');
    });

    test('should not reset all-in status', () => {
      player.bet(1000); // Go all-in
      player.resetForNewHand();
      
      expect(player.status).toBe('all-in');
    });
  });

  describe('addCards', () => {
    test('should add cards to player hand', () => {
      const cards = [
        { suit: 'hearts', rank: 'A' },
        { suit: 'spades', rank: 'K' }
      ];
      
      player.addCards(cards);
      
      expect(player.cards).toEqual(cards);
    });

    test('should append to existing cards', () => {
      const firstCards = [{ suit: 'hearts', rank: 'A' }];
      const secondCards = [{ suit: 'spades', rank: 'K' }];
      
      player.addCards(firstCards);
      player.addCards(secondCards);
      
      expect(player.cards).toEqual([...firstCards, ...secondCards]);
    });
  });

  describe('canPerformAction', () => {
    test('should allow fold for active player', () => {
      expect(player.canPerformAction('fold')).toBe(true);
    });

    test('should allow check when no call amount', () => {
      expect(player.canPerformAction('check', 0)).toBe(true);
    });

    test('should not allow check when call amount exists', () => {
      expect(player.canPerformAction('check', 100)).toBe(false);
    });

    test('should allow call when player has sufficient chips', () => {
      expect(player.canPerformAction('call', 100)).toBe(true);
    });

    test('should allow call even with insufficient chips (all-in)', () => {
      expect(player.canPerformAction('call', 1500)).toBe(true);
    });

    test('should allow raise when player has sufficient chips', () => {
      expect(player.canPerformAction('raise', 100, 50)).toBe(true);
    });

    test('should not allow raise when insufficient chips', () => {
      expect(player.canPerformAction('raise', 500, 600)).toBe(false);
    });

    test('should not allow actions for folded player', () => {
      player.fold();
      
      expect(player.canPerformAction('check')).toBe(false);
      expect(player.canPerformAction('call', 100)).toBe(false);
      expect(player.canPerformAction('raise', 100, 50)).toBe(false);
    });

    test('should not allow actions for eliminated player', () => {
      player.eliminate();
      
      expect(player.canPerformAction('fold')).toBe(false);
      expect(player.canPerformAction('check')).toBe(false);
      expect(player.canPerformAction('call', 100)).toBe(false);
      expect(player.canPerformAction('raise', 100, 50)).toBe(false);
    });
  });

  describe('getAvailableActions', () => {
    test('should return all actions for active player with chips', () => {
      const actions = player.getAvailableActions(100, 50);
      
      expect(actions).toContain('fold');
      expect(actions).toContain('call');
      expect(actions).toContain('raise');
      expect(actions).not.toContain('check');
    });

    test('should include check when no call amount', () => {
      const actions = player.getAvailableActions(0, 50);
      
      expect(actions).toContain('fold');
      expect(actions).toContain('check');
      expect(actions).toContain('raise');
      expect(actions).not.toContain('call');
    });

    test('should return empty array for eliminated player', () => {
      player.eliminate();
      const actions = player.getAvailableActions(100, 50);
      
      expect(actions).toEqual([]);
    });

    test('should only return fold for all-in player', () => {
      player.bet(1000); // Go all-in
      const actions = player.getAvailableActions(100, 50);
      
      expect(actions).toEqual(['fold']);
    });
  });

  describe('eliminate', () => {
    test('should eliminate player correctly', () => {
      player.addCards([{ suit: 'hearts', rank: 'A' }]);
      player.eliminate();
      
      expect(player.status).toBe('eliminated');
      expect(player.chips).toBe(0);
      expect(player.cards).toEqual([]);
    });
  });

  describe('getState', () => {
    test('should return complete player state', () => {
      player.bet(100);
      player.addCards([{ suit: 'hearts', rank: 'A' }]);
      
      const state = player.getState();
      
      expect(state).toEqual({
        id: 'player1',
        name: 'Alice',
        chips: 900,
        cards: [{ suit: 'hearts', rank: 'A' }],
        position: 0,
        status: 'active',
        currentBet: 100,
        totalBet: 100
      });
    });

    test('should return copy of cards array', () => {
      const cards = [{ suit: 'hearts', rank: 'A' }];
      player.addCards(cards);
      
      const state = player.getState();
      state.cards.push({ suit: 'spades', rank: 'K' });
      
      expect(player.cards).toEqual(cards);
    });
  });
});