/**
 * Kachuful Game Engine - Server Side
 * Manages game state and enforces game rules
 */

import type * as Party from "partykit/server"
import type {
  KachufulGameState,
  KachufulPlayer,
  GameSettings,
  Card,
  Suit,
  Trick,
  PlayedCard,
  RoundConfig,
  RoundResult,
  PlaceBidPayload,
  PlayKachufulCardPayload,
  StartKachufulGamePayload,
} from './types'
import {
  createDeck,
  shuffleDeck,
  dealCards,
  sortHand,
  findCardById,
  removeCardFromHand,
} from './cardUtils'
import {
  determineMaxCards,
  getRoundSequence,
  getRoundConfig,
  isIllegalDealerBid,
  canPlayCard,
  determineTrickWinner,
  isGameEnd,
} from './gameLogic'
import {
  calculateRoundScore,
  updatePlayerScores,
  determineWinners,
  getFinalStandings,
} from './scoringUtils'
import { DEFAULT_SETTINGS } from './constants'

export class KachufulEngine {
  private gameState: KachufulGameState
  private roundSequence: number[] = []

  constructor(lobbyCode: string, hostId: string, players: any[], maxPlayers: number) {
    // Initialize Kachuful game state
    this.gameState = {
      lobbyCode,
      hostId,
      phase: 'lobby',
      players: players.map(p => this.convertToKachufulPlayer(p)),
      currentTurn: null,
      round: 0,
      maxPlayers,
      createdAt: Date.now(),
      startedAt: null,
      
      roundConfig: {
        number: 1,
        cardsPerPlayer: 1,
        isAscending: true,
        maxRound: determineMaxCards(players.length),
      },
      currentRound: 0,
      totalRounds: 0,
      dealerId: '',
      
      trumpSuit: null,
      trumpCard: null,
      isNoTrump: false,
      
      biddingOrder: [],
      currentBidderId: null,
      allBidsPlaced: false,
      totalBids: 0,
      
      currentTrick: this.createEmptyTrick(1, ''),
      tricks: [],
      currentPlayerId: null,
      playOrder: [],
      
      roundStartedAt: null,
      
      deck: [],
      stockPile: [],
      
      roundHistory: [],
      
      settings: DEFAULT_SETTINGS,
    }
  }

  private convertToKachufulPlayer(player: any): KachufulPlayer {
    return {
      ...player,
      hand: [],
      bid: null,
      tricksWon: 0,
      roundScore: 0,
      totalScore: 0,
    }
  }

  private createEmptyTrick(number: number, leadPlayerId: string): Trick {
    return {
      number,
      leadPlayerId,
      ledSuit: null,
      cardsPlayed: [],
      winnerId: null,
    }
  }

  /**
   * Start the Kachuful game with settings
   */
  startGame(settings: GameSettings): KachufulGameState {
    if (this.gameState.players.length < 3) {
      throw new Error('Need at least 3 players to start')
    }

    this.gameState.settings = settings
    this.gameState.startedAt = Date.now()
    
    // Calculate max rounds and sequence
    const maxRound = determineMaxCards(this.gameState.players.length)
    this.roundSequence = getRoundSequence(maxRound, settings.roundType)
    this.gameState.totalRounds = this.roundSequence.length
    
    // Set first dealer (host)
    this.gameState.dealerId = this.gameState.hostId
    
    // Start first round
    this.startRound()
    
    return this.gameState
  }

  /**
   * Start a new round
   */
  private startRound() {
    this.gameState.currentRound++
    this.gameState.phase = 'round_start'
    this.gameState.roundStartedAt = Date.now()
    
    // Get round configuration
    const config = getRoundConfig(
      this.gameState.currentRound,
      this.roundSequence,
      this.roundSequence[0]
    )
    
    if (!config) {
      throw new Error('Invalid round number')
    }
    
    this.gameState.roundConfig = config
    
    // Reset player round state
    this.gameState.players = this.gameState.players.map(p => ({
      ...p,
      hand: [],
      bid: null,
      tricksWon: 0,
      roundScore: 0,
    }))
    
    // Reset trick state
    this.gameState.tricks = []
    this.gameState.allBidsPlaced = false
    this.gameState.totalBids = 0
    
    // Advance to dealing phase
    this.dealCardsPhase()
  }

  /**
   * Deal cards to all players
   */
  private dealCardsPhase() {
    this.gameState.phase = 'dealing'
    
    // Create and shuffle deck
    const deck = shuffleDeck(createDeck())
    this.gameState.deck = deck
    
    // Deal cards
    const { playerHands, stockPile } = dealCards(
      deck,
      this.gameState.players.length,
      this.gameState.roundConfig.cardsPerPlayer
    )
    
    // Assign hands to players
    this.gameState.players.forEach((player, index) => {
      player.hand = sortHand(playerHands[index])
    })
    
    this.gameState.stockPile = stockPile
    
    // Advance to trump reveal
    this.revealTrump()
  }

  /**
   * Reveal trump card/suit
   */
  private revealTrump() {
    this.gameState.phase = 'trump_reveal'
    
    if (this.gameState.stockPile.length > 0) {
      // Flip top card for trump
      this.gameState.trumpCard = this.gameState.stockPile[0]
      this.gameState.trumpSuit = this.gameState.trumpCard.suit
      this.gameState.isNoTrump = false
    } else {
      // No trump round
      this.gameState.trumpCard = null
      this.gameState.trumpSuit = null
      this.gameState.isNoTrump = true
    }
    
    // Advance to bidding
    this.startBidding()
  }

  /**
   * Start bidding phase
   */
  private startBidding() {
    this.gameState.phase = 'bidding'
    
    // Set bidding order (starting from dealer's left)
    const dealerIndex = this.gameState.players.findIndex(p => p.id === this.gameState.dealerId)
    const biddingOrder: string[] = []
    
    for (let i = 1; i <= this.gameState.players.length; i++) {
      const index = (dealerIndex + i) % this.gameState.players.length
      biddingOrder.push(this.gameState.players[index].id)
    }
    
    this.gameState.biddingOrder = biddingOrder
    this.gameState.currentBidderId = biddingOrder[0]
  }

  /**
   * Place a bid
   */
  placeBid(playerId: string, bid: number): KachufulGameState {
    if (this.gameState.phase !== 'bidding') {
      throw new Error('Not in bidding phase')
    }
    
    if (playerId !== this.gameState.currentBidderId) {
      throw new Error('Not your turn to bid')
    }
    
    const player = this.gameState.players.find(p => p.id === playerId)
    if (!player) {
      throw new Error('Player not found')
    }
    
    // Validate bid
    if (bid < 0 || bid > this.gameState.roundConfig.cardsPerPlayer) {
      throw new Error(`Bid must be between 0 and ${this.gameState.roundConfig.cardsPerPlayer}`)
    }
    
    // Check dealer restriction
    if (
      this.gameState.settings.dealerBidRestriction &&
      playerId === this.gameState.dealerId
    ) {
      const otherPlayers = this.gameState.players.filter(p => p.id !== this.gameState.dealerId)
      const totalOtherBids = otherPlayers.reduce((sum, p) => sum + (p.bid || 0), 0)
      
      if (isIllegalDealerBid(bid, totalOtherBids, this.gameState.roundConfig.cardsPerPlayer)) {
        throw new Error(`Dealer cannot bid ${bid} (total would equal ${this.gameState.roundConfig.cardsPerPlayer})`)
      }
    }
    
    // Place bid
    player.bid = bid
    this.gameState.totalBids += bid
    
    // Move to next bidder
    const currentBidderIndex = this.gameState.biddingOrder.indexOf(playerId)
    const nextBidderIndex = currentBidderIndex + 1
    
    if (nextBidderIndex >= this.gameState.biddingOrder.length) {
      // All bids placed
      this.gameState.allBidsPlaced = true
      this.gameState.currentBidderId = null
      this.startTrickTaking()
    } else {
      this.gameState.currentBidderId = this.gameState.biddingOrder[nextBidderIndex]
    }
    
    return this.gameState
  }

  /**
   * Start trick-taking phase
   */
  private startTrickTaking() {
    this.gameState.phase = 'playing'
    
    // Set play order (starting from dealer's left)
    const dealerIndex = this.gameState.players.findIndex(p => p.id === this.gameState.dealerId)
    const playOrder: string[] = []
    
    for (let i = 1; i <= this.gameState.players.length; i++) {
      const index = (dealerIndex + i) % this.gameState.players.length
      playOrder.push(this.gameState.players[index].id)
    }
    
    this.gameState.playOrder = playOrder
    
    // Start first trick
    const leadPlayer = playOrder[0]
    this.gameState.currentTrick = this.createEmptyTrick(1, leadPlayer)
    this.gameState.currentPlayerId = leadPlayer
  }

  /**
   * Play a card
   */
  playCard(playerId: string, cardId: string): KachufulGameState {
    if (this.gameState.phase !== 'playing') {
      throw new Error('Not in playing phase')
    }
    
    if (playerId !== this.gameState.currentPlayerId) {
      throw new Error('Not your turn to play')
    }
    
    const player = this.gameState.players.find(p => p.id === playerId)
    if (!player) {
      throw new Error('Player not found')
    }
    
    const card = findCardById(player.hand, cardId)
    if (!card) {
      throw new Error('Card not in hand')
    }
    
    // Validate card play
    const validation = canPlayCard(card, player.hand, this.gameState.currentTrick.ledSuit)
    if (!validation.valid) {
      throw new Error(validation.reason || 'Invalid card play')
    }
    
    // Play the card
    const playedCard: PlayedCard = {
      card,
      playerId,
      playerName: player.name,
    }
    
    this.gameState.currentTrick.cardsPlayed.push(playedCard)
    
    // Set led suit if first card
    if (this.gameState.currentTrick.cardsPlayed.length === 1) {
      this.gameState.currentTrick.ledSuit = card.suit
    }
    
    // Remove card from hand
    player.hand = removeCardFromHand(player.hand, cardId)
    
    // Check if trick is complete
    if (this.gameState.currentTrick.cardsPlayed.length === this.gameState.players.length) {
      this.completeTrick()
    } else {
      // Move to next player
      const currentPlayerIndex = this.gameState.playOrder.indexOf(playerId)
      const nextPlayerIndex = (currentPlayerIndex + 1) % this.gameState.playOrder.length
      this.gameState.currentPlayerId = this.gameState.playOrder[nextPlayerIndex]
    }
    
    return this.gameState
  }

  /**
   * Complete a trick
   */
  private completeTrick() {
    // Determine winner
    const winnerId = determineTrickWinner(
      this.gameState.currentTrick.cardsPlayed,
      this.gameState.currentTrick.ledSuit!,
      this.gameState.trumpSuit
    )
    
    this.gameState.currentTrick.winnerId = winnerId
    
    // Update winner's tricks won
    const winner = this.gameState.players.find(p => p.id === winnerId)
    if (winner) {
      winner.tricksWon++
    }
    
    // Add to tricks history
    this.gameState.tricks.push({ ...this.gameState.currentTrick })
    
    // Show trick result
    this.gameState.phase = 'trick_result'
    
    // Check if round is complete
    if (this.gameState.tricks.length === this.gameState.roundConfig.cardsPerPlayer) {
      setTimeout(() => this.completeRound(), 100)
    } else {
      // Start next trick with winner leading
      setTimeout(() => this.startNextTrick(winnerId), 100)
    }
  }

  /**
   * Start next trick
   */
  private startNextTrick(leadPlayerId: string) {
    this.gameState.phase = 'playing'
    const trickNumber = this.gameState.tricks.length + 1
    this.gameState.currentTrick = this.createEmptyTrick(trickNumber, leadPlayerId)
    this.gameState.currentPlayerId = leadPlayerId
  }

  /**
   * Complete a round
   */
  private completeRound() {
    this.gameState.phase = 'round_scoring'
    
    // Update scores
    this.gameState.players = updatePlayerScores(
      this.gameState.players,
      this.gameState.settings.scoringVariant
    )
    
    // Create round result
    const roundResult: RoundResult = {
      roundNumber: this.gameState.currentRound,
      playerResults: this.gameState.players.map(p => ({
        playerId: p.id,
        playerName: p.name,
        bid: p.bid!,
        tricksWon: p.tricksWon,
        pointsEarned: p.roundScore,
        madeBid: p.bid === p.tricksWon,
      })),
    }
    
    this.gameState.roundHistory.push(roundResult)
    
    // Check if game is complete
    if (isGameEnd(this.gameState.currentRound + 1, this.gameState.totalRounds)) {
      setTimeout(() => this.endGame(), 100)
    } else {
      // Rotate dealer
      const currentDealerIndex = this.gameState.players.findIndex(p => p.id === this.gameState.dealerId)
      const nextDealerIndex = (currentDealerIndex + 1) % this.gameState.players.length
      this.gameState.dealerId = this.gameState.players[nextDealerIndex].id
      
      // Show scoreboard before next round
      this.gameState.phase = 'scoreboard'
      
      // Start next round
      setTimeout(() => this.startRound(), 100)
    }
  }

  /**
   * End the game
   */
  private endGame() {
    this.gameState.phase = 'game_end'
  }

  /**
   * Get current game state
   */
  getState(): KachufulGameState {
    return this.gameState
  }

  /**
   * Get winners
   */
  getWinners(): KachufulPlayer[] {
    return determineWinners(this.gameState.players)
  }

  /**
   * Get final standings
   */
  getFinalStandings(): KachufulPlayer[] {
    return getFinalStandings(this.gameState.players)
  }
}
