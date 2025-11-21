import { useMemo, useState } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { Stack, XStack, YStack } from 'tamagui'
import { useResponsive } from '../hooks/useResponsive'
import { ResponsiveContainer } from '../components/ResponsiveContainer'
import { CenterPile } from '../components/game-table/CenterPile'
import { FloatingCards, type FloatingCardDecoration } from '../components/game-table/FloatingCards'
import { PlayerBadge } from '../components/game-table/PlayerBadge'
import { PlayerHand } from '../components/game-table/PlayerHand'
import { TrumpCardSpotlight } from '../components/game-table/TrumpCardSpotlight'
import { getPlayerPosition } from '../components/game-table/playerLayout'
import type { PlayingCard, TablePlayer } from '../components/game-table/types'
import type { GameCardSize } from '../components/game-table/GameCard'

export default function GameTable() {
  const { width, height, isMobile, isTablet } = useResponsive()

  const players = useMemo<TablePlayer[]>(
    () => [
      { id: '1', displayName: 'GUEST001', coins: 3_500_000, avatar: '🎮', isCurrentTurn: true },
      { id: '2', displayName: 'GUEST689', coins: 5_500_000, avatar: '👨', isCurrentTurn: false },
      { id: '3', displayName: 'GUEST391', coins: 9_100_000, avatar: '👩', isCurrentTurn: false },
      { id: '4', displayName: 'GUEST252', coins: 6_900_000, avatar: '👴', isCurrentTurn: false },
      { id: '5', displayName: 'GUEST258', coins: 6_900_000, avatar: '👧', isCurrentTurn: false },
    ],
    []
  )

  const playerHand = useMemo<PlayingCard[]>(
    () => [
      { suit: '♠', rank: 'A', id: 'c1' },
      { suit: '♠', rank: '4', id: 'c2' },
      { suit: '♠', rank: 'J', id: 'c3' },
      { suit: '♠', rank: 'K', id: 'c4' },
      { suit: '♦', rank: 'Q', id: 'c5' },
      { suit: '♥', rank: '5', id: 'c6' },
      { suit: '♥', rank: '8', id: 'c7' },
    ],
    []
  )

  const centerCards = useMemo<PlayingCard[]>(
    () => [
      { suit: '♣', rank: '4', id: 'cc1' },
      { suit: '♠', rank: '2', id: 'cc2' },
      { suit: '♦', rank: 'K', id: 'cc3' },
      { suit: '♥', rank: '3', id: 'cc4' },
      { suit: '♦', rank: '3', id: 'cc5' },
    ],
    []
  )

  const floatingCards = useMemo<FloatingCardDecoration[]>(
    () => [
      { suit: '♣', rank: 'A', id: 'fc1', top: '5%', right: '10%', rotation: 15 },
      { suit: '♦', rank: 'K', id: 'fc2', top: '8%', right: '25%', rotation: -20 },
      { suit: '♥', rank: 'Q', id: 'fc3', top: '3%', left: '15%', rotation: 25 },
    ],
    []
  )

  const trumpCard = useMemo<PlayingCard>(() => ({ suit: '♠', rank: 'A', id: 'trump' }), [])
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set())

  const toggleCardSelection = (cardId: string) => {
    setSelectedCards((prev) => {
      const next = new Set(prev)
      if (next.has(cardId)) {
        next.delete(cardId)
      } else {
        next.add(cardId)
      }
      return next
    })
  }

  const cardSize: GameCardSize = isMobile ? 'normal' : isTablet ? 'normal' : 'large'
  const centerCardSize: GameCardSize = isMobile ? 'small' : 'normal'

  const currentPlayer = players[0]
  const otherPlayers = players.slice(1)

  return (
    <ResponsiveContainer bg="$background" overflow="hidden">
      <Stack flex={1} position="relative" overflow="hidden">
        <LinearGradient
          colors={['#2563EB', '#1E40AF', '#1E3A8A']}
          start={[0, 0]}
          end={[1, 1]}
          style={{ flex: 1, position: 'absolute', width: '100%', height: '100%' }}
        />

        <FloatingCards cards={floatingCards} isMobile={isMobile} />

        {otherPlayers.map((player, idx) => (
          <PlayerBadge
            key={player.id}
            player={player}
            isMobile={isMobile}
            placementStyle={getPlayerPosition(idx + 1, players.length, width, height, isMobile)}
          />
        ))}

        {/* Center playing area */}
        <YStack
          gap="$3"
          ai="center"
          style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
        >
          <CenterPile cards={centerCards} cardSize={centerCardSize} maxWidth={isMobile ? 200 : 300} />
        </YStack>

        <YStack
          position="absolute"
          bottom={0}
          left={0}
          right={0}
          paddingVertical={isMobile ? '$2' : '$3'}
          paddingHorizontal={isMobile ? '$3' : '$4'}
        >
          <XStack jc="space-between" ai="flex-end" gap="$3">
            <PlayerBadge player={currentPlayer} isMobile={isMobile} variant="inline" />
            <YStack flex={0} width={isMobile ? 40 : 48} />
          </XStack>
        </YStack>

        <PlayerHand
          cards={playerHand}
          selectedCards={selectedCards}
          onToggle={toggleCardSelection}
          cardSize={cardSize}
          bottomOffset={isMobile ? 10 : 15}
        />

        <TrumpCardSpotlight card={trumpCard} isMobile={isMobile} />
      </Stack>
    </ResponsiveContainer>
  )
}
