/**
 * Kachuful Game Logic - Server Side
 * Mirrors app/utils/kachuful/gameLogic.ts
 */

import type { Card, Suit, PlayedCard, Trick, RoundConfig } from './types'
import { RANK_VALUES, MAX_CARDS_BY_PLAYERS } from './constants'

export function determineMaxCards(numPlayers: number): number {
  return MAX_CARDS_BY_PLAYERS[numPlayers] || 13
}

export function getRoundSequence(maxRound: number, roundType: 'ascending' | 'full'): number[] {
  const ascending = Array.from({ length: maxRound }, (_, i) => i + 1)
  
  if (roundType === 'full') {
    const descending = Array.from({ length: maxRound - 1 }, (_, i) => maxRound - 1 - i)
    return [...ascending, ...descending]
  }
  
  return ascending
}

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

export function isIllegalDealerBid(
  bid: number,
  totalBidsSoFar: number,
  cardsInRound: number
): boolean {
  return bid + totalBidsSoFar === cardsInRound
}

export function getPlayableCards(
  hand: Card[],
  ledSuit: Suit | null,
  trumpSuit: Suit | null
): Card[] {
  if (ledSuit === null) {
    return hand
  }
  
  const sameSuitCards = hand.filter(card => card.suit === ledSuit)
  
  if (sameSuitCards.length > 0) {
    return sameSuitCards
  }
  
  return hand
}

export function canPlayCard(
  card: Card,
  hand: Card[],
  ledSuit: Suit | null
): { valid: boolean; reason?: string } {
  if (!hand.find(c => c.id === card.id)) {
    return { valid: false, reason: 'Card not in hand' }
  }
  
  if (ledSuit === null) {
    return { valid: true }
  }
  
  const hasSameSuit = hand.some(c => c.suit === ledSuit)
  
  if (hasSameSuit && card.suit !== ledSuit) {
    return { valid: false, reason: 'Must follow suit' }
  }
  
  return { valid: true }
}

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
    
    if (trumpSuit !== null) {
      if (currentCard.card.suit === trumpSuit) {
        if (
          winningCard.card.suit !== trumpSuit ||
          RANK_VALUES[currentCard.card.rank] > RANK_VALUES[winningCard.card.rank]
        ) {
          winningCard = currentCard
        }
      } else if (winningCard.card.suit === trumpSuit) {
        continue
      } else if (currentCard.card.suit === ledSuit) {
        if (
          winningCard.card.suit !== ledSuit ||
          RANK_VALUES[currentCard.card.rank] > RANK_VALUES[winningCard.card.rank]
        ) {
          winningCard = currentCard
        }
      }
    } else {
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

export function getCardValue(rank: string): number {
  return RANK_VALUES[rank as keyof typeof RANK_VALUES] || 0
}

export function isGameEnd(currentRound: number, totalRounds: number): boolean {
  return currentRound > totalRounds
}
