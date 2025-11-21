import { memo } from 'react'
import { Text, YStack } from 'tamagui'
import type { PlayingCard } from './types'
import { getSuitColor } from './helpers'

interface TrumpCardSpotlightProps {
  card: PlayingCard
  isMobile: boolean
}

function Component({ card, isMobile }: TrumpCardSpotlightProps) {
  return (
    // @ts-ignore - Tamagui props
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
        transform: 'rotate(-25deg)',
        zIndex: 100,
      }}
    >
      <YStack
        bg="#F59E0B"
        paddingHorizontal="$2"
        paddingVertical="$1"
        position="absolute"
        top={0}
        right={0}
        br="$2"
      >
        <Text style={{ color: 'white' }} fontWeight="bold" fontSize={isMobile ? 10 : 11}>
          HUKAM
        </Text>
      </YStack>

      <Text
        fontSize={isMobile ? 36 : 48}
        fontWeight="bold"
        style={{ color: getSuitColor(card.suit) }}
        lineHeight={isMobile ? 36 : 48}
      >
        {card.rank}
      </Text>
      <Text fontSize={isMobile ? 30 : 40} style={{ color: getSuitColor(card.suit) }} lineHeight={isMobile ? 30 : 40}>
        {card.suit}
      </Text>
    </YStack>
  )
}

export const TrumpCardSpotlight = memo(Component)
