/**
 * Kachuful (Judgement) Card Game Types
 * Extends base game types with Kachuful-specific data structures
 */

import type { Player, GameState, GameStatus } from './game'

// Card Types
export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades'
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K'

export interface Card {
  suit: Suit
  rank: Rank
  id: string // unique identifier like "A♠"
}

// Extend existing Player type with Kachuful-specific fields
export interface KachufulPlayer extends Player {
  hand: Card[] // Typed cards
  bid: number | null
  tricksWon: number
  roundScore: number
  totalScore: number
}

// Kachuful Game Phase
export type KachufulPhase = 
  | 'lobby'           // Waiting for players
  | 'round_start'     // Announcing round
  | 'dealing'         // Dealing cards
  | 'trump_reveal'    // Showing trump
  | 'bidding'         // Players making bids
  | 'playing'         // Trick-taking gameplay
  | 'trick_result'    // Showing trick winner
  | 'round_scoring'   // Calculating round scores
  | 'scoreboard'      // Showing cumulative scores
  | 'game_end'        // Game finished

// Trick Types
export interface PlayedCard {
  card: Card
  playerId: string
  playerName: string
}

export interface Trick {
  number: number // 1 to cardsPerRound
  leadPlayerId: string
  ledSuit: Suit | null
  cardsPlayed: PlayedCard[]
  winnerId: string | null
}

// Round Configuration
export interface RoundConfig {
  number: number
  cardsPerPlayer: number
  isAscending: boolean
  maxRound: number
}

// Round Result for History
export interface RoundResult {
  roundNumber: number
  playerResults: {
    playerId: string
    playerName: string
    bid: number
    tricksWon: number
    pointsEarned: number
    madeBid: boolean
  }[]
}

// Game Settings
export interface GameSettings {
  maxRounds: number
  roundType: 'ascending' | 'full'
  scoringVariant: 'standard' | 'simple' | 'nilBonus'
  dealerBidRestriction: boolean
  timeLimit: number | null
  autoAdvance: boolean
}

// Extend existing GameState with Kachuful-specific fields
export interface KachufulGameState extends Omit<GameState, 'players' | 'status'> {
  // Override fields
  phase: KachufulPhase
  players: KachufulPlayer[]
  
  // Round management
  roundConfig: RoundConfig
  currentRound: number
  totalRounds: number
  dealerId: string
  
  // Trump
  trumpSuit: Suit | null
  trumpCard: Card | null
  isNoTrump: boolean
  
  // Bidding
  biddingOrder: string[]
  currentBidderId: string | null
  allBidsPlaced: boolean
  totalBids: number
  
  // Trick-taking
  currentTrick: Trick
  tricks: Trick[]
  currentPlayerId: string | null
  playOrder: string[]
  
  // Timing
  roundStartedAt: number | null
  
  // Deck
  deck: Card[]
  stockPile: Card[]
  
  // History
  roundHistory: RoundResult[]
  
  // Settings
  settings: GameSettings
}

// Client → Server Messages
export interface PlaceBidPayload {
  bid: number
}

export interface PlayKachufulCardPayload {
  cardId: string
}

export interface StartKachufulGamePayload {
  settings: GameSettings
}

// Server → Client Messages
export interface RoundStartPayload {
  roundNumber: number
  cardsPerPlayer: number
}

export interface TrumpRevealPayload {
  trumpCard: Card | null
  trumpSuit: Suit | null
  isNoTrump: boolean
}

export interface BidPlacedPayload {
  playerId: string
  playerName: string
  bid: number
}

export interface CardPlayedPayload {
  playerId: string
  playerName: string
  card: Card
}

export interface TrickCompletedPayload {
  winnerId: string
  winnerName: string
  trick: Trick
}

export interface RoundCompletedPayload {
  roundResult: RoundResult
}

export interface GameEndedPayload {
  winners: KachufulPlayer[]
  finalStandings: KachufulPlayer[]
}
