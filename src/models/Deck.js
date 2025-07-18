const Card = require('./Card');

/**
 * Represents a deck of playing cards with shuffle, deal, and reset functionality
 */
class Deck {
  /**
   * Creates a new Deck instance with a standard 52-card deck
   */
  constructor() {
    this.suits = ['hearts', 'diamonds', 'clubs', 'spades'];
    this.ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    this.cards = [];
    this.dealtCards = [];
    this.isShuffled = false;
    this._initializeDeck();
  }

  /**
   * Initialize the deck with all 52 cards
   * @private
   */
  _initializeDeck() {
    this.cards = [];
    this.dealtCards = [];
    
    for (const suit of this.suits) {
      for (const rank of this.ranks) {
        this.cards.push(new Card(suit, rank));
      }
    }
    
    this.isShuffled = false;
  }

  /**
   * Shuffle the deck using Fisher-Yates algorithm
   * @returns {Deck} Returns this deck for method chaining
   */
  shuffle() {
    // Fisher-Yates shuffle algorithm
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
    
    this.isShuffled = true;
    return this;
  }

  /**
   * Deal a single card from the top of the deck
   * @returns {Card|null} The dealt card, or null if deck is empty
   * @throws {Error} If attempting to deal from an empty deck
   */
  deal() {
    if (this.cards.length === 0) {
      throw new Error('Cannot deal from empty deck');
    }

    const card = this.cards.pop();
    this.dealtCards.push(card);
    return card;
  }

  /**
   * Deal multiple cards from the deck
   * @param {number} count - Number of cards to deal
   * @returns {Card[]} Array of dealt cards
   * @throws {Error} If attempting to deal more cards than available
   */
  dealCards(count) {
    if (count > this.cards.length) {
      throw new Error(`Cannot deal ${count} cards, only ${this.cards.length} remaining`);
    }

    const dealtCards = [];
    for (let i = 0; i < count; i++) {
      dealtCards.push(this.deal());
    }
    
    return dealtCards;
  }

  /**
   * Reset the deck to its initial state with all 52 cards
   * @returns {Deck} Returns this deck for method chaining
   */
  reset() {
    this._initializeDeck();
    return this;
  }

  /**
   * Get the number of cards remaining in the deck
   * @returns {number} Number of cards left to deal
   */
  remainingCards() {
    return this.cards.length;
  }

  /**
   * Get the number of cards that have been dealt
   * @returns {number} Number of cards dealt
   */
  dealtCount() {
    return this.dealtCards.length;
  }

  /**
   * Check if the deck is empty
   * @returns {boolean} True if no cards remain
   */
  isEmpty() {
    return this.cards.length === 0;
  }

  /**
   * Check if the deck has been shuffled
   * @returns {boolean} True if deck has been shuffled
   */
  getShuffledState() {
    return this.isShuffled;
  }

  /**
   * Get a copy of the remaining cards (for testing/debugging)
   * @returns {Card[]} Copy of remaining cards array
   */
  getRemainingCards() {
    return [...this.cards];
  }

  /**
   * Get a copy of the dealt cards (for testing/debugging)
   * @returns {Card[]} Copy of dealt cards array
   */
  getDealtCards() {
    return [...this.dealtCards];
  }

  /**
   * Validate deck state - ensures all 52 unique cards are accounted for
   * @returns {boolean} True if deck state is valid
   */
  validateDeckState() {
    const allCards = [...this.cards, ...this.dealtCards];
    
    // Should have exactly 52 cards total
    if (allCards.length !== 52) {
      return false;
    }

    // Check for duplicates and ensure all standard cards are present
    const cardSet = new Set();
    for (const card of allCards) {
      const cardKey = `${card.suit}-${card.rank}`;
      if (cardSet.has(cardKey)) {
        return false; // Duplicate found
      }
      cardSet.add(cardKey);
    }

    // Verify we have all expected cards
    for (const suit of this.suits) {
      for (const rank of this.ranks) {
        const cardKey = `${suit}-${rank}`;
        if (!cardSet.has(cardKey)) {
          return false; // Missing card
        }
      }
    }

    return true;
  }
}

module.exports = Deck;