/**
 * Kachuful Room - PartyKit Server Handler
 * Manages WebSocket connections and game flow for Kachuful game
 */

import type * as Party from "partykit/server"
import { KachufulEngine } from './gameEngine'
import type {
  StartKachufulGamePayload,
  PlaceBidPayload,
  PlayKachufulCardPayload,
  KachufulGameState,
} from './types'

interface KachufulMessage {
  type: 'start_kachuful_game' | 'place_bid' | 'play_kachuful_card' | 'advance_phase'
  payload: StartKachufulGamePayload | PlaceBidPayload | PlayKachufulCardPayload | Record<string, unknown>
}

export default class KachufulRoom implements Party.Server {
  private engine: KachufulEngine | null = null
  private lobbyCode: string
  private hostId: string = ''
  private players: Map<string, any> = new Map()

  constructor(readonly room: Party.Room) {
    this.lobbyCode = room.id.toUpperCase()
  }

  /**
   * Called when a new connection is established
   */
  async onConnect(conn: Party.Connection) {
    console.log('[Kachuful] Connection:', conn.id)
    
    // Send current game state if engine exists
    if (this.engine) {
      this.sendToConnection(conn, {
        type: 'kachuful_game_state',
        payload: this.engine.getState(),
        timestamp: Date.now(),
      })
    }
  }

  /**
   * Handle incoming messages
   */
  async onMessage(message: string, sender: Party.Connection) {
    try {
      const msg = JSON.parse(message) as KachufulMessage
      console.log('[Kachuful] Message:', msg.type, 'from', sender.id)

      switch (msg.type) {
        case 'start_kachuful_game':
          this.handleStartGame(sender, msg.payload as StartKachufulGamePayload)
          break
        case 'place_bid':
          this.handlePlaceBid(sender, msg.payload as PlaceBidPayload)
          break
        case 'play_kachuful_card':
          this.handlePlayCard(sender, msg.payload as PlayKachufulCardPayload)
          break
        case 'advance_phase':
          this.handleAdvancePhase(sender)
          break
        default:
          this.sendError(sender, 'Unknown message type')
      }
    } catch (error) {
      console.error('[Kachuful] Error processing message:', error)
      this.sendError(sender, error instanceof Error ? error.message : 'Internal error')
    }
  }

  /**
   * Handle game start
   */
  private handleStartGame(conn: Party.Connection, payload: StartKachufulGamePayload) {
    if (conn.id !== this.hostId) {
      this.sendError(conn, 'Only host can start game')
      return
    }

    if (this.engine) {
      this.sendError(conn, 'Game already started')
      return
    }

    const playersArray = Array.from(this.players.values())
    
    if (playersArray.length < 3) {
      this.sendError(conn, 'Need at least 3 players')
      return
    }

    // Create game engine
    this.engine = new KachufulEngine(
      this.lobbyCode,
      this.hostId,
      playersArray,
      7 // max players
    )

    // Start game with settings
    try {
      const gameState = this.engine.startGame(payload.settings)
      this.broadcastGameState(gameState)
      
      // Broadcast round started event
      this.broadcast({
        type: 'round_started',
        payload: {
          roundNumber: gameState.currentRound,
          cardsPerPlayer: gameState.roundConfig.cardsPerPlayer,
        },
        timestamp: Date.now(),
      })
      
      // Broadcast trump revealed
      this.broadcast({
        type: 'trump_revealed',
        payload: {
          trumpCard: gameState.trumpCard,
          trumpSuit: gameState.trumpSuit,
          isNoTrump: gameState.isNoTrump,
        },
        timestamp: Date.now(),
      })
    } catch (error) {
      this.sendError(conn, error instanceof Error ? error.message : 'Failed to start game')
    }
  }

  /**
   * Handle bid placement
   */
  private handlePlaceBid(conn: Party.Connection, payload: PlaceBidPayload) {
    if (!this.engine) {
      this.sendError(conn, 'Game not started')
      return
    }

    try {
      const gameState = this.engine.placeBid(conn.id, payload.bid)
      
      // Get player name
      const player = this.players.get(conn.id)
      
      // Broadcast bid placed
      this.broadcast({
        type: 'bid_placed',
        payload: {
          playerId: conn.id,
          playerName: player?.name || 'Unknown',
          bid: payload.bid,
        },
        timestamp: Date.now(),
      })
      
      // Broadcast updated game state
      this.broadcastGameState(gameState)
    } catch (error) {
      this.sendError(conn, error instanceof Error ? error.message : 'Failed to place bid')
    }
  }

  /**
   * Handle card play
   */
  private handlePlayCard(conn: Party.Connection, payload: PlayKachufulCardPayload) {
    if (!this.engine) {
      this.sendError(conn, 'Game not started')
      return
    }

    try {
      const gameState = this.engine.playCard(conn.id, payload.cardId)
      
      // Get player and card details
      const player = this.players.get(conn.id)
      const card = gameState.currentTrick.cardsPlayed.find(
        pc => pc.playerId === conn.id
      )?.card
      
      if (card) {
        // Broadcast card played
        this.broadcast({
          type: 'card_played',
          payload: {
            playerId: conn.id,
            playerName: player?.name || 'Unknown',
            card,
          },
          timestamp: Date.now(),
        })
      }
      
      // Broadcast updated game state
      this.broadcastGameState(gameState)
      
      // Check if trick completed
      if (gameState.phase === 'trick_result') {
        const winningPlayer = this.players.get(gameState.currentTrick.winnerId || '')
        
        this.broadcast({
          type: 'trick_completed',
          payload: {
            winnerId: gameState.currentTrick.winnerId!,
            winnerName: winningPlayer?.name || 'Unknown',
            trick: gameState.currentTrick,
          },
          timestamp: Date.now(),
        })
      }
      
      // Check if round completed
      if (gameState.phase === 'round_scoring') {
        const lastRound = gameState.roundHistory[gameState.roundHistory.length - 1]
        
        this.broadcast({
          type: 'round_completed',
          payload: {
            roundResult: lastRound,
          },
          timestamp: Date.now(),
        })
      }
      
      // Check if game ended
      if (gameState.phase === 'game_end') {
        this.broadcast({
          type: 'game_ended',
          payload: {
            winners: this.engine.getWinners(),
            finalStandings: this.engine.getFinalStandings(),
          },
          timestamp: Date.now(),
        })
      }
    } catch (error) {
      this.sendError(conn, error instanceof Error ? error.message : 'Failed to play card')
    }
  }

  /**
   * Handle phase advancement (for testing/debugging)
   */
  private handleAdvancePhase(conn: Party.Connection) {
    if (conn.id !== this.hostId) {
      this.sendError(conn, 'Only host can advance phase')
      return
    }

    if (!this.engine) {
      this.sendError(conn, 'Game not started')
      return
    }

    // Just broadcast current state
    this.broadcastGameState(this.engine.getState())
  }

  /**
   * Broadcast game state to all connections
   */
  private broadcastGameState(gameState: KachufulGameState) {
    // Send full state to each player (they can filter their own hand)
    this.broadcast({
      type: 'kachuful_game_state',
      payload: gameState,
      timestamp: Date.now(),
    })
  }

  /**
   * Broadcast message to all connections
   */
  private broadcast(message: any) {
    this.room.broadcast(JSON.stringify(message))
  }

  /**
   * Send message to specific connection
   */
  private sendToConnection(conn: Party.Connection, message: any) {
    conn.send(JSON.stringify(message))
  }

  /**
   * Send error message
   */
  private sendError(conn: Party.Connection, message: string) {
    this.sendToConnection(conn, {
      type: 'error',
      payload: { message },
      timestamp: Date.now(),
    })
  }

  /**
   * Handle player registration (called from main server)
   */
  registerPlayer(playerId: string, playerData: any) {
    this.players.set(playerId, playerData)
    if (playerData.isHost) {
      this.hostId = playerId
    }
  }

  /**
   * Handle player removal
   */
  removePlayer(playerId: string) {
    this.players.delete(playerId)
  }
}
