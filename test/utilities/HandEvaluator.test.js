const { HandEvaluator, HandType, HandResult } = require('../../src/utilities/HandEvaluator');
const Card = require('../../src/models/Card');

describe('HandEvaluator', () => {
  // Helper function to create cards
  const createCard = (rank, suit) => new Card(suit, rank);
  
  // Helper function to create multiple cards
  const createCards = (cardStrings) => {
    return cardStrings.map(cardStr => {
      const [rank, suit] = cardStr.split('');
      const suitMap = { 'h': 'hearts', 'd': 'diamonds', 'c': 'clubs', 's': 'spades' };
      return createCard(rank === '1' ? '10' : rank, suitMap[suit]);
    });
  };

  describe('evaluateHand', () => {
    test('should throw error for less than 5 cards', () => {
      const cards = createCards(['Ah', 'Kh', 'Qh', 'Jh']);
      expect(() => HandEvaluator.evaluateHand(cards)).toThrow('At least 5 cards required for hand evaluation');
    });

    test('should identify Royal Flush', () => {
      const cards = createCards(['Ah', 'Kh', 'Qh', 'Jh', '1h']); // 10h
      const result = HandEvaluator.evaluateHand(cards);
      
      expect(result.handType).toBe(HandType.ROYAL_FLUSH);
      expect(result.strength).toBe(14);
      expect(result.cards).toHaveLength(5);
    });

    test('should identify Straight Flush', () => {
      const cards = createCards(['9h', '8h', '7h', '6h', '5h', '2c', '3d']);
      const result = HandEvaluator.evaluateHand(cards);
      
      expect(result.handType).toBe(HandType.STRAIGHT_FLUSH);
      expect(result.strength).toBe(9);
      expect(result.cards).toHaveLength(5);
    });

    test('should identify Four of a Kind', () => {
      const cards = createCards(['Ah', 'Ad', 'Ac', 'As', '5h', '2c', '3d']);
      const result = HandEvaluator.evaluateHand(cards);
      
      expect(result.handType).toBe(HandType.FOUR_OF_A_KIND);
      expect(result.strength).toBe(14);
      expect(result.cards).toHaveLength(5);
      expect(result.kickers).toHaveLength(1);
      expect(result.kickers[0].value).toBe(5);
    });

    test('should identify Full House', () => {
      const cards = createCards(['Ah', 'Ad', 'Ac', '5s', '5h', '2c', '3d']);
      const result = HandEvaluator.evaluateHand(cards);
      
      expect(result.handType).toBe(HandType.FULL_HOUSE);
      expect(result.strength).toBe(14 * 100 + 5); // Three Aces over pair of 5s
      expect(result.cards).toHaveLength(5);
    });

    test('should identify Flush', () => {
      const cards = createCards(['Ah', 'Kh', '9h', '7h', '5h', '2c', '3d']);
      const result = HandEvaluator.evaluateHand(cards);
      
      expect(result.handType).toBe(HandType.FLUSH);
      expect(result.strength).toBe(14);
      expect(result.cards).toHaveLength(5);
      expect(result.kickers).toHaveLength(4);
    });

    test('should identify Straight', () => {
      const cards = createCards(['Ah', 'Kd', 'Qc', 'Js', '1h', '2c', '3d']); // 10h
      const result = HandEvaluator.evaluateHand(cards);
      
      expect(result.handType).toBe(HandType.STRAIGHT);
      expect(result.strength).toBe(14);
      expect(result.cards).toHaveLength(5);
    });

    test('should identify Wheel Straight (A-2-3-4-5)', () => {
      const cards = createCards(['Ah', '2d', '3c', '4s', '5h', 'Kc', 'Qd']);
      const result = HandEvaluator.evaluateHand(cards);
      
      expect(result.handType).toBe(HandType.STRAIGHT);
      expect(result.strength).toBe(5); // 5-high straight
      expect(result.cards).toHaveLength(5);
    });

    test('should identify Three of a Kind', () => {
      const cards = createCards(['Ah', 'Ad', 'Ac', '5s', '7h', '2c', '3d']);
      const result = HandEvaluator.evaluateHand(cards);
      
      expect(result.handType).toBe(HandType.THREE_OF_A_KIND);
      expect(result.strength).toBe(14);
      expect(result.cards).toHaveLength(5);
      expect(result.kickers).toHaveLength(2);
      expect(result.kickers[0].value).toBe(7);
      expect(result.kickers[1].value).toBe(5);
    });

    test('should identify Two Pair', () => {
      const cards = createCards(['Ah', 'Ad', '5c', '5s', '7h', '2c', '3d']);
      const result = HandEvaluator.evaluateHand(cards);
      
      expect(result.handType).toBe(HandType.TWO_PAIR);
      expect(result.strength).toBe(14 * 100 + 5); // Aces over 5s
      expect(result.cards).toHaveLength(5);
      expect(result.kickers).toHaveLength(1);
      expect(result.kickers[0].value).toBe(7);
    });

    test('should identify Pair', () => {
      const cards = createCards(['Ah', 'Ad', '5c', '7s', '9h', '2c', '3d']);
      const result = HandEvaluator.evaluateHand(cards);
      
      expect(result.handType).toBe(HandType.PAIR);
      expect(result.strength).toBe(14);
      expect(result.cards).toHaveLength(5);
      expect(result.kickers).toHaveLength(3);
      expect(result.kickers[0].value).toBe(9);
      expect(result.kickers[1].value).toBe(7);
      expect(result.kickers[2].value).toBe(5);
    });

    test('should identify High Card', () => {
      const cards = createCards(['Ah', 'Kd', '5c', '7s', '9h', '2c', '3d']);
      const result = HandEvaluator.evaluateHand(cards);
      
      expect(result.handType).toBe(HandType.HIGH_CARD);
      expect(result.strength).toBe(14);
      expect(result.cards).toHaveLength(5);
      expect(result.kickers).toHaveLength(4);
      expect(result.kickers[0].value).toBe(13);
      expect(result.kickers[1].value).toBe(9);
      expect(result.kickers[2].value).toBe(7);
      expect(result.kickers[3].value).toBe(5);
    });

    test('should handle 7-card hand (Texas Hold\'em scenario)', () => {
      const cards = createCards(['Ah', 'Ad', '5c', '7s', '9h', '2c', '3d']);
      const result = HandEvaluator.evaluateHand(cards);
      
      expect(result.handType).toBe(HandType.PAIR);
      expect(result.cards).toHaveLength(5);
      // Should use best 5 cards: AA, 9, 7, 5
    });
  });

  describe('compareHands', () => {
    test('should compare different hand types', () => {
      const flush = new HandResult(HandType.FLUSH, 14, [], []);
      const straight = new HandResult(HandType.STRAIGHT, 14, [], []);
      
      const result = HandEvaluator.compareHands(flush, straight);
      expect(result).toBeLessThan(0); // Flush wins
    });

    test('should compare same hand types by strength', () => {
      const aceHigh = new HandResult(HandType.HIGH_CARD, 14, [], []);
      const kingHigh = new HandResult(HandType.HIGH_CARD, 13, [], []);
      
      const result = HandEvaluator.compareHands(aceHigh, kingHigh);
      expect(result).toBeLessThan(0); // Ace high wins
    });

    test('should compare by kickers when strength is equal', () => {
      const acesWithKing = new HandResult(HandType.PAIR, 14, [], [createCard('K', 'hearts')]);
      const acesWithQueen = new HandResult(HandType.PAIR, 14, [], [createCard('Q', 'hearts')]);
      
      const result = HandEvaluator.compareHands(acesWithKing, acesWithQueen);
      expect(result).toBeLessThan(0); // Aces with King kicker wins
    });

    test('should return 0 for identical hands', () => {
      const hand1 = new HandResult(HandType.PAIR, 14, [], [createCard('K', 'hearts')]);
      const hand2 = new HandResult(HandType.PAIR, 14, [], [createCard('K', 'diamonds')]);
      
      const result = HandEvaluator.compareHands(hand1, hand2);
      expect(result).toBe(0); // Tie
    });

    test('should compare multiple kickers', () => {
      const kickers1 = [createCard('K', 'hearts'), createCard('Q', 'hearts'), createCard('J', 'hearts')];
      const kickers2 = [createCard('K', 'diamonds'), createCard('Q', 'diamonds'), createCard('10', 'diamonds')];
      
      const hand1 = new HandResult(HandType.PAIR, 14, [], kickers1);
      const hand2 = new HandResult(HandType.PAIR, 14, [], kickers2);
      
      const result = HandEvaluator.compareHands(hand1, hand2);
      expect(result).toBeLessThan(0); // Jack kicker wins over 10 kicker
    });
  });

  describe('Edge Cases', () => {
    test('should handle multiple pairs and choose highest two', () => {
      const cards = createCards(['Ah', 'Ad', '5c', '5s', '7h', '7c', '3d']);
      const result = HandEvaluator.evaluateHand(cards);
      
      expect(result.handType).toBe(HandType.TWO_PAIR);
      expect(result.strength).toBe(14 * 100 + 7); // Aces over 7s (not 5s)
    });

    test('should handle full house with multiple three of a kinds', () => {
      const cards = createCards(['Ah', 'Ad', 'Ac', '5s', '5h', '5c', '3d']);
      const result = HandEvaluator.evaluateHand(cards);
      
      expect(result.handType).toBe(HandType.FULL_HOUSE);
      expect(result.strength).toBe(14 * 100 + 5); // Three Aces over pair of 5s
    });

    test('should handle straight flush vs royal flush', () => {
      const royalFlush = createCards(['Ah', 'Kh', 'Qh', 'Jh', '1h']);
      const straightFlush = createCards(['9h', '8h', '7h', '6h', '5h']);
      
      const royal = HandEvaluator.evaluateHand(royalFlush);
      const straight = HandEvaluator.evaluateHand(straightFlush);
      
      expect(royal.handType).toBe(HandType.ROYAL_FLUSH);
      expect(straight.handType).toBe(HandType.STRAIGHT_FLUSH);
      
      const comparison = HandEvaluator.compareHands(royal, straight);
      expect(comparison).toBeLessThan(0); // Royal flush wins
    });

    test('should handle wheel straight flush', () => {
      const cards = createCards(['Ah', '2h', '3h', '4h', '5h', 'Kc', 'Qd']);
      const result = HandEvaluator.evaluateHand(cards);
      
      expect(result.handType).toBe(HandType.STRAIGHT_FLUSH);
      expect(result.strength).toBe(5); // 5-high straight flush
    });

    test('should handle identical full houses', () => {
      const cards1 = createCards(['Ah', 'Ad', 'Ac', '5s', '5h']);
      const cards2 = createCards(['As', 'Ac', 'Ad', '5c', '5d']);
      
      const result1 = HandEvaluator.evaluateHand(cards1);
      const result2 = HandEvaluator.evaluateHand(cards2);
      
      const comparison = HandEvaluator.compareHands(result1, result2);
      expect(comparison).toBe(0); // Tie
    });

    test('should handle flush with more than 5 cards of same suit', () => {
      const cards = createCards(['Ah', 'Kh', 'Qh', 'Jh', '9h', '7h', '5h']);
      const result = HandEvaluator.evaluateHand(cards);
      
      expect(result.handType).toBe(HandType.FLUSH);
      expect(result.strength).toBe(14); // Ace high
      expect(result.cards).toHaveLength(5);
      // Should use A, K, Q, J, 9 (best 5)
      expect(result.cards[4].value).toBe(9);
    });

    test('should handle straight with gaps filled by duplicates', () => {
      const cards = createCards(['Ah', 'Kd', 'Kh', 'Qc', 'Js', '1h', '9c']);
      const result = HandEvaluator.evaluateHand(cards);
      
      expect(result.handType).toBe(HandType.STRAIGHT);
      expect(result.strength).toBe(14); // Ace high straight
    });
  });

  describe('Performance and Stress Tests', () => {
    test('should handle maximum cards efficiently', () => {
      // Create a hand with many cards (simulating community + hole cards + extras)
      const cards = createCards([
        'Ah', 'Kh', 'Qh', 'Jh', '1h', // Royal flush in hearts
        'Ad', 'Kd', 'Qd', 'Jd', '1d', // Royal flush in diamonds
        '9s', '8s', '7s', '6s', '5s'  // Straight flush in spades
      ]);
      
      const start = Date.now();
      const result = HandEvaluator.evaluateHand(cards);
      const end = Date.now();
      
      expect(result.handType).toBe(HandType.ROYAL_FLUSH);
      expect(end - start).toBeLessThan(10); // Should be very fast
    });

    test('should handle all hand types in single test', () => {
      const testHands = [
        { cards: createCards(['Ah', 'Kh', 'Qh', 'Jh', '1h']), expected: HandType.ROYAL_FLUSH },
        { cards: createCards(['9h', '8h', '7h', '6h', '5h']), expected: HandType.STRAIGHT_FLUSH },
        { cards: createCards(['Ah', 'Ad', 'Ac', 'As', '5h']), expected: HandType.FOUR_OF_A_KIND },
        { cards: createCards(['Ah', 'Ad', 'Ac', '5s', '5h']), expected: HandType.FULL_HOUSE },
        { cards: createCards(['Ah', 'Kh', '9h', '7h', '5h']), expected: HandType.FLUSH },
        { cards: createCards(['Ah', 'Kd', 'Qc', 'Js', '1h']), expected: HandType.STRAIGHT },
        { cards: createCards(['Ah', 'Ad', 'Ac', '5s', '7h']), expected: HandType.THREE_OF_A_KIND },
        { cards: createCards(['Ah', 'Ad', '5c', '5s', '7h']), expected: HandType.TWO_PAIR },
        { cards: createCards(['Ah', 'Ad', '5c', '7s', '9h']), expected: HandType.PAIR },
        { cards: createCards(['Ah', 'Kd', '5c', '7s', '9h']), expected: HandType.HIGH_CARD }
      ];

      testHands.forEach(({ cards, expected }, index) => {
        const result = HandEvaluator.evaluateHand(cards);
        expect(result.handType).toBe(expected);
      });
    });
  });
});