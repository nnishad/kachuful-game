/**
 * Scoring Utilities for Kachuful Game
 */

import type { KachufulPlayer, GameSettings } from '../../types/kachuful'

/**
 * Calculate score for a round based on bid vs actual tricks won
 */
export function calculateRoundScore(
  bid: number,
  tricksWon: number,
  scoringVariant: GameSettings['scoringVariant']
): number {
  const madeBid = bid === tricksWon
  const difference = Math.abs(tricksWon - bid)
  
  switch (scoringVariant) {
    case 'standard':
      // Made bid: 10 + (bid × 5)
      // Failed bid: -(difference × 5)
      return madeBid ? 10 + bid * 5 : -difference * 5
      
    case 'simple':
      // Made bid: bid × 10
      // Failed bid: -(difference × 10)
      return madeBid ? bid * 10 : -difference * 10
      
    case 'nilBonus':
      // Nil bid gets bonus/penalty
      if (bid === 0) {
        return madeBid ? 20 : -20
      }
      // Non-nil: standard scoring
      return madeBid ? 10 + bid * 5 : -difference * 5
      
    default:
      return madeBid ? 10 + bid * 5 : -difference * 5
  }
}

/**
 * Update all players' total scores after a round
 */
export function updatePlayerScores(
  players: KachufulPlayer[],
  scoringVariant: GameSettings['scoringVariant']
): KachufulPlayer[] {
  return players.map(player => {
    if (player.bid === null) {
      return player
    }
    
    const roundScore = calculateRoundScore(
      player.bid,
      player.tricksWon,
      scoringVariant
    )
    
    return {
      ...player,
      roundScore,
      totalScore: player.totalScore + roundScore,
    }
  })
}

/**
 * Determine game winners (can be multiple in case of tie)
 */
export function determineWinners(players: KachufulPlayer[]): KachufulPlayer[] {
  if (players.length === 0) {
    return []
  }
  
  const maxScore = Math.max(...players.map(p => p.totalScore))
  return players.filter(p => p.totalScore === maxScore)
}

/**
 * Get final standings sorted by score (highest first)
 */
export function getFinalStandings(players: KachufulPlayer[]): KachufulPlayer[] {
  return [...players].sort((a, b) => b.totalScore - a.totalScore)
}

/**
 * Check if player made their bid
 */
export function didMakeBid(bid: number, tricksWon: number): boolean {
  return bid === tricksWon
}
