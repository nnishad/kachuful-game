import { describe, it, expect } from 'vitest'
import {
  calculateRoundScore,
  updatePlayerScores,
  determineWinners,
  getFinalStandings,
  didMakeBid,
} from '../../utils/kachuful/scoringUtils'
import type { KachufulPlayer } from '../../types/kachuful'

describe('scoringUtils', () => {
  describe('calculateRoundScore', () => {
    describe('standard scoring', () => {
      it('awards 10 + bid*5 for successful bid', () => {
        expect(calculateRoundScore(0, 0, 'standard')).toBe(10)
        expect(calculateRoundScore(1, 1, 'standard')).toBe(15)
        expect(calculateRoundScore(3, 3, 'standard')).toBe(25)
        expect(calculateRoundScore(5, 5, 'standard')).toBe(35)
      })

      it('penalizes -(diff*5) for failed bid', () => {
        expect(calculateRoundScore(2, 1, 'standard')).toBe(-5)
        expect(calculateRoundScore(2, 3, 'standard')).toBe(-5)
        expect(calculateRoundScore(1, 3, 'standard')).toBe(-10)
        expect(calculateRoundScore(4, 1, 'standard')).toBe(-15)
      })
    })

    describe('simple scoring', () => {
      it('awards bid*10 for successful bid', () => {
        expect(calculateRoundScore(0, 0, 'simple')).toBe(0)
        expect(calculateRoundScore(2, 2, 'simple')).toBe(20)
        expect(calculateRoundScore(5, 5, 'simple')).toBe(50)
      })

      it('penalizes -(diff*10) for failed bid', () => {
        expect(calculateRoundScore(2, 1, 'simple')).toBe(-10)
        expect(calculateRoundScore(3, 1, 'simple')).toBe(-20)
      })
    })

    describe('nilBonus scoring', () => {
      it('awards 20 for successful nil bid', () => {
        expect(calculateRoundScore(0, 0, 'nilBonus')).toBe(20)
      })

      it('penalizes -20 for failed nil bid', () => {
        expect(calculateRoundScore(0, 1, 'nilBonus')).toBe(-20)
      })

      it('uses standard scoring for non-nil bids', () => {
        expect(calculateRoundScore(2, 2, 'nilBonus')).toBe(20)
        expect(calculateRoundScore(2, 1, 'nilBonus')).toBe(-5)
      })
    })
  })

  describe('updatePlayerScores', () => {
    it('updates round and total scores for all players', () => {
      const players: KachufulPlayer[] = [
        {
          id: 'p1',
          name: 'Player 1',
          status: 'playing',
          score: 0,
          cards: [],
          isHost: true,
          joinedAt: Date.now(),
          hand: [],
          bid: 2,
          tricksWon: 2,
          roundScore: 0,
          totalScore: 10,
          avatar: '🎮',
        },
        {
          id: 'p2',
          name: 'Player 2',
          status: 'playing',
          score: 0,
          cards: [],
          isHost: false,
          joinedAt: Date.now(),
          hand: [],
          bid: 1,
          tricksWon: 2,
          roundScore: 0,
          totalScore: 5,
          avatar: '🎲',
        },
      ]

      const updated = updatePlayerScores(players, 'standard')

      expect(updated[0].roundScore).toBe(20) // Made bid of 2
      expect(updated[0].totalScore).toBe(30) // 10 + 20
      expect(updated[1].roundScore).toBe(-5) // Failed bid (off by 1)
      expect(updated[1].totalScore).toBe(0) // 5 + (-5)
    })
  })

  describe('determineWinners', () => {
    it('returns player with highest score', () => {
      const players: KachufulPlayer[] = [
        {
          id: 'p1',
          name: 'Player 1',
          totalScore: 50,
        } as KachufulPlayer,
        {
          id: 'p2',
          name: 'Player 2',
          totalScore: 30,
        } as KachufulPlayer,
      ]

      const winners = determineWinners(players)
      expect(winners.length).toBe(1)
      expect(winners[0].id).toBe('p1')
    })

    it('returns multiple winners in case of tie', () => {
      const players: KachufulPlayer[] = [
        {
          id: 'p1',
          name: 'Player 1',
          totalScore: 50,
        } as KachufulPlayer,
        {
          id: 'p2',
          name: 'Player 2',
          totalScore: 50,
        } as KachufulPlayer,
        {
          id: 'p3',
          name: 'Player 3',
          totalScore: 30,
        } as KachufulPlayer,
      ]

      const winners = determineWinners(players)
      expect(winners.length).toBe(2)
      expect(winners.map(w => w.id)).toContain('p1')
      expect(winners.map(w => w.id)).toContain('p2')
    })
  })

  describe('getFinalStandings', () => {
    it('sorts players by score descending', () => {
      const players: KachufulPlayer[] = [
        {
          id: 'p1',
          name: 'Player 1',
          totalScore: 30,
        } as KachufulPlayer,
        {
          id: 'p2',
          name: 'Player 2',
          totalScore: 50,
        } as KachufulPlayer,
        {
          id: 'p3',
          name: 'Player 3',
          totalScore: 10,
        } as KachufulPlayer,
      ]

      const standings = getFinalStandings(players)
      expect(standings[0].id).toBe('p2')
      expect(standings[1].id).toBe('p1')
      expect(standings[2].id).toBe('p3')
    })
  })

  describe('didMakeBid', () => {
    it('returns true when bid matches tricks won', () => {
      expect(didMakeBid(2, 2)).toBe(true)
      expect(didMakeBid(0, 0)).toBe(true)
    })

    it('returns false when bid does not match tricks won', () => {
      expect(didMakeBid(2, 1)).toBe(false)
      expect(didMakeBid(2, 3)).toBe(false)
    })
  })
})
