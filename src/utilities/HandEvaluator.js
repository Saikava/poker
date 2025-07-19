const Card = require('../models/Card');
const { HandEvaluationError, InvalidInputError } = require('../errors/PokerErrors');
const HandEvaluationCache = require('./HandEvaluationCache');

/**
 * Hand types in order of strength (lowest to highest)
 */
const HandType = {
  HIGH_CARD: 0,
  PAIR: 1,
  TWO_PAIR: 2,
  THREE_OF_A_KIND: 3,
  STRAIGHT: 4,
  FLUSH: 5,
  FULL_HOUSE: 6,
  FOUR_OF_A_KIND: 7,
  STRAIGHT_FLUSH: 8,
  ROYAL_FLUSH: 9
};

/**
 * Result of hand evaluation
 */
class HandResult {
  constructor(handType, strength, cards, kickers = []) {
    this.handType = handType;
    this.strength = strength;
    this.cards = cards; // best 5-card hand
    this.kickers = kickers;
  }
}

/**
 * Static class for evaluating poker hands
 */
class HandEvaluator {
  static cache = new HandEvaluationCache();
  /**
   * Evaluates the best 5-card poker hand from given cards
   * @param {Card[]} cards - Array of cards (can be more than 5)
   * @returns {HandResult} The evaluation result
   * @throws {InvalidInputError} If cards parameter is invalid
   * @throws {HandEvaluationError} If hand evaluation fails
   */
  static evaluateHand(cards) {
    if (!cards) {
      throw new InvalidInputError('Cards parameter is required', {
        provided: cards
      });
    }

    if (!Array.isArray(cards)) {
      throw new InvalidInputError('Cards must be an array', {
        provided: cards,
        type: typeof cards
      });
    }

    if (cards.length < 5) {
      throw new InvalidInputError('At least 5 cards required for hand evaluation', {
        provided: cards.length,
        minimum: 5
      });
    }

    // Validate that all items are Card objects
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      if (!card || typeof card !== 'object' || !card.suit || !card.rank || !card.value) {
        throw new InvalidInputError(`Invalid card at index ${i}`, {
          cardIndex: i,
          card: card,
          expectedProperties: ['suit', 'rank', 'value']
        });
      }
    }

    // Check cache first
    const cachedResult = this.cache.get(cards);
    if (cachedResult) {
      return new HandResult(
        cachedResult.handType,
        cachedResult.strength,
        cachedResult.cards,
        cachedResult.kickers
      );
    }

    try {
      // Sort cards by value (descending)
      const sortedCards = [...cards].sort((a, b) => b.value - a.value);
      
      // Check for each hand type from highest to lowest
      let result = this._checkRoyalFlush(sortedCards);
      if (result) {
        this.cache.set(cards, result);
        return result;
      }

      result = this._checkStraightFlush(sortedCards);
      if (result) {
        this.cache.set(cards, result);
        return result;
      }

      result = this._checkFourOfAKind(sortedCards);
      if (result) {
        this.cache.set(cards, result);
        return result;
      }

      result = this._checkFullHouse(sortedCards);
      if (result) {
        this.cache.set(cards, result);
        return result;
      }

      result = this._checkFlush(sortedCards);
      if (result) {
        this.cache.set(cards, result);
        return result;
      }

      result = this._checkStraight(sortedCards);
      if (result) {
        this.cache.set(cards, result);
        return result;
      }

      result = this._checkThreeOfAKind(sortedCards);
      if (result) {
        this.cache.set(cards, result);
        return result;
      }

      result = this._checkTwoPair(sortedCards);
      if (result) {
        this.cache.set(cards, result);
        return result;
      }

      result = this._checkPair(sortedCards);
      if (result) {
        this.cache.set(cards, result);
        return result;
      }

      result = this._checkHighCard(sortedCards);
      this.cache.set(cards, result);
      return result;
    } catch (error) {
      // Re-throw HandEvaluationError as-is, wrap other errors
      if (error instanceof HandEvaluationError) {
        throw error;
      }
      throw new HandEvaluationError('Failed to evaluate hand', {
        originalError: error.message,
        cardsCount: cards.length
      });
    }
  }

  /**
   * Compares two hand results
   * @param {HandResult} hand1 - First hand
   * @param {HandResult} hand2 - Second hand
   * @returns {number} Negative if hand1 wins, positive if hand2 wins, 0 for tie
   */
  static compareHands(hand1, hand2) {
    // First compare hand types
    if (hand1.handType !== hand2.handType) {
      return hand2.handType - hand1.handType;
    }

    // Same hand type, compare strength
    if (hand1.strength !== hand2.strength) {
      return hand2.strength - hand1.strength;
    }

    // Same strength, compare kickers
    return this._compareKickers(hand1.kickers, hand2.kickers);
  }

  /**
   * Check for Royal Flush (A, K, Q, J, 10 of same suit)
   * @private
   */
  static _checkRoyalFlush(cards) {
    const flushCards = this._getFlushCards(cards);
    if (!flushCards) return null;

    const royalValues = [14, 13, 12, 11, 10]; // A, K, Q, J, 10
    const hasRoyal = royalValues.every(value => 
      flushCards.some(card => card.value === value)
    );

    if (hasRoyal) {
      const royalCards = royalValues.map(value => 
        flushCards.find(card => card.value === value)
      );
      return new HandResult(HandType.ROYAL_FLUSH, 14, royalCards);
    }

    return null;
  }

  /**
   * Check for Straight Flush
   * @private
   */
  static _checkStraightFlush(cards) {
    const flushCards = this._getFlushCards(cards);
    if (!flushCards) return null;

    const straightCards = this._getStraightCards(flushCards);
    if (straightCards) {
      const highCard = straightCards[0].value;
      return new HandResult(HandType.STRAIGHT_FLUSH, highCard, straightCards);
    }

    return null;
  }

  /**
   * Check for Four of a Kind
   * @private
   */
  static _checkFourOfAKind(cards) {
    const groups = this._groupByRank(cards);
    const fourOfAKind = Object.entries(groups).find(([rank, cardGroup]) => cardGroup.length === 4);
    
    if (fourOfAKind) {
      const [rank, fourCards] = fourOfAKind;
      const kicker = cards.find(card => card.value !== fourCards[0].value);
      const handCards = [...fourCards, kicker];
      
      return new HandResult(
        HandType.FOUR_OF_A_KIND, 
        fourCards[0].value, 
        handCards, 
        [kicker]
      );
    }

    return null;
  }

  /**
   * Check for Full House
   * @private
   */
  static _checkFullHouse(cards) {
    const groups = this._groupByRank(cards);
    const threeOfAKinds = Object.entries(groups)
      .filter(([rank, cardGroup]) => cardGroup.length >= 3)
      .sort(([rankA, cardsA], [rankB, cardsB]) => cardsB[0].value - cardsA[0].value);
    const pairs = Object.entries(groups)
      .filter(([rank, cardGroup]) => cardGroup.length >= 2)
      .sort(([rankA, cardsA], [rankB, cardsB]) => cardsB[0].value - cardsA[0].value);
    
    if (threeOfAKinds.length >= 1) {
      const [threeRank, threeCards] = threeOfAKinds[0];
      let pairCards = null;
      
      // Look for a pair that's different from the three of a kind
      if (threeOfAKinds.length >= 2) {
        // Use second three of a kind as pair
        pairCards = threeOfAKinds[1][1].slice(0, 2);
      } else {
        // Look for a regular pair
        const pair = pairs.find(([rank, cardGroup]) => rank !== threeRank && cardGroup.length >= 2);
        if (pair) {
          pairCards = pair[1].slice(0, 2);
        }
      }
      
      if (pairCards) {
        const handCards = [...threeCards, ...pairCards];
        
        return new HandResult(
          HandType.FULL_HOUSE, 
          threeCards[0].value * 100 + pairCards[0].value, 
          handCards
        );
      }
    }

    return null;
  }

  /**
   * Check for Flush
   * @private
   */
  static _checkFlush(cards) {
    const flushCards = this._getFlushCards(cards);
    if (flushCards) {
      const bestFive = flushCards.slice(0, 5);
      const kickers = bestFive.slice(1);
      
      return new HandResult(
        HandType.FLUSH, 
        bestFive[0].value, 
        bestFive, 
        kickers
      );
    }

    return null;
  }

  /**
   * Check for Straight
   * @private
   */
  static _checkStraight(cards) {
    const straightCards = this._getStraightCards(cards);
    if (straightCards) {
      const highCard = straightCards[0].value;
      return new HandResult(HandType.STRAIGHT, highCard, straightCards);
    }

    return null;
  }

  /**
   * Check for Three of a Kind
   * @private
   */
  static _checkThreeOfAKind(cards) {
    const groups = this._groupByRank(cards);
    const threeOfAKind = Object.entries(groups).find(([rank, cardGroup]) => cardGroup.length === 3);
    
    if (threeOfAKind) {
      const [rank, threeCards] = threeOfAKind;
      const kickers = cards
        .filter(card => card.value !== threeCards[0].value)
        .slice(0, 2);
      const handCards = [...threeCards, ...kickers];
      
      return new HandResult(
        HandType.THREE_OF_A_KIND, 
        threeCards[0].value, 
        handCards, 
        kickers
      );
    }

    return null;
  }

  /**
   * Check for Two Pair
   * @private
   */
  static _checkTwoPair(cards) {
    const groups = this._groupByRank(cards);
    const pairs = Object.entries(groups)
      .filter(([rank, cardGroup]) => cardGroup.length === 2)
      .sort(([rankA, cardsA], [rankB, cardsB]) => cardsB[0].value - cardsA[0].value);
    
    if (pairs.length >= 2) {
      const [highPairRank, highPairCards] = pairs[0];
      const [lowPairRank, lowPairCards] = pairs[1];
      const kicker = cards.find(card => 
        card.value !== highPairCards[0].value && 
        card.value !== lowPairCards[0].value
      );
      const handCards = [...highPairCards, ...lowPairCards, kicker];
      
      return new HandResult(
        HandType.TWO_PAIR, 
        highPairCards[0].value * 100 + lowPairCards[0].value, 
        handCards, 
        [kicker]
      );
    }

    return null;
  }

  /**
   * Check for Pair
   * @private
   */
  static _checkPair(cards) {
    const groups = this._groupByRank(cards);
    const pair = Object.entries(groups).find(([rank, cardGroup]) => cardGroup.length === 2);
    
    if (pair) {
      const [rank, pairCards] = pair;
      const kickers = cards
        .filter(card => card.value !== pairCards[0].value)
        .slice(0, 3);
      const handCards = [...pairCards, ...kickers];
      
      return new HandResult(
        HandType.PAIR, 
        pairCards[0].value, 
        handCards, 
        kickers
      );
    }

    return null;
  }

  /**
   * Check for High Card
   * @private
   */
  static _checkHighCard(cards) {
    const bestFive = cards.slice(0, 5);
    const kickers = bestFive.slice(1);
    
    return new HandResult(
      HandType.HIGH_CARD, 
      bestFive[0].value, 
      bestFive, 
      kickers
    );
  }

  /**
   * Get cards of the same suit (5 or more for flush)
   * @private
   */
  static _getFlushCards(cards) {
    const suitGroups = {};
    
    cards.forEach(card => {
      if (!suitGroups[card.suit]) {
        suitGroups[card.suit] = [];
      }
      suitGroups[card.suit].push(card);
    });

    const flushSuit = Object.entries(suitGroups).find(([suit, suitCards]) => suitCards.length >= 5);
    
    if (flushSuit) {
      return flushSuit[1].sort((a, b) => b.value - a.value);
    }

    return null;
  }

  /**
   * Get 5 consecutive cards for straight
   * @private
   */
  static _getStraightCards(cards) {
    // Remove duplicates and sort by value
    const uniqueCards = [];
    const seenValues = new Set();
    
    for (const card of cards) {
      if (!seenValues.has(card.value)) {
        uniqueCards.push(card);
        seenValues.add(card.value);
      }
    }
    
    uniqueCards.sort((a, b) => b.value - a.value);

    // Check for regular straight
    for (let i = 0; i <= uniqueCards.length - 5; i++) {
      const straightCards = [];
      let currentValue = uniqueCards[i].value;
      
      for (let j = i; j < uniqueCards.length && straightCards.length < 5; j++) {
        if (uniqueCards[j].value === currentValue) {
          straightCards.push(uniqueCards[j]);
          currentValue--;
        } else if (uniqueCards[j].value < currentValue) {
          break;
        }
      }
      
      if (straightCards.length === 5) {
        return straightCards;
      }
    }

    // Check for A-2-3-4-5 straight (wheel)
    const hasAce = uniqueCards.some(card => card.value === 14);
    const hasTwo = uniqueCards.some(card => card.value === 2);
    const hasThree = uniqueCards.some(card => card.value === 3);
    const hasFour = uniqueCards.some(card => card.value === 4);
    const hasFive = uniqueCards.some(card => card.value === 5);
    
    if (hasAce && hasTwo && hasThree && hasFour && hasFive) {
      return [
        uniqueCards.find(card => card.value === 5),
        uniqueCards.find(card => card.value === 4),
        uniqueCards.find(card => card.value === 3),
        uniqueCards.find(card => card.value === 2),
        uniqueCards.find(card => card.value === 14)
      ];
    }

    return null;
  }

  /**
   * Group cards by rank
   * @private
   */
  static _groupByRank(cards) {
    const groups = {};
    
    cards.forEach(card => {
      if (!groups[card.rank]) {
        groups[card.rank] = [];
      }
      groups[card.rank].push(card);
    });

    return groups;
  }

  /**
   * Compare kicker cards
   * @private
   */
  static _compareKickers(kickers1, kickers2) {
    const maxLength = Math.max(kickers1.length, kickers2.length);
    
    for (let i = 0; i < maxLength; i++) {
      const kicker1Value = kickers1[i] ? kickers1[i].value : 0;
      const kicker2Value = kickers2[i] ? kickers2[i].value : 0;
      
      if (kicker1Value !== kicker2Value) {
        return kicker2Value - kicker1Value;
      }
    }
    
    return 0; // Tie
  }

  /**
   * Gets cache statistics for performance monitoring
   * @returns {Object} Cache performance statistics
   */
  static getCacheStats() {
    return this.cache.getStats();
  }

  /**
   * Clears the hand evaluation cache
   */
  static clearCache() {
    this.cache.clear();
  }

  /**
   * Optimizes the cache by removing least recently used entries
   * @param {number} targetSize - Target cache size (optional)
   */
  static optimizeCache(targetSize) {
    this.cache.optimize(targetSize);
  }
}

module.exports = { HandEvaluator, HandType, HandResult };