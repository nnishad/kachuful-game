/**
 * Kachuful Game Constants
 */

import type { Suit, Rank } from '../../types/kachuful'

// All suits in the game
export const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades']

// All ranks in the game (A is highest)
export const RANKS: Rank[] = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2']

// Suit symbols for display
export const SUIT_SYMBOLS: Record<Suit, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
}

// Suit colors for UI
export const SUIT_COLORS: Record<Suit, 'red' | 'black'> = {
  hearts: 'red',
  diamonds: 'red',
  clubs: 'black',
  spades: 'black',
}

// Card rank values (for trick winner determination)
export const RANK_VALUES: Record<Rank, number> = {
  A: 14,
  K: 13,
  Q: 12,
  J: 11,
  '10': 10,
  '9': 9,
  '8': 8,
  '7': 7,
  '6': 6,
  '5': 5,
  '4': 4,
  '3': 3,
  '2': 2,
}

// Maximum cards per player based on player count
export const MAX_CARDS_BY_PLAYERS: Record<number, number> = {
  3: 17,
  4: 13,
  5: 10,
  6: 8,
  7: 7,
}

// Default game settings
export const DEFAULT_SETTINGS = {
  maxRounds: 10,
  roundType: 'ascending' as const,
  scoringVariant: 'standard' as const,
  dealerBidRestriction: true,
  timeLimit: null,
  autoAdvance: true,
}
