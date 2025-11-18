import { describe, it, expect } from 'vitest'
import {
  determineMaxCards,
  getRoundSequence,
  getRoundConfig,
  isIllegalDealerBid,
  getPlayableCards,
  canPlayCard,
  determineTrickWinner,
} from '../../utils/kachuful/gameLogic'
import type { Card, PlayedCard } from '../../types/kachuful'

describe('gameLogic', () => {
  describe('determineMaxCards', () => {
    it('returns correct max cards for different player counts', () => {
      expect(determineMaxCards(3)).toBe(17)
      expect(determineMaxCards(4)).toBe(13)
      expect(determineMaxCards(5)).toBe(10)
      expect(determineMaxCards(6)).toBe(8)
      expect(determineMaxCards(7)).toBe(7)
    })
  })

  describe('getRoundSequence', () => {
    it('generates ascending sequence', () => {
      const sequence = getRoundSequence(5, 'ascending')
      expect(sequence).toEqual([1, 2, 3, 4, 5])
    })

    it('generates full sequence (ascending + descending)', () => {
      const sequence = getRoundSequence(3, 'full')
      expect(sequence).toEqual([1, 2, 3, 2, 1])
    })
  })

  describe('getRoundConfig', () => {
    it('returns config for valid round', () => {
      const sequence = [1, 2, 3]
      const config = getRoundConfig(2, sequence, 3)
      
      expect(config).not.toBeNull()
      expect(config?.cardsPerPlayer).toBe(2)
      expect(config?.number).toBe(2)
    })

    it('returns null for invalid round', () => {
      const sequence = [1, 2, 3]
      const config = getRoundConfig(5, sequence, 3)
      expect(config).toBeNull()
    })
  })

  describe('isIllegalDealerBid', () => {
    it('returns true when bid makes total equal cards', () => {
      const result = isIllegalDealerBid(1, 4, 5)
      expect(result).toBe(true)
    })

    it('returns false when bid does not make total equal cards', () => {
      const result = isIllegalDealerBid(2, 4, 5)
      expect(result).toBe(false)
    })
  })

  describe('getPlayableCards', () => {
    const hand: Card[] = [
      { suit: 'hearts', rank: 'A', id: 'A♥' },
      { suit: 'hearts', rank: 'K', id: 'K♥' },
      { suit: 'spades', rank: 'Q', id: 'Q♠' },
    ]

    it('returns all cards when no led suit', () => {
      const playable = getPlayableCards(hand, null, null)
      expect(playable.length).toBe(3)
    })

    it('returns only cards matching led suit when available', () => {
      const playable = getPlayableCards(hand, 'hearts', null)
      expect(playable.length).toBe(2)
      expect(playable.every(c => c.suit === 'hearts')).toBe(true)
    })

    it('returns all cards when cannot follow suit', () => {
      const playable = getPlayableCards(hand, 'diamonds', null)
      expect(playable.length).toBe(3)
    })
  })

  describe('canPlayCard', () => {
    const hand: Card[] = [
      { suit: 'hearts', rank: 'A', id: 'A♥' },
      { suit: 'spades', rank: 'Q', id: 'Q♠' },
    ]

    it('allows any card when no led suit', () => {
      const result = canPlayCard(hand[0], hand, null)
      expect(result.valid).toBe(true)
    })

    it('allows card of led suit', () => {
      const result = canPlayCard(hand[0], hand, 'hearts')
      expect(result.valid).toBe(true)
    })

    it('disallows wrong suit when player has led suit', () => {
      const result = canPlayCard(hand[1], hand, 'hearts')
      expect(result.valid).toBe(false)
      expect(result.reason).toBe('Must follow suit')
    })

    it('allows any card when player has no led suit', () => {
      const result = canPlayCard(hand[1], hand, 'diamonds')
      expect(result.valid).toBe(true)
    })
  })

  describe('determineTrickWinner', () => {
    it('trump beats non-trump', () => {
      const cardsPlayed: PlayedCard[] = [
        {
          card: { suit: 'hearts', rank: 'A', id: 'A♥' },
          playerId: 'p1',
          playerName: 'Player 1',
        },
        {
          card: { suit: 'spades', rank: '2', id: '2♠' },
          playerId: 'p2',
          playerName: 'Player 2',
        },
      ]
      
      const winner = determineTrickWinner(cardsPlayed, 'hearts', 'spades')
      expect(winner).toBe('p2')
    })

    it('higher trump beats lower trump', () => {
      const cardsPlayed: PlayedCard[] = [
        {
          card: { suit: 'spades', rank: '5', id: '5♠' },
          playerId: 'p1',
          playerName: 'Player 1',
        },
        {
          card: { suit: 'spades', rank: 'K', id: 'K♠' },
          playerId: 'p2',
          playerName: 'Player 2',
        },
      ]
      
      const winner = determineTrickWinner(cardsPlayed, 'hearts', 'spades')
      expect(winner).toBe('p2')
    })

    it('highest of led suit wins when no trump played', () => {
      const cardsPlayed: PlayedCard[] = [
        {
          card: { suit: 'hearts', rank: '7', id: '7♥' },
          playerId: 'p1',
          playerName: 'Player 1',
        },
        {
          card: { suit: 'hearts', rank: 'K', id: 'K♥' },
          playerId: 'p2',
          playerName: 'Player 2',
        },
        {
          card: { suit: 'diamonds', rank: 'A', id: 'A♦' },
          playerId: 'p3',
          playerName: 'Player 3',
        },
      ]
      
      const winner = determineTrickWinner(cardsPlayed, 'hearts', 'spades')
      expect(winner).toBe('p2')
    })

    it('works with no trump suit', () => {
      const cardsPlayed: PlayedCard[] = [
        {
          card: { suit: 'hearts', rank: '7', id: '7♥' },
          playerId: 'p1',
          playerName: 'Player 1',
        },
        {
          card: { suit: 'hearts', rank: 'A', id: 'A♥' },
          playerId: 'p2',
          playerName: 'Player 2',
        },
      ]
      
      const winner = determineTrickWinner(cardsPlayed, 'hearts', null)
      expect(winner).toBe('p2')
    })
  })
})
