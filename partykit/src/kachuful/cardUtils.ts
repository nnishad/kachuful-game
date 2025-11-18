/**
 * Card Utilities for Kachuful Game - Server Side
 * Mirrors app/utils/kachuful/cardUtils.ts
 */

import type { Card, Suit, Rank } from './types'
import { SUITS, RANKS, SUIT_SYMBOLS } from './constants'

export function createDeck(): Card[] {
  const deck: Card[] = []
  
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        suit,
        rank,
        id: `${rank}${SUIT_SYMBOLS[suit]}`,
      })
    }
  }
  
  return deck
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck]
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  
  return shuffled
}

export function dealCards(
  deck: Card[],
  numPlayers: number,
  cardsPerPlayer: number
): {
  playerHands: Card[][]
  stockPile: Card[]
} {
  const totalCards = numPlayers * cardsPerPlayer
  const playerHands: Card[][] = []
  
  for (let i = 0; i < numPlayers; i++) {
    const hand = deck.slice(i * cardsPerPlayer, (i + 1) * cardsPerPlayer)
    playerHands.push(hand)
  }
  
  const stockPile = deck.slice(totalCards)
  
  return { playerHands, stockPile }
}

export function sortHand(hand: Card[]): Card[] {
  const suitOrder: Record<Suit, number> = {
    spades: 0,
    hearts: 1,
    diamonds: 2,
    clubs: 3,
  }
  
  return [...hand].sort((a, b) => {
    if (suitOrder[a.suit] !== suitOrder[b.suit]) {
      return suitOrder[a.suit] - suitOrder[b.suit]
    }
    
    const rankOrder = RANKS.indexOf(a.rank)
    const rankOrderB = RANKS.indexOf(b.rank)
    return rankOrder - rankOrderB
  })
}

export function findCardById(hand: Card[], cardId: string): Card | null {
  return hand.find(card => card.id === cardId) || null
}

export function removeCardFromHand(hand: Card[], cardId: string): Card[] {
  return hand.filter(card => card.id !== cardId)
}
