import { useState } from 'react'
import { YStack, XStack, Text, Circle, Button, Stack } from 'tamagui'
import { useResponsive } from '../hooks/useResponsive'
import { LinearGradient } from 'expo-linear-gradient'
import { Spade } from '@tamagui/lucide-icons'

// Types
type CardSuit = '♠' | '♥' | '♦' | '♣'
type CardRank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K'

interface Card {
  suit: CardSuit
  rank: CardRank
  id: string
}

interface Player {
  id: string
  username: string
  coins: number
  avatar: string
  isCurrentTurn: boolean
}

// Helper Functions
const getSuitColor = (suit: CardSuit): string => {
  return suit === '♥' || suit === '♦' ? '#DC2626' : '#000000'
}

const getPlayerPosition = (
  index: number,
  total: number,
  containerWidth: number,
  containerHeight: number,
  isMobile: boolean
): Record<string, any> => {
  const padding = isMobile ? 10 : 20
  
  // Index 0 is always the current player (not shown in borders, shown at bottom with hand)
  // Other players are distributed on top, left, and right borders
  
  if (index === 0) {
    // Current player - will be handled separately with hand at bottom
    return { bottom: -1000 } // Hide, rendered separately
  }
  
  const otherPlayersCount = total - 1
  const otherIndex = index - 1
  
  // Distribute other players across top, left, and right borders
  if (total === 2) {
    // 1 opponent at top center
    return { top: padding, left: '50%', transform: 'translateX(-50%)' }
  }
  
  if (total === 3) {
    // 2 opponents
    const positions = [
      { top: padding, left: '30%', transform: 'translateX(-50%)' }, // Top left
      { top: padding, right: '30%', transform: 'translateX(50%)' }, // Top right
    ]
    return positions[otherIndex]
  }
  
  if (total === 4) {
    // 3 opponents
    const positions = [
      { top: padding, left: '50%', transform: 'translateX(-50%)' }, // Top center
      { top: '50%', left: padding, transform: 'translateY(-50%)' }, // Left middle
      { top: '50%', right: padding, transform: 'translateY(-50%)' }, // Right middle
    ]
    return positions[otherIndex]
  }
  
  if (total === 5) {
    // 4 opponents
    const positions = [
      { top: padding, left: '33%', transform: 'translateX(-50%)' }, // Top left
      { top: padding, right: '33%', transform: 'translateX(50%)' }, // Top right
      { top: '50%', left: padding, transform: 'translateY(-50%)' }, // Left middle
      { top: '50%', right: padding, transform: 'translateY(-50%)' }, // Right middle
    ]
    return positions[otherIndex]
  }
  
  // For 6-10 players, distribute evenly
  const topCount = Math.ceil(otherPlayersCount / 3)
  const leftCount = Math.floor((otherPlayersCount - topCount) / 2)
  const rightCount = otherPlayersCount - topCount - leftCount
  
  if (otherIndex < topCount) {
    // Top border
    const spacing = containerWidth / (topCount + 1)
    return { top: padding, left: spacing * (otherIndex + 1) }
  } else if (otherIndex < topCount + leftCount) {
    // Left border
    const leftIndex = otherIndex - topCount
    const spacing = containerHeight / (leftCount + 1)
    return { left: padding, top: spacing * (leftIndex + 1) }
  } else {
    // Right border
    const rightIndex = otherIndex - topCount - leftCount
    const spacing = containerHeight / (rightCount + 1)
    return { right: padding, top: spacing * (rightIndex + 1) }
  }
}

// Card Component
function GameCard({ card, selected, onPress, size = 'normal' }: { 
  card: Card
  selected?: boolean
  onPress?: () => void
  size?: 'small' | 'normal' | 'large'
}) {
  const sizeMap = {
    small: { width: 40, height: 56, fontSize: 16 },
    normal: { width: 60, height: 84, fontSize: 24 },
    large: { width: 80, height: 112, fontSize: 32 },
  }
  
  const dimensions = sizeMap[size]
  const suitColor = getSuitColor(card.suit)

  return (
    // @ts-ignore - Tamagui props
    <YStack
      width={dimensions.width}
      height={dimensions.height}
      y={selected ? -10 : 0}
      bg="white"
      borderColor={selected ? '#F59E0B' : '#ccc'}
      borderWidth={selected ? 2 : 1}
      br="$2"
      jc="center"
      ai="center"
      shadowColor="#000"
      shadowOffset={{ width: 0, height: 2 }}
      shadowOpacity={0.25}
      shadowRadius={4}
      animation="bouncy"
      pressStyle={{ scale: 1.05, y: selected ? -15 : -5 }}
      onPress={onPress}
      cursor={onPress ? 'pointer' : 'default'}
    >
      <Text
        fontSize={dimensions.fontSize}
        fontWeight="bold"
        style={{ color: suitColor }}
        lineHeight={dimensions.fontSize}
      >
        {card.rank}
      </Text>
      <Text
        fontSize={dimensions.fontSize * 0.8}
        style={{ color: suitColor }}
        lineHeight={dimensions.fontSize * 0.8}
      >
        {card.suit}
      </Text>
    </YStack>
  )
}

// Player Info Component
function PlayerInfo({ player, position, isMobile }: {
  player: Player
  position: Record<string, any>
  isMobile: boolean
}) {
  const avatarSize = isMobile ? 36 : 48

  return (
    // @ts-ignore - Tamagui props
    <XStack
      bg="linear-gradient(135deg, rgba(0, 0, 0, 0.85) 0%, rgba(30, 30, 50, 0.85) 100%)"
      br="$4"
      py="$2"
      px="$2"
      gap="$2"
      ai="center"
      borderWidth={player.isCurrentTurn ? 2 : 1.5}
      borderColor={player.isCurrentTurn ? '#10B981' : 'rgba(255, 255, 255, 0.15)'}
      shadowColor={player.isCurrentTurn ? '#10B981' : '#000'}
      shadowRadius={player.isCurrentTurn ? 12 : 6}
      shadowOpacity={player.isCurrentTurn ? 0.9 : 0.5}
      shadowOffset={{ width: 0, height: 3 }}
      animation="quick"
      style={{
        position: 'absolute',
        backgroundColor: 'rgba(15, 20, 35, 0.92)',
        backdropFilter: 'blur(10px)',
        ...position,
      }}
    >
      {/* Avatar with glow effect */}
      <YStack position="relative">
        {player.isCurrentTurn && (
          <Circle 
            size={avatarSize + 6} 
            position="absolute" 
            top={-3} 
            left={-3}
            bg="#10B981"
            opacity={0.3}
            animation="quick"
          />
        )}
        <Circle 
          size={avatarSize} 
          overflow="hidden" 
          bg="linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%)"
          borderWidth={1.5}
          borderColor={player.isCurrentTurn ? '#10B981' : 'rgba(255, 255, 255, 0.2)'}
          shadowColor="#000"
          shadowRadius={3}
          shadowOpacity={0.3}
          style={{ backgroundColor: '#F1F5F9' }}
        >
          <Text fontSize={isMobile ? 18 : 24}>{player.avatar}</Text>
        </Circle>
      </YStack>
      
      <YStack gap="$1" flex={1}>
        <Text
          style={{ 
            color: 'white',
            textShadowColor: 'rgba(0, 0, 0, 0.5)',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 2
          }}
          fontSize={isMobile ? 11 : 13}
          fontWeight="700"
          letterSpacing={0.3}
        >
          {player.username}
        </Text>
        {/* @ts-ignore - Tamagui props */}
        <XStack 
          gap="$1" 
          ai="center"
          bg="rgba(245, 158, 11, 0.15)"
          py="$0.5"
          px="$1.5"
          br="$2"
        >
          <Circle 
            size={isMobile ? 10 : 12} 
            bg="linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)"
            shadowColor="#F59E0B"
            shadowRadius={3}
            shadowOpacity={0.6}
            style={{ backgroundColor: '#F59E0B' }}
          />
          <Text 
            style={{ 
              color: '#FBBF24',
              textShadowColor: 'rgba(245, 158, 11, 0.5)',
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 2
            }} 
            fontSize={isMobile ? 10 : 12} 
            fontWeight="700"
            letterSpacing={0.2}
          >
            {player.coins >= 1000000
              ? `${(player.coins / 1000000).toFixed(1)} M`
              : player.coins >= 1000
              ? `${(player.coins / 1000).toFixed(1)} K`
              : player.coins}
          </Text>
        </XStack>
      </YStack>
    </XStack>
  )
}

// Main Game Table Component
export default function GameTable() {
  const { width, height, isMobile, isTablet } = useResponsive()

  // Mock Data
  const [players] = useState<Player[]>([
    { id: '1', username: 'GUEST001', coins: 3500000, avatar: '🎮', isCurrentTurn: true },
    { id: '2', username: 'GUEST689', coins: 5500000, avatar: '👨', isCurrentTurn: false },
    { id: '3', username: 'GUEST391', coins: 9100000, avatar: '👩', isCurrentTurn: false },
    { id: '4', username: 'GUEST252', coins: 6900000, avatar: '👴', isCurrentTurn: false },
    { id: '5', username: 'GUEST258', coins: 6900000, avatar: '👧', isCurrentTurn: false },
  ])

  const [playerHand] = useState<Card[]>([
    { suit: '♠', rank: 'A', id: 'c1' },
    { suit: '♠', rank: '4', id: 'c2' },
    { suit: '♠', rank: 'J', id: 'c3' },
    { suit: '♠', rank: 'K', id: 'c4' },
    { suit: '♦', rank: 'Q', id: 'c5' },
    { suit: '♥', rank: '5', id: 'c6' },
    { suit: '♥', rank: '8', id: 'c7' },
  ])

  const [centerCards] = useState<Card[]>([
    { suit: '♣', rank: '4', id: 'cc1' },
    { suit: '♠', rank: '2', id: 'cc2' },
    { suit: '♦', rank: 'K', id: 'cc3' },
    { suit: '♥', rank: '3', id: 'cc4' },
    { suit: '♦', rank: '3', id: 'cc5' },
  ])

  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set())
  const [trumpCard] = useState<Card>({ suit: '♠', rank: 'A', id: 'trump' })

  // Floating decorative cards
  const floatingCards = [
    { suit: '♣' as CardSuit, rank: 'A' as CardRank, top: '5%', right: '10%', rotation: 15 },
    { suit: '♦' as CardSuit, rank: 'K' as CardRank, top: '8%', right: '25%', rotation: -20 },
    { suit: '♥' as CardSuit, rank: 'Q' as CardRank, top: '3%', left: '15%', rotation: 25 },
  ]

  const toggleCardSelection = (cardId: string) => {
    setSelectedCards((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(cardId)) {
        newSet.delete(cardId)
      } else {
        newSet.add(cardId)
      }
      return newSet
    })
  }

  const cardSize = isMobile ? 'normal' : isTablet ? 'normal' : 'large'
  const centerCardSize = isMobile ? 'small' : 'normal'

  const currentPlayer = players[0]
  const otherPlayers = players.slice(1)

  return (
    <YStack flex={1} bg="$background" overflow="hidden" width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      <Stack flex={1} position="relative" overflow="hidden">
        <LinearGradient
          colors={['#2563EB', '#1E40AF', '#1E3A8A']}
          start={[0, 0]}
          end={[1, 1]}
          style={{ flex: 1, position: 'absolute', width: '100%', height: '100%' }}
        />

        {/* Floating decorative cards */}
        {floatingCards.map((card, idx) => {
          const cardColor = getSuitColor(card.suit)
          return (
            // @ts-ignore - Tamagui props
            <YStack
              key={idx}
              width={isMobile ? 40 : 60}
              height={isMobile ? 56 : 84}
              bg="white"
              br="$2"
              jc="center"
              ai="center"
              opacity={0.3}
              animation="lazy"
              style={{
                position: 'absolute',
                top: card.top,
                left: card.left,
                right: card.right,
                transform: `rotate(${card.rotation}deg)`,
              }}
            >
              <Text fontSize={isMobile ? 16 : 24} fontWeight="bold" style={{ color: cardColor }}>
                {card.rank}
              </Text>
              <Text fontSize={isMobile ? 14 : 20} style={{ color: cardColor }}>
                {card.suit}
              </Text>
            </YStack>
          )
        })}

        {/* Other players on top/left/right borders */}
        {otherPlayers.map((player, idx) => (
          <PlayerInfo
            key={player.id}
            player={player}
            position={getPlayerPosition(idx + 1, players.length, width, height, isMobile)}
            isMobile={isMobile}
          />
        ))}

        {/* Center playing area */}
        {/* @ts-ignore - Tamagui props */}
        <YStack
          gap="$3"
          ai="center"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* @ts-ignore - Tamagui props */}
          <XStack gap={isMobile ? '$1' : '$2'} flexWrap="wrap" jc="center" maxWidth={isMobile ? 200 : 300}>
            {centerCards.map((card) => (
              <GameCard
                key={card.id}
                card={card}
                size={centerCardSize}
              />
            ))}
          </XStack>
        </YStack>

        {/* Bottom border - Current player section */}
        <YStack
          position="absolute"
          bottom={0}
          left={0}
          right={0}
          paddingVertical={isMobile ? '$2' : '$3'}
          paddingHorizontal={isMobile ? '$3' : '$4'}
        >
          {/* Single row: Player info (left) | Cards (center) */}
          {/* @ts-ignore - Tamagui props */}
          <XStack jc="space-between" ai="flex-end" gap="$3">
            {/* Left: Current player info */}
            {/* @ts-ignore - Tamagui props */}
            <XStack 
              gap="$2" 
              ai="center" 
              flex={0}
              bg="linear-gradient(135deg, rgba(0, 0, 0, 0.85) 0%, rgba(30, 30, 50, 0.85) 100%)"
              br="$4"
              py="$2"
              px="$2"
              borderWidth={currentPlayer.isCurrentTurn ? 2 : 1.5}
              borderColor={currentPlayer.isCurrentTurn ? '#10B981' : 'rgba(255, 255, 255, 0.15)'}
              shadowColor={currentPlayer.isCurrentTurn ? '#10B981' : '#000'}
              shadowRadius={currentPlayer.isCurrentTurn ? 12 : 6}
              shadowOpacity={currentPlayer.isCurrentTurn ? 0.9 : 0.5}
              shadowOffset={{ width: 0, height: 3 }}
              animation="quick"
              style={{
                backgroundColor: 'rgba(15, 20, 35, 0.92)',
                backdropFilter: 'blur(10px)',
              }}
            >
              {/* Avatar with glow effect */}
              <YStack position="relative">
                {currentPlayer.isCurrentTurn && (
                  <Circle 
                    size={isMobile ? 42 : 54} 
                    position="absolute" 
                    top={-3} 
                    left={-3}
                    bg="#10B981"
                    opacity={0.3}
                    animation="quick"
                  />
                )}
                <Circle 
                  size={isMobile ? 36 : 48} 
                  overflow="hidden" 
                  bg="linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%)"
                  borderWidth={1.5}
                  borderColor={currentPlayer.isCurrentTurn ? '#10B981' : 'rgba(255, 255, 255, 0.2)'}
                  shadowColor="#000"
                  shadowRadius={3}
                  shadowOpacity={0.3}
                  style={{ backgroundColor: '#F1F5F9' }}
                >
                  <Text fontSize={isMobile ? 18 : 24}>{currentPlayer.avatar}</Text>
                </Circle>
              </YStack>
              
              <YStack gap="$1">
                <Text
                  style={{ 
                    color: 'white',
                    textShadowColor: 'rgba(0, 0, 0, 0.5)',
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 2
                  }}
                  fontSize={isMobile ? 11 : 13}
                  fontWeight="700"
                  letterSpacing={0.3}
                >
                  {currentPlayer.username}
                </Text>
                {/* @ts-ignore - Tamagui props */}
                <XStack 
                  gap="$1" 
                  ai="center"
                  bg="rgba(245, 158, 11, 0.15)"
                  py="$0.5"
                  px="$1.5"
                  br="$2"
                >
                  <Circle 
                    size={isMobile ? 10 : 12} 
                    bg="linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)"
                    shadowColor="#F59E0B"
                    shadowRadius={3}
                    shadowOpacity={0.6}
                    style={{ backgroundColor: '#F59E0B' }}
                  />
                  <Text 
                    style={{ 
                      color: '#FBBF24',
                      textShadowColor: 'rgba(245, 158, 11, 0.5)',
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 2
                    }} 
                    fontSize={isMobile ? 10 : 12} 
                    fontWeight="700"
                    letterSpacing={0.2}
                  >
                    {currentPlayer.coins >= 1000000
                      ? `${(currentPlayer.coins / 1000000).toFixed(1)} M`
                      : currentPlayer.coins >= 1000
                      ? `${(currentPlayer.coins / 1000).toFixed(1)} K`
                      : currentPlayer.coins}
                  </Text>
                </XStack>
              </YStack>
            </XStack>

            {/* Right: Empty space for balance */}
            <YStack flex={0} width={isMobile ? 40 : 48} />
          </XStack>
        </YStack>

        {/* Center: Player's hand - Positioned at middle of bottom border */}
        {/* @ts-ignore - Tamagui props */}
        <XStack
          gap={isMobile ? -15 : -20}
          ai="flex-end"
          jc="center"
          position="absolute"
          style={{
            bottom: isMobile ? 10 : 15,
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
          {playerHand.map((card) => (
            <GameCard
              key={card.id}
              card={card}
              selected={selectedCards.has(card.id)}
              onPress={() => toggleCardSelection(card.id)}
              size={cardSize}
            />
          ))}
        </XStack>

        {/* Trump card - Popping out from bottom right corner */}
        {/* @ts-ignore - Tamagui props */}
        <YStack
          width={isMobile ? 90 : 120}
          height={isMobile ? 126 : 168}
          bg="white"
          br="$2"
          jc="center"
          ai="center"
          borderWidth={3}
          borderColor="#F59E0B"
          shadowColor="#F59E0B"
          shadowOffset={{ width: -4, height: -4 }}
          shadowOpacity={0.6}
          shadowRadius={12}
          animation="bouncy"
          position="absolute"
          style={{
            bottom: isMobile ? -20 : -30,
            right: isMobile ? -15 : -20,
            transform: `rotate(-25deg)`,
            zIndex: 100,
          }}
        >
          {/* HUKAM label */}
          <YStack
            bg="#F59E0B"
            paddingHorizontal="$2"
            paddingVertical="$1"
            position="absolute"
            top={0}
            right={0}
            br="$2"
          >
            <Text
              style={{ color: 'white' }}
              fontWeight="bold"
              fontSize={isMobile ? 10 : 11}
            >
              HUKAM
            </Text>
          </YStack>

          {/* Card content */}
          <Text
            fontSize={isMobile ? 36 : 48}
            fontWeight="bold"
            style={{ color: getSuitColor(trumpCard.suit) }}
            lineHeight={isMobile ? 36 : 48}
          >
            {trumpCard.rank}
          </Text>
          <Text
            fontSize={isMobile ? 30 : 40}
            style={{ color: getSuitColor(trumpCard.suit) }}
            lineHeight={isMobile ? 30 : 40}
          >
            {trumpCard.suit}
          </Text>
        </YStack>
      </Stack>
    </YStack>
  )
}
