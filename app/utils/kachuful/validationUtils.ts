/**
 * Validation Utilities for Kachuful Game
 */

import type { Card, Suit, KachufulPlayer, GameSettings } from '../../types/kachuful'
import { canPlayCard, isIllegalDealerBid } from './gameLogic'

/**
 * Validate bid placement
 */
export function validateBid(
  bid: number,
  playerId: string,
  players: KachufulPlayer[],
  cardsInRound: number,
  dealerId: string,
  dealerBidRestriction: boolean
): { valid: boolean; reason?: string } {
  // Bid must be non-negative
  if (bid < 0) {
    return { valid: false, reason: 'Bid cannot be negative' }
  }
  
  // Bid cannot exceed cards in round
  if (bid > cardsInRound) {
    return { valid: false, reason: `Bid cannot exceed ${cardsInRound}` }
  }
  
  // Check dealer restriction
  if (dealerBidRestriction && playerId === dealerId) {
    const otherPlayers = players.filter(p => p.id !== dealerId)
    const totalOtherBids = otherPlayers.reduce((sum, p) => sum + (p.bid || 0), 0)
    
    if (isIllegalDealerBid(bid, totalOtherBids, cardsInRound)) {
      return {
        valid: false,
        reason: `Dealer cannot bid ${bid} (total would equal ${cardsInRound})`,
      }
    }
  }
  
  return { valid: true }
}

/**
 * Validate card play
 */
export function validateCardPlay(
  card: Card,
  playerId: string,
  players: KachufulPlayer[],
  ledSuit: Suit | null
): { valid: boolean; reason?: string } {
  const player = players.find(p => p.id === playerId)
  
  if (!player) {
    return { valid: false, reason: 'Player not found' }
  }
  
  return canPlayCard(card, player.hand, ledSuit)
}

/**
 * Validate game start
 */
export function validateGameStart(
  players: KachufulPlayer[],
  minPlayers = 3,
  maxPlayers = 7
): { valid: boolean; reason?: string } {
  if (players.length < minPlayers) {
    return { valid: false, reason: `Need at least ${minPlayers} players` }
  }
  
  if (players.length > maxPlayers) {
    return { valid: false, reason: `Cannot have more than ${maxPlayers} players` }
  }
  
  return { valid: true }
}

/**
 * Validate game settings
 */
export function validateSettings(
  settings: GameSettings
): { valid: boolean; reason?: string } {
  if (settings.maxRounds < 1) {
    return { valid: false, reason: 'Must have at least 1 round' }
  }
  
  if (settings.timeLimit !== null && settings.timeLimit < 10) {
    return { valid: false, reason: 'Time limit must be at least 10 seconds' }
  }
  
  return { valid: true }
}
