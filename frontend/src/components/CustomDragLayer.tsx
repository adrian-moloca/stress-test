import React from 'react'
import { DragLayerMonitor, useDragLayer } from 'react-dnd'
import { CaseBullet } from 'components/pages/Calendar/CaseBullet'

const CustomDragLayer = () => {
  const {
    isDragging,
    currentOffset,
    item,
    initialPointerOffset,
    initialSourceOffset
  } = useDragLayer(
    (monitor: DragLayerMonitor) => {
      return {
        isDragging: monitor.isDragging(),
        currentOffset: monitor.getSourceClientOffset(),
        initialPointerOffset: monitor.getInitialClientOffset(),
        initialSourceOffset: monitor.getInitialSourceClientOffset(),
        item: monitor.getItem(),
      }
    },
  )

  if (isDragging && currentOffset && initialPointerOffset && initialSourceOffset) {
    const initialOffset = {
      x: initialPointerOffset.x - initialSourceOffset.x,
      y: initialPointerOffset.y - initialSourceOffset.y,
    }
    const offset = {
      x: currentOffset.x + initialOffset.x,
      y: currentOffset.y + initialOffset.y,
    }

    return (
      <div
        style={{
          // functional
          transform: `translate(${offset.x}px, ${offset.y}px)`,
          position: 'fixed',
          top: 0,
          left: 0,
          pointerEvents: 'none',

          // design only
          zIndex: 2000,
        }}
      >
        <CaseBullet {...{ c: item }} />
      </div>
    )
  }

  return null
}

export default CustomDragLayer
