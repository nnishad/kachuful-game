export const getPlayerPosition = (
  index: number,
  total: number,
  containerWidth: number,
  containerHeight: number,
  isMobile: boolean
): Record<string, any> => {
  const padding = isMobile ? 10 : 20

  if (index === 0) {
    return { bottom: -1000 }
  }

  const otherPlayersCount = total - 1
  const otherIndex = index - 1

  if (total === 2) {
    return { top: padding, left: '50%', transform: 'translateX(-50%)' }
  }

  if (total === 3) {
    const positions = [
      { top: padding, left: '30%', transform: 'translateX(-50%)' },
      { top: padding, right: '30%', transform: 'translateX(50%)' },
    ]
    return positions[otherIndex]
  }

  if (total === 4) {
    const positions = [
      { top: padding, left: '50%', transform: 'translateX(-50%)' },
      { top: '50%', left: padding, transform: 'translateY(-50%)' },
      { top: '50%', right: padding, transform: 'translateY(-50%)' },
    ]
    return positions[otherIndex]
  }

  if (total === 5) {
    const positions = [
      { top: padding, left: '33%', transform: 'translateX(-50%)' },
      { top: padding, right: '33%', transform: 'translateX(50%)' },
      { top: '50%', left: padding, transform: 'translateY(-50%)' },
      { top: '50%', right: padding, transform: 'translateY(-50%)' },
    ]
    return positions[otherIndex]
  }

  const topCount = Math.ceil(otherPlayersCount / 3)
  const leftCount = Math.floor((otherPlayersCount - topCount) / 2)
  const rightCount = otherPlayersCount - topCount - leftCount

  if (otherIndex < topCount) {
    const spacing = containerWidth / (topCount + 1)
    return { top: padding, left: spacing * (otherIndex + 1) }
  } else if (otherIndex < topCount + leftCount) {
    const leftIndex = otherIndex - topCount
    const spacing = containerHeight / (leftCount + 1)
    return { left: padding, top: spacing * (leftIndex + 1) }
  }

  const rightIndex = otherIndex - topCount - leftCount
  const spacing = containerHeight / (rightCount + 1)
  return { right: padding, top: spacing * (rightIndex + 1) }
}
