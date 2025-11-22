import { describe, it, expect } from 'vitest'
import type * as Party from 'partykit/server'
import CardMastersServer from '../server'
import type { ServerMessage, GameState, PlayingCard, HandUpdatePayload } from '../types'

class MockConnection {
  public sent: string[] = []
  public closed = false

  constructor(public readonly id: string, private readonly onSend: (connectionId: string, raw: string) => void) {}

  send(message: string) {
    this.sent.push(message)
    this.onSend(this.id, message)
  }

  close() {
    this.closed = true
  }
}

class MockRoom {
  public connections = new Map<string, MockConnection>()

  constructor(public readonly id: string, private readonly onSend: (connectionId: string, raw: string) => void) {}

  createConnection(id: string) {
    const conn = new MockConnection(id, this.onSend)
    this.connections.set(id, conn)
    return conn
  }

  broadcast(message: string, exclude?: string[]) {
    const skip = new Set(exclude ?? [])
    this.connections.forEach((conn, id) => {
      if (!skip.has(id)) {
        conn.send(message)
      }
    })
  }

  getConnection(id: string) {
    return this.connections.get(id) as unknown as Party.Connection
  }
}

describe('CardMastersServer integration', () => {
  it('plays an entire round using the shared game engine', async () => {
    const hands: Record<string, PlayingCard[]> = {}
    let latestState: GameState | null = null
    let gameEnded = false

    const intercept = (connectionId: string, raw: string) => {
      const message = JSON.parse(raw) as ServerMessage
      if (message.type === 'game_state') {
        latestState = message.payload as GameState
      }
      if (message.type === 'hand_update') {
        const payload = message.payload as HandUpdatePayload
        hands[payload.playerId] = payload.cards
      }
      if (message.type === 'game_ended') {
        gameEnded = true
      }
    }

    const room = new MockRoom('TEST01', intercept)
    const server = new CardMastersServer(room as unknown as Party.Room)

    // Shorten hand sequence and seed deterministically for test predictability
    ;(server as unknown as { handSequence: number[] }).handSequence = [1]
    server.gameState.handSequence = [1]
    server.gameState.createdAt = 1700000000000

    const hostConn = room.createConnection('host')
    await server.onConnect(hostConn as unknown as Party.Connection)
    await server.onMessage(JSON.stringify({ type: 'create_lobby', payload: { hostName: 'Alice', maxPlayers: 3 } }), hostConn as unknown as Party.Connection)

    const player2Conn = room.createConnection('player-2')
    await server.onConnect(player2Conn as unknown as Party.Connection)
    await server.onMessage(JSON.stringify({ type: 'join_lobby', payload: { lobbyCode: server.gameState.lobbyCode, playerName: 'Bob' } }), player2Conn as unknown as Party.Connection)

    const player3Conn = room.createConnection('player-3')
    await server.onConnect(player3Conn as unknown as Party.Connection)
    await server.onMessage(JSON.stringify({ type: 'join_lobby', payload: { lobbyCode: server.gameState.lobbyCode, playerName: 'Cara' } }), player3Conn as unknown as Party.Connection)

    await server.onMessage(JSON.stringify({ type: 'start_game', payload: {} }), hostConn as unknown as Party.Connection)
    expect(requireState(latestState).phase).toBe('bidding')

    const connectionMap: Record<string, MockConnection> = {
      host: hostConn,
      'player-2': player2Conn,
      'player-3': player3Conn,
    }

    const chooseBid = (state: GameState): number => {
      const remaining = Object.values(state.bids).filter(value => value === null).length
      if (remaining === 1) {
        const currentSum = Object.values(state.bids).reduce((sum, value) => sum + (value ?? 0), 0)
        const forbidden = state.handSize - currentSum
        return forbidden === 0 ? 1 : 0
      }
      return 0
    }

    let guard = 0
    while (latestState && latestState.phase === 'bidding' && guard < 10) {
      const state = requireState(latestState)
      const bidderId = state.currentTurn
      expect(bidderId).toBeTruthy()
      const bid = chooseBid(state)
      const conn = connectionById(bidderId!, connectionMap)
      await server.onMessage(JSON.stringify({ type: 'submit_bid', payload: { bid } }), conn as unknown as Party.Connection)
      guard += 1
    }

    expect(requireState(latestState).phase).toBe('playing')

    const chooseCard = (playerId: string, state: GameState): string => {
      const hand = hands[playerId]
      expect(hand && hand.length > 0).toBeTruthy()
      if (!state.currentTrick.length) {
        return hand[0].id
      }
      const leadSuit = state.currentTrick[0].card.suit
      const suited = hand.find(card => card.suit === leadSuit)
      return suited ? suited.id : hand[0].id
    }

    guard = 0
    while (latestState && latestState.phase === 'playing' && guard < 20) {
      const state = requireState(latestState)
      const currentPlayerId = state.currentTurn
      expect(currentPlayerId).toBeTruthy()
      const cardId = chooseCard(currentPlayerId!, state)
      const conn = connectionById(currentPlayerId!, connectionMap)
      await server.onMessage(JSON.stringify({ type: 'play_card', payload: { cardId } }), conn as unknown as Party.Connection)
      guard += 1
    }

    expect(requireState(latestState).phase).toBe('completed')
    expect(gameEnded).toBe(true)
    expect(Object.values(hands).every(cards => cards.length === 0)).toBe(true)
    expect(server.gameState.history.length).toBeGreaterThan(0)
  })
})

function connectionById(id: string, map: Record<string, MockConnection>): MockConnection {
  if (map[id]) {
    return map[id]
  }
  throw new Error(`Missing connection for id ${id}`)
}

function requireState(state: GameState | null): GameState {
  if (!state) {
    throw new Error('Game state not available')
  }
  return state
}
