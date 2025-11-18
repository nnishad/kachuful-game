/**
 * Kachuful (Judgement) Card Game Types - Server Side
 * These types mirror the client-side types in app/types/kachuful.ts
 * KEEP THESE IN SYNC!
 */

// Card Types
export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades'
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K'

export interface Card {
  suit: Suit
  rank: Rank
  id: string // unique identifier like "A♠"
}

// Player with Kachuful-specific fields
export interface KachufulPlayer {
  id: string
  name: string
  status: string
  score: number
  cards: string[]
  avatar?: string
  isHost: boolean
  joinedAt: number
  
  // Kachuful-specific
  hand: Card[]
  bid: number | null
  tricksWon: number
  roundScore: number
  totalScore: number
}

// Kachuful Game Phase
export type KachufulPhase = 
  | 'lobby'
  | 'round_start'
  | 'dealing'
  | 'trump_reveal'
  | 'bidding'
  | 'playing'
  | 'trick_result'
  | 'round_scoring'
  | 'scoreboard'
  | 'game_end'

// Trick Types
export interface PlayedCard {
  card: Card
  playerId: string
  playerName: string
}

export interface Trick {
  number: number
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

// Round Result
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

// Kachuful Game State
export interface KachufulGameState {
  lobbyCode: string
  hostId: string
  phase: KachufulPhase
  players: KachufulPlayer[]
  currentTurn: string | null
  round: number
  maxPlayers: number
  createdAt: number
  startedAt: number | null
  
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

// Message Payloads
export interface PlaceBidPayload {
  bid: number
}

export interface PlayKachufulCardPayload {
  cardId: string
}

export interface StartKachufulGamePayload {
  settings: GameSettings
}

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
