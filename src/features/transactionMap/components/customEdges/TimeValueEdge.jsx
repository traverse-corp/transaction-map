import React from 'react'
import { BaseEdge, EdgeLabelRenderer, Position } from 'reactflow'
import { formatTokenValue } from '@features/transactionMap/utils/valueFormatter'
import {
  LABEL_X_OFFSET,
  LABEL_Y_OFFSET,
  NEAR_SOURCE_TURN_OFFSET,
  S_SHAPE_SOURCE_OFFSET,
  S_SHAPE_TARGET_OFFSET
} from '@features/transactionMap/config/constants.js'

// --- 상수 정의 ---
/**
 * 커스텀 스텝 엣지 경로 및 레이블 위치를 계산합니다.
 * @param {object} params - 경로 및 레이블 계산 파라미터
 * @returns {[string, number, number]} [SVG path d, labelX, labelY]
 */
function getCustomStepPathAndLabel({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition
}) {
  let d = ''
  let labelX = sourceX
  let labelY = sourceY

  // 1. 레이블 위치 계산 (소스 핸들 기준 - 수정)
  switch (sourcePosition) {
    case Position.Right:
      labelX = targetX - LABEL_X_OFFSET
      labelY = targetY
      break
    case Position.Left:
      labelX = sourceX - LABEL_X_OFFSET
      labelY = sourceY
      break
    case Position.Bottom:
      labelX = sourceX + LABEL_Y_OFFSET
      labelY = sourceY + LABEL_Y_OFFSET
      break
    case Position.Top:
      labelX = sourceX + LABEL_Y_OFFSET
      labelY = sourceY - LABEL_Y_OFFSET
      break
    default:
      labelX = sourceX + LABEL_X_OFFSET
      labelY = sourceY
      break
  }

  // 2. 엣지 경로 계산
  const midX = (sourceX + targetX) / 2
  const midY = (sourceY + targetY) / 2

  switch (sourcePosition) {
    case Position.Right: {
      // S-Shape 조건: Source Right 핸들 & sourceX >= targetX
      if (
        (targetPosition === Position.Left || targetPosition === Position.Right) &&
        sourceX >= targetX
      ) {
        // S-Shape 경로 (Source, Target 오프셋)
        const p1x = sourceX + S_SHAPE_SOURCE_OFFSET
        const p1y = sourceY
        const p4x = targetX - S_SHAPE_TARGET_OFFSET * (targetPosition === Position.Left ? 1 : -1)
        d = `M ${sourceX},${sourceY} L ${p1x},${p1y} L ${p1x},${midY} L ${p4x},${midY} L ${p4x},${targetY} L ${targetX},${targetY}`
      }
      // 일반 Step 경로 (Right -> Left/Right, 소스 offset 에서 꺾임)
      else if (targetPosition === Position.Left || targetPosition === Position.Right) {
        const turnXSource = sourceX + NEAR_SOURCE_TURN_OFFSET // 소스에서 12px 떨어진 X
        d = `M ${sourceX},${sourceY} L ${turnXSource},${sourceY} L ${turnXSource},${targetY} L ${targetX},${targetY}`
      }
      // Fallback (Right -> Top/Bottom)
      else {
        d = `M ${sourceX},${sourceY} L ${midX},${sourceY} L ${midX},${targetY} L ${targetX},${targetY}`
      }
      break
    }
    case Position.Left: {
      // S-Shape 조건: Source Left 핸들 & sourceX <= targetX & Target 은 Right 핸들
      if (targetPosition === Position.Right && sourceX <= targetX) {
        const p1x = sourceX - S_SHAPE_SOURCE_OFFSET
        const p1y = sourceY
        const p4x = targetX + S_SHAPE_TARGET_OFFSET * (targetPosition === Position.Right ? 1 : -1)
        d = `M ${sourceX},${sourceY} L ${p1x},${p1y} L ${p1x},${midY} L ${p4x},${midY} L ${p4x},${targetY} L ${targetX},${targetY}`
      } else if (targetPosition === Position.Right || targetPosition === Position.Left) {
        const turnXSource = sourceX - NEAR_SOURCE_TURN_OFFSET
        d = `M ${sourceX},${sourceY} L ${turnXSource},${sourceY} L ${turnXSource},${targetY} L ${targetX},${targetY}`
      } else {
        d = `M ${sourceX},${sourceY} L ${midX},${sourceY} L ${midX},${targetY} L ${targetX},${targetY}`
      }
      break
    }
    case Position.Bottom: {
      if (
        (targetPosition === Position.Top || targetPosition === Position.Bottom) &&
        sourceY >= targetY
      ) {
        const p1x = sourceX
        const p1y = sourceY + S_SHAPE_SOURCE_OFFSET
        const p4x = targetX
        const p4y = targetY - S_SHAPE_TARGET_OFFSET * (targetPosition === Position.Top ? 1 : -1)
        d = `M ${sourceX},${sourceY} L ${p1x},${p1y} L ${midX},${p1y} L ${midX},${p4y} L ${p4x},${p4y} L ${targetX},${targetY}`
      } else if (targetPosition === Position.Top || targetPosition === Position.Bottom) {
        const turnYSource = sourceY + NEAR_SOURCE_TURN_OFFSET // 소스에서 12px 떨어진 Y
        d = `M ${sourceX},${sourceY} L ${sourceX},${turnYSource} L ${targetX},${turnYSource} L ${targetX},${targetY}`
      } else {
        d = `M ${sourceX},${sourceY} L ${sourceX},${midY} L ${targetX},${midY} L ${targetX},${targetY}`
      }
      break
    }
    case Position.Top: {
      if (targetPosition === Position.Bottom && sourceY <= targetY) {
        const p1x = sourceX
        const p1y = sourceY - S_SHAPE_SOURCE_OFFSET
        const p4x = targetX
        const p4y = targetY + S_SHAPE_TARGET_OFFSET * (targetPosition === Position.Bottom ? 1 : -1)
        d = `M ${sourceX},${sourceY} L ${p1x},${p1y} L ${midX},${p1y} L ${midX},${p4y} L ${p4x},${p4y} L ${targetX},${targetY}`
      } else if (targetPosition === Position.Bottom || targetPosition === Position.Top) {
        const turnYSource = sourceY - NEAR_SOURCE_TURN_OFFSET // 소스에서 12px 떨어진 Y
        d = `M ${sourceX},${sourceY} L ${sourceX},${turnYSource} L ${targetX},${turnYSource} L ${targetX},${targetY}`
      } else {
        d = `M ${sourceX},${sourceY} L ${sourceX},${midY} L ${targetX},${midY} L ${targetX},${targetY}`
      }
      break
    }
    default: {
      const midX_fb = (sourceX + targetX) / 2
      const midY_fb = (sourceY + targetY) / 2
      if (sourcePosition === Position.Right || sourcePosition === Position.Left) {
        d = `M ${sourceX},${sourceY} L ${midX_fb},${sourceY} L ${midX_fb},${targetY} L ${targetX},${targetY}`
      } else {
        d = `M ${sourceX},${sourceY} L ${sourceX},${midY_fb} L ${targetX},${midY_fb} L ${targetX},${targetY}`
      }
      break
    }
  }

  if (!d) {
    /* empty */
  }

  return [d, labelX, labelY]
}

// --- TimeValueEdge 컴포넌트 정의 ---
export default function TimeValueEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data
}) {
  // 경로 및 레이블 위치 계산
  const [edgePath, labelX, labelY] = getCustomStepPathAndLabel({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition
  })

  // 데이터 포맷팅
  const formattedValue = data?.value != null ? formatTokenValue(data.value, data.token) : ''
  const tokenLabel = data?.token === 'erc' ? 'USDT' : data?.token?.toUpperCase()

  // edgePath 유효성 검사
  if (!edgePath || typeof edgePath !== 'string' || !edgePath.startsWith('M')) {
    console.error(`Invalid edgePath calculated for edge ${id}:`, edgePath)
    return null
  }

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      {formattedValue && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              fontSize: 8,
              pointerEvents: 'all',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              background: '#f0f0f0',
              padding: '1px 3px',
              borderRadius: '3px'
            }}
            className='nodrag nopan'
          >
            {formattedValue && tokenLabel && (
              <div style={{ textAlign: 'center' }}>
                {formattedValue} {tokenLabel}
              </div>
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
