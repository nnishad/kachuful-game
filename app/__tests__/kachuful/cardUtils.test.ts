import { describe, it, expect } from 'vitest'
import {
  createDeck,
  shuffleDeck,
  dealCards,
  sortHand,
  findCardById,
  removeCardFromHand,
} from '../../utils/kachuful/cardUtils'
import type { Card } from '../../types/kachuful'

describe('cardUtils', () => {
  describe('createDeck', () => {
    it('creates a 52-card deck', () => {
      const deck = createDeck()
      expect(deck.length).toBe(52)
    })

    it('creates unique cards', () => {
      const deck = createDeck()
      const ids = deck.map(c => c.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(52)
    })

    it('has 13 cards per suit', () => {
      const deck = createDeck()
      const hearts = deck.filter(c => c.suit === 'hearts')
      const diamonds = deck.filter(c => c.suit === 'diamonds')
      const clubs = deck.filter(c => c.suit === 'clubs')
      const spades = deck.filter(c => c.suit === 'spades')
      
      expect(hearts.length).toBe(13)
      expect(diamonds.length).toBe(13)
      expect(clubs.length).toBe(13)
      expect(spades.length).toBe(13)
    })
  })

  describe('shuffleDeck', () => {
    it('returns same number of cards', () => {
      const deck = createDeck()
      const shuffled = shuffleDeck(deck)
      expect(shuffled.length).toBe(52)
    })

    it('returns different order (probabilistically)', () => {
      const deck = createDeck()
      const shuffled = shuffleDeck(deck)
      
      // Check that at least some cards are in different positions
      let differentPositions = 0
      for (let i = 0; i < deck.length; i++) {
        if (deck[i].id !== shuffled[i].id) {
          differentPositions++
        }
      }
      
      // Expect at least 80% of cards to be in different positions
      expect(differentPositions).toBeGreaterThan(40)
    })

    it('does not modify original deck', () => {
      const deck = createDeck()
      const originalFirst = deck[0].id
      shuffleDeck(deck)
      expect(deck[0].id).toBe(originalFirst)
    })
  })

  describe('dealCards', () => {
    it('deals correct number of cards per player', () => {
      const deck = createDeck()
      const { playerHands } = dealCards(deck, 4, 5)
      
      expect(playerHands.length).toBe(4)
      playerHands.forEach(hand => {
        expect(hand.length).toBe(5)
      })
    })

    it('creates correct stock pile', () => {
      const deck = createDeck()
      const { stockPile } = dealCards(deck, 4, 5)
      
      // 4 players × 5 cards = 20 cards dealt
      // 52 - 20 = 32 cards in stock pile
      expect(stockPile.length).toBe(32)
    })

    it('deals unique cards to each player', () => {
      const deck = shuffleDeck(createDeck())
      const { playerHands } = dealCards(deck, 4, 5)
      
      const allDealtCards = playerHands.flat()
      const uniqueIds = new Set(allDealtCards.map(c => c.id))
      expect(uniqueIds.size).toBe(20)
    })
  })

  describe('sortHand', () => {
    it('sorts cards by suit then rank', () => {
      const hand: Card[] = [
        { suit: 'hearts', rank: '5', id: '5♥' },
        { suit: 'spades', rank: 'A', id: 'A♠' },
        { suit: 'hearts', rank: 'K', id: 'K♥' },
      ]
      
      const sorted = sortHand(hand)
      
      // Spades should come first, then hearts
      expect(sorted[0].suit).toBe('spades')
      expect(sorted[1].suit).toBe('hearts')
      expect(sorted[2].suit).toBe('hearts')
      
      // Within hearts, K should come before 5
      expect(sorted[1].rank).toBe('K')
      expect(sorted[2].rank).toBe('5')
    })
  })

  describe('findCardById', () => {
    it('finds existing card', () => {
      const hand: Card[] = [
        { suit: 'hearts', rank: 'A', id: 'A♥' },
        { suit: 'spades', rank: 'K', id: 'K♠' },
      ]
      
      const card = findCardById(hand, 'K♠')
      expect(card).not.toBeNull()
      expect(card?.rank).toBe('K')
    })

    it('returns null for non-existent card', () => {
      const hand: Card[] = [
        { suit: 'hearts', rank: 'A', id: 'A♥' },
      ]
      
      const card = findCardById(hand, 'K♠')
      expect(card).toBeNull()
    })
  })

  describe('removeCardFromHand', () => {
    it('removes specified card', () => {
      const hand: Card[] = [
        { suit: 'hearts', rank: 'A', id: 'A♥' },
        { suit: 'spades', rank: 'K', id: 'K♠' },
      ]
      
      const newHand = removeCardFromHand(hand, 'K♠')
      expect(newHand.length).toBe(1)
      expect(newHand[0].id).toBe('A♥')
    })

    it('does not modify original hand', () => {
      const hand: Card[] = [
        { suit: 'hearts', rank: 'A', id: 'A♥' },
      ]
      
      removeCardFromHand(hand, 'A♥')
      expect(hand.length).toBe(1)
    })
  })
})
