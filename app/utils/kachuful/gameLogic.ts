/**
 * Kachuful Game Logic
 * Core game rules implementation
 */

import type { Card, Suit, PlayedCard, Trick, RoundConfig } from '../../types/kachuful'
import { RANK_VALUES, MAX_CARDS_BY_PLAYERS } from './constants'

/**
 * Determine the maximum cards for a round based on player count
 */
export function determineMaxCards(numPlayers: number): number {
  return MAX_CARDS_BY_PLAYERS[numPlayers] || 13
}

/**
 * Generate round sequence (1, 2, 3... up to max, then optionally down)
 */
export function getRoundSequence(maxRound: number, roundType: 'ascending' | 'full'): number[] {
  const ascending = Array.from({ length: maxRound }, (_, i) => i + 1)
  
  if (roundType === 'full') {
    // Full = ascending then descending (don't repeat max)
    const descending = Array.from({ length: maxRound - 1 }, (_, i) => maxRound - 1 - i)
    return [...ascending, ...descending]
  }
  
  return ascending
}

/**
 * Get configuration for a specific round number
 */
export function getRoundConfig(
  roundNumber: number,
  roundSequence: number[],
  maxRound: number
): RoundConfig | null {
  if (roundNumber < 1 || roundNumber > roundSequence.length) {
    return null
  }
  
  const cardsPerPlayer = roundSequence[roundNumber - 1]
  const isAscending = cardsPerPlayer <= maxRound
  
  return {
    number: roundNumber,
    cardsPerPlayer,
    isAscending,
    maxRound,
  }
}

/**
 * Check if a bid is valid for dealer (can't make total equal available tricks)
 */
export function isIllegalDealerBid(
  bid: number,
  totalBidsSoFar: number,
  cardsInRound: number
): boolean {
  return bid + totalBidsSoFar === cardsInRound
}

/**
 * Get playable cards from hand given the led suit
 */
export function getPlayableCards(
  hand: Card[],
  ledSuit: Suit | null,
  trumpSuit: Suit | null
): Card[] {
  // If no led suit yet (leading the trick), all cards are playable
  if (ledSuit === null) {
    return hand
  }
  
  // Must follow suit if possible
  const sameSuitCards = hand.filter(card => card.suit === ledSuit)
  
  if (sameSuitCards.length > 0) {
    return sameSuitCards
  }
  
  // If can't follow suit, can play any card
  return hand
}

/**
 * Check if a card can be played
 */
export function canPlayCard(
  card: Card,
  hand: Card[],
  ledSuit: Suit | null
): { valid: boolean; reason?: string } {
  // Card must be in hand
  if (!hand.find(c => c.id === card.id)) {
    return { valid: false, reason: 'Card not in hand' }
  }
  
  // If no led suit, any card can be played
  if (ledSuit === null) {
    return { valid: true }
  }
  
  // Check if player has cards of led suit
  const hasSameSuit = hand.some(c => c.suit === ledSuit)
  
  if (hasSameSuit && card.suit !== ledSuit) {
    return { valid: false, reason: 'Must follow suit' }
  }
  
  return { valid: true }
}

/**
 * Determine the winner of a trick
 */
export function determineTrickWinner(
  cardsPlayed: PlayedCard[],
  ledSuit: Suit,
  trumpSuit: Suit | null
): string {
  if (cardsPlayed.length === 0) {
    throw new Error('No cards played in trick')
  }
  
  let winningCard = cardsPlayed[0]
  
  for (let i = 1; i < cardsPlayed.length; i++) {
    const currentCard = cardsPlayed[i]
    
    // If trump suit exists
    if (trumpSuit !== null) {
      // Current card is trump
      if (currentCard.card.suit === trumpSuit) {
        // Winning card is not trump, or current trump is higher
        if (
          winningCard.card.suit !== trumpSuit ||
          RANK_VALUES[currentCard.card.rank] > RANK_VALUES[winningCard.card.rank]
        ) {
          winningCard = currentCard
        }
      }
      // Current card is not trump, winning card is trump
      else if (winningCard.card.suit === trumpSuit) {
        // Winning card remains trump
        continue
      }
      // Neither is trump, compare led suit
      else if (currentCard.card.suit === ledSuit) {
        if (
          winningCard.card.suit !== ledSuit ||
          RANK_VALUES[currentCard.card.rank] > RANK_VALUES[winningCard.card.rank]
        ) {
          winningCard = currentCard
        }
      }
    }
    // No trump suit - just compare led suit
    else {
      if (
        currentCard.card.suit === ledSuit &&
        (winningCard.card.suit !== ledSuit ||
          RANK_VALUES[currentCard.card.rank] > RANK_VALUES[winningCard.card.rank])
      ) {
        winningCard = currentCard
      }
    }
  }
  
  return winningCard.playerId
}

/**
 * Get the value of a rank (for sorting/comparison)
 */
export function getCardValue(rank: string): number {
  return RANK_VALUES[rank as keyof typeof RANK_VALUES] || 0
}

/**
 * Check if game has ended
 */
export function isGameEnd(currentRound: number, totalRounds: number): boolean {
  return currentRound > totalRounds
}
