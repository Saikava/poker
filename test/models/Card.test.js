const Card = require('../../src/models/Card');

describe('Card', () => {
  describe('constructor', () => {
    test('should create a card with correct suit, rank, and value', () => {
      const card = new Card('hearts', 'A');
      
      expect(card.suit).toBe('hearts');
      expect(card.rank).toBe('A');
      expect(card.value).toBe(14);
    });

    test('should calculate correct values for all ranks', () => {
      const testCases = [
        { rank: '2', expectedValue: 2 },
        { rank: '3', expectedValue: 3 },
        { rank: '4', expectedValue: 4 },
        { rank: '5', expectedValue: 5 },
        { rank: '6', expectedValue: 6 },
        { rank: '7', expectedValue: 7 },
        { rank: '8', expectedValue: 8 },
        { rank: '9', expectedValue: 9 },
        { rank: '10', expectedValue: 10 },
        { rank: 'J', expectedValue: 11 },
        { rank: 'Q', expectedValue: 12 },
        { rank: 'K', expectedValue: 13 },
        { rank: 'A', expectedValue: 14 }
      ];

      testCases.forEach(({ rank, expectedValue }) => {
        const card = new Card('spades', rank);
        expect(card.value).toBe(expectedValue);
      });
    });
  });

  describe('toString', () => {
    test('should return correct string representation for face cards', () => {
      const aceOfHearts = new Card('hearts', 'A');
      const kingOfSpades = new Card('spades', 'K');
      const queenOfDiamonds = new Card('diamonds', 'Q');
      const jackOfClubs = new Card('clubs', 'J');

      expect(aceOfHearts.toString()).toBe('Ace of Hearts');
      expect(kingOfSpades.toString()).toBe('King of Spades');
      expect(queenOfDiamonds.toString()).toBe('Queen of Diamonds');
      expect(jackOfClubs.toString()).toBe('Jack of Clubs');
    });

    test('should return correct string representation for number cards', () => {
      const twoOfHearts = new Card('hearts', '2');
      const tenOfSpades = new Card('spades', '10');

      expect(twoOfHearts.toString()).toBe('Two of Hearts');
      expect(tenOfSpades.toString()).toBe('Ten of Spades');
    });

    test('should handle all suits correctly', () => {
      const heartsCard = new Card('hearts', 'A');
      const diamondsCard = new Card('diamonds', 'A');
      const clubsCard = new Card('clubs', 'A');
      const spadesCard = new Card('spades', 'A');

      expect(heartsCard.toString()).toBe('Ace of Hearts');
      expect(diamondsCard.toString()).toBe('Ace of Diamonds');
      expect(clubsCard.toString()).toBe('Ace of Clubs');
      expect(spadesCard.toString()).toBe('Ace of Spades');
    });
  });

  describe('equals', () => {
    test('should return true for identical cards', () => {
      const card1 = new Card('hearts', 'A');
      const card2 = new Card('hearts', 'A');

      expect(card1.equals(card2)).toBe(true);
    });

    test('should return false for cards with different suits', () => {
      const card1 = new Card('hearts', 'A');
      const card2 = new Card('spades', 'A');

      expect(card1.equals(card2)).toBe(false);
    });

    test('should return false for cards with different ranks', () => {
      const card1 = new Card('hearts', 'A');
      const card2 = new Card('hearts', 'K');

      expect(card1.equals(card2)).toBe(false);
    });

    test('should return false for cards with different suits and ranks', () => {
      const card1 = new Card('hearts', 'A');
      const card2 = new Card('spades', 'K');

      expect(card1.equals(card2)).toBe(false);
    });
  });

  describe('compare', () => {
    test('should return negative number when this card is lower', () => {
      const lowerCard = new Card('hearts', '2');
      const higherCard = new Card('spades', 'A');

      expect(lowerCard.compare(higherCard)).toBeLessThan(0);
    });

    test('should return positive number when this card is higher', () => {
      const higherCard = new Card('hearts', 'A');
      const lowerCard = new Card('spades', '2');

      expect(higherCard.compare(lowerCard)).toBeGreaterThan(0);
    });

    test('should return zero when cards have equal value', () => {
      const card1 = new Card('hearts', 'A');
      const card2 = new Card('spades', 'A');

      expect(card1.compare(card2)).toBe(0);
    });

    test('should compare correctly across different ranks', () => {
      const jack = new Card('hearts', 'J');
      const queen = new Card('spades', 'Q');
      const king = new Card('diamonds', 'K');
      const ace = new Card('clubs', 'A');

      expect(jack.compare(queen)).toBeLessThan(0);
      expect(queen.compare(king)).toBeLessThan(0);
      expect(king.compare(ace)).toBeLessThan(0);
      expect(ace.compare(jack)).toBeGreaterThan(0);
    });
  });

  describe('value property', () => {
    test('should have correct value for Ace (highest)', () => {
      const ace = new Card('hearts', 'A');
      expect(ace.value).toBe(14);
    });

    test('should have correct value for Two (lowest)', () => {
      const two = new Card('hearts', '2');
      expect(two.value).toBe(2);
    });

    test('should maintain value consistency across suits', () => {
      const aceHearts = new Card('hearts', 'A');
      const aceSpades = new Card('spades', 'A');
      const aceDiamonds = new Card('diamonds', 'A');
      const aceClubs = new Card('clubs', 'A');

      expect(aceHearts.value).toBe(aceSpades.value);
      expect(aceSpades.value).toBe(aceDiamonds.value);
      expect(aceDiamonds.value).toBe(aceClubs.value);
    });
  });
});