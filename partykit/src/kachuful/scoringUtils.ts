/**
 * Scoring Utilities for Kachuful Game - Server Side
 * Mirrors app/utils/kachuful/scoringUtils.ts
 */

import type { KachufulPlayer, GameSettings } from './types'

export function calculateRoundScore(
  bid: number,
  tricksWon: number,
  scoringVariant: GameSettings['scoringVariant']
): number {
  const madeBid = bid === tricksWon
  const difference = Math.abs(tricksWon - bid)
  
  switch (scoringVariant) {
    case 'standard':
      return madeBid ? 10 + bid * 5 : -difference * 5
      
    case 'simple':
      return madeBid ? bid * 10 : -difference * 10
      
    case 'nilBonus':
      if (bid === 0) {
        return madeBid ? 20 : -20
      }
      return madeBid ? 10 + bid * 5 : -difference * 5
      
    default:
      return madeBid ? 10 + bid * 5 : -difference * 5
  }
}

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

export function determineWinners(players: KachufulPlayer[]): KachufulPlayer[] {
  if (players.length === 0) {
    return []
  }
  
  const maxScore = Math.max(...players.map(p => p.totalScore))
  return players.filter(p => p.totalScore === maxScore)
}

export function getFinalStandings(players: KachufulPlayer[]): KachufulPlayer[] {
  return [...players].sort((a, b) => b.totalScore - a.totalScore)
}

export function didMakeBid(bid: number, tricksWon: number): boolean {
  return bid === tricksWon
}
