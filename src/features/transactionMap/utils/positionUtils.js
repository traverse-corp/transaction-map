/**
 * 새로운 노드들의 위치를 계산합니다. 기준 위치부터 시작하여 수직으로 빈 공간을 찾아 배치합니다.
 * @param {number} baseX - 기준 X 좌표
 * @param {number} baseY - 기준 Y 좌표
 * @param {number} nodeCount - 배치할 새 노드의 수
 * @param {number} gridSize - 그리드 간격 (Y축 오프셋 계산용)
 * @param {Set<string>} occupied - 이미 차지된 위치 Set ('x,y' 형식, 직접 수정됨)
 * @returns {Array<{x: number, y: number}>} 계산된 새 노드들의 위치 배열
 */
export const computeNewNodePositions = (baseX, baseY, nodeCount, gridSize, occupied) => {
  const positions = []
  let magnitude = 0 // 오프셋 크기 (0, G, G, 2G, 2G...)
  let sign = 1 // 오프셋 부호 (+1 또는 -1)

  for (let i = 0; i < nodeCount; i++) {
    let currentOffset
    let newY

    // 사용 가능한 Y 좌표를 찾을 때까지 오프셋 조정 및 확인 반복
    do {
      // 오프셋 계산 순서: 0, +G, -G, +2G, -2G, ...
      if (magnitude === 0) {
        currentOffset = 0
        magnitude = gridSize // 다음 오프셋 크기 준비
        sign = 1 // 다음 부호는 +
      } else {
        currentOffset = magnitude * sign
        if (sign === 1) {
          sign = -1
        } else {
          sign = 1
          magnitude += gridSize
        }
      }
      newY = baseY + currentOffset // 새 Y 좌표 계산
    } while (occupied.has(`${baseX},${newY}`)) // 해당 위치가 점유되었는지 확인

    // 사용 가능한 위치 기록
    positions.push({ x: baseX, y: newY })
    occupied.add(`${baseX},${newY}`)
  }

  return positions
}

/**
 * 노드가 드롭된 목표 위치(targetPos)에서 가장 가까운 사용 가능한 그리드 위치를 계산합니다.
 * 목표 위치가 이미 차지된 경우, 수직 방향으로 가까운 빈 공간을 탐색합니다.
 *
 * @param {{x: number, y: number}} targetPos - 노드가 드롭된 목표 위치
 * @param {number} horizontalGap - 그리드 간격
 * @param {number} verticalGap - 그리드 간격
 * @param {Set<string>} occupied - 이미 차지된 위치 문자열('x,y')을 저장하는 Set 객체
 * @returns {{x: number, y: number}} 계산된 가장 가까운 사용 가능한 그리드 위치
 */
export const computeClosestAvailablePosition = (
  targetPos,
  horizontalGap,
  verticalGap,
  occupied
) => {
  // 목표 위치를 가장 가까운 그리드 좌표로 스냅
  let closestPos = {
    x: Math.round(targetPos.x / horizontalGap) * horizontalGap,
    y: Math.round(targetPos.y / verticalGap) * verticalGap
  }

  let offset = 0 // 탐색 오프셋

  // 스냅된 위치가 사용 가능할 때까지 반복
  while (occupied.has(`${closestPos.x},${closestPos.y}`)) {
    offset += verticalGap // 오프셋 증가

    // 아래쪽 탐색
    if (!occupied.has(`${closestPos.x},${closestPos.y + offset}`)) {
      closestPos.y += offset
      break // 빈 공간 찾으면 종료
    }
    // 위쪽 탐색
    if (!occupied.has(`${closestPos.x},${closestPos.y - offset}`)) {
      closestPos.y -= offset
      break // 빈 공간 찾으면 종료
    }
    // 만약 위/아래 모두 막혔다면 offset을 더 늘려 다음 루프에서 더 먼 곳 탐색
  }

  return closestPos
}
