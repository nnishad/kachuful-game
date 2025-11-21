import { memo } from 'react'
import { Text, YStack } from 'tamagui'
import type { PlayingCard } from './types'
import { getSuitColor } from './helpers'

export type GameCardSize = 'small' | 'normal' | 'large'

interface GameCardProps {
  card: PlayingCard
  selected?: boolean
  size?: GameCardSize
  onPress?: () => void
}

const sizeMap: Record<GameCardSize, { width: number; height: number; fontSize: number }> = {
  small: { width: 40, height: 56, fontSize: 16 },
  normal: { width: 60, height: 84, fontSize: 24 },
  large: { width: 80, height: 112, fontSize: 32 },
}

function Component({ card, selected, onPress, size = 'normal' }: GameCardProps) {
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

export const GameCard = memo(Component)
