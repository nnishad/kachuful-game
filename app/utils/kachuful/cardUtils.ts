/**
 * Card Utilities for Kachuful Game
 * Functions for deck creation, shuffling, and dealing
 */

import type { Card, Suit, Rank } from '../../types/kachuful'
import { SUITS, RANKS, SUIT_SYMBOLS } from './constants'

/**
 * Create a standard 52-card deck
 */
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

/**
 * Shuffle a deck using Fisher-Yates algorithm
 */
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck]
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  
  return shuffled
}

/**
 * Deal cards to players
 * @returns Object with playerHands and remaining stockPile
 */
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
  
  // Deal cards to each player
  for (let i = 0; i < numPlayers; i++) {
    const hand = deck.slice(i * cardsPerPlayer, (i + 1) * cardsPerPlayer)
    playerHands.push(hand)
  }
  
  // Remaining cards form the stock pile
  const stockPile = deck.slice(totalCards)
  
  return { playerHands, stockPile }
}

/**
 * Get card display name (e.g., "A♠", "10♥")
 */
export function getCardDisplayName(card: Card): string {
  return card.id
}

/**
 * Sort cards in hand by suit and rank
 */
export function sortHand(hand: Card[]): Card[] {
  const suitOrder: Record<Suit, number> = {
    spades: 0,
    hearts: 1,
    diamonds: 2,
    clubs: 3,
  }
  
  return [...hand].sort((a, b) => {
    // First sort by suit
    if (suitOrder[a.suit] !== suitOrder[b.suit]) {
      return suitOrder[a.suit] - suitOrder[b.suit]
    }
    
    // Then by rank (high to low)
    const rankOrder = RANKS.indexOf(a.rank)
    const rankOrderB = RANKS.indexOf(b.rank)
    return rankOrder - rankOrderB
  })
}

/**
 * Check if two cards are equal
 */
export function cardsEqual(card1: Card, card2: Card): boolean {
  return card1.id === card2.id
}

/**
 * Find a card in a hand by ID
 */
export function findCardById(hand: Card[], cardId: string): Card | null {
  return hand.find(card => card.id === cardId) || null
}

/**
 * Remove a card from a hand
 */
export function removeCardFromHand(hand: Card[], cardId: string): Card[] {
  return hand.filter(card => card.id !== cardId)
}
