/**
 * Represents a playing card with suit, rank, and value
 */
class Card {
  /**
   * Creates a new Card instance
   * @param {string} suit - The suit of the card ('hearts', 'diamonds', 'clubs', 'spades')
   * @param {string} rank - The rank of the card ('A', '2', '3', ..., 'K')
   */
  constructor(suit, rank) {
    this.suit = suit;
    this.rank = rank;
    this.value = this._calculateValue(rank);
  }

  /**
   * Calculate the numeric value of a card rank
   * @param {string} rank - The rank of the card
   * @returns {number} The numeric value (2-14, where Ace = 14)
   * @private
   */
  _calculateValue(rank) {
    const rankValues = {
      '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
      '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
    };
    return rankValues[rank];
  }

  /**
   * Returns a string representation of the card
   * @returns {string} String representation like "Ace of Hearts"
   */
  toString() {
    const rankNames = {
      '2': 'Two', '3': 'Three', '4': 'Four', '5': 'Five', '6': 'Six',
      '7': 'Seven', '8': 'Eight', '9': 'Nine', '10': 'Ten',
      'J': 'Jack', 'Q': 'Queen', 'K': 'King', 'A': 'Ace'
    };
    
    const suitNames = {
      'hearts': 'Hearts',
      'diamonds': 'Diamonds',
      'clubs': 'Clubs',
      'spades': 'Spades'
    };

    return `${rankNames[this.rank]} of ${suitNames[this.suit]}`;
  }

  /**
   * Checks if this card equals another card
   * @param {Card} other - The other card to compare
   * @returns {boolean} True if cards are equal
   */
  equals(other) {
    return this.suit === other.suit && this.rank === other.rank;
  }

  /**
   * Compares this card with another card by value
   * @param {Card} other - The other card to compare
   * @returns {number} Negative if this card is lower, positive if higher, 0 if equal
   */
  compare(other) {
    return this.value - other.value;
  }
}

module.exports = Card;