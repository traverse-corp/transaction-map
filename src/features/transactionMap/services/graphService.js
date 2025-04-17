import {
  createAddrNode,
  createEdge,
  createTxNode,
  checkType
} from '@features/transactionMap/utils/graphUtils'

const EDGE_TYPE = 'timeValueEdge'
const DEFAULT_EDGE_STYLE = { stroke: '#000000' }
const DEFAULT_MARKER_END = {
  type: 'arrowclosed',
  width: 20,
  height: 20,
  color: '#000000'
}

// --- 헬퍼 함수 ---
/**
 * 여러 노드 컬렉션(배열, Map 값)에서 고유한 노드 목록을 생성합니다.
 * @param {...(Array<Object> | Map<string, Object>)} nodeCollections - 노드 배열 또는 Map 객체들
 * @returns {Array<Object>} 고유한 노드 배열
 */
const getUniqueNodesFromCollections = (...nodeCollections) => {
  const nodeMap = new Map()
  nodeCollections.forEach((collection) => {
    const items = Array.isArray(collection)
      ? collection
      : collection instanceof Map
        ? Array.from(collection.values())
        : []
    items.forEach((node) => {
      if (node && node.id && !nodeMap.has(node.id)) {
        nodeMap.set(node.id, node)
      }
    })
  })
  return Array.from(nodeMap.values())
}

/**
 * 여러 엣지 컬렉션(배열, Map 값)에서 고유한 엣지 목록을 생성합니다.
 * @param {...(Array<Object> | Map<string, Object>)} edgeCollections - 엣지 배열 또는 Map 객체들
 * @returns {Array<Object>} 고유한 엣지 배열
 */
const getUniqueEdgesFromCollections = (...edgeCollections) => {
  const edgeMap = new Map()
  edgeCollections.forEach((collection) => {
    const items = Array.isArray(collection)
      ? collection
      : collection instanceof Map
        ? Array.from(collection.values())
        : []
    items.forEach((edge) => {
      if (edge && edge.id && !edgeMap.has(edge.id)) {
        edgeMap.set(edge.id, edge)
      }
    })
  })
  return Array.from(edgeMap.values())
}

/**
 * 최종 노드 목록을 기반으로 각 노드의 motherNode 와 childNodes 관계를 설정합니다.
 * BTC: Main -> TX -> Addr 계층 구조 반영
 * Non-BTC: Main -> TX(가상) -> Addr 구조 반영
 * @param {Array<Object>} nodes - 전체 노드 배열
 */
const setupChildNodes = (nodes) => {
  const nodeMap = new Map(
    nodes.map((node) => (node && node.id ? [node.id, node] : null)).filter(Boolean)
  )

  // 각 노드의 childNodes 초기화
  nodes.forEach((node) => {
    if (node && node.data) {
      node.data.childNodes = []
    }
  })

  // 각 노드를 순회하며, 자신의 motherNode 를 가지는 노드를 찾아 해당 motherNode 의 childNodes 에 자신을 추가
  nodes.forEach((node) => {
    if (!node || !node.data || !node.data.motherNode) return // 부모 없으면 건너뜀 (메인 노드 등)

    const mother = nodeMap.get(node.data.motherNode)
    if (mother && mother.data) {
      if (!mother.data.childNodes) {
        mother.data.childNodes = []
      }
      // 중복 없이 자식 노드 ID 추가
      if (!mother.data.childNodes.includes(node.id)) {
        mother.data.childNodes.push(node.id)
      }
    } else {
      // console.warn(`[setupChildNodes] Mother node ${node.data.motherNode} not found for node ${node.id}`);
    }
  })
}

// --- BTC Graph Data Processing ---
export function processBtcGraphData(rawData, mainAddressId, direction = 'ALL') {
  const { addressInfo, transactionMap } = rawData

  // 1. 메인 노드 생성
  const mainAddressNode = {
    id: mainAddressId,
    type: checkType(addressInfo),
    data: {
      address: mainAddressId,
      mainNet: 'BTC',
      isMain: true,
      ...(addressInfo || {}),
      childNodes: []
    },
    position: { x: 0, y: 0 }
  }
  // 메인 노드의 motherNode는 null (기본값)

  if (!transactionMap?.transactionList?.length) {
    return { nodes: [mainAddressNode], edges: [] }
  }

  const edgesMap = new Map()
  const txNodesMap = new Map()
  const addrNodesMap = new Map()

  // 2. 트랜잭션 목록 순회하며 노드 및 엣지 정보 처리
  transactionMap.transactionList.forEach((item) => {
    if (!item?.transaction?.txId || !item?.address?.addr) {
      console.warn('[BTC] Skipping incomplete transaction item:', item)
      return
    }

    const txData = item.transaction
    const addrData = item.address
    const txId = txData.txId
    const relativeAddr = addrData.addr
    const motherValue = item.motherValue ?? 0
    const txTime = txData.timestamp
    const isRightDirection = motherValue > 0
    const childValue = Math.abs(item.childValue || 0)

    // --- 2a. 메인 주소 <-> Tx 노드 엣지 (값 합산) ---
    const mainTxEdgeId = `${mainAddressId}_${txId}`
    let mainTxEdgeInfo = edgesMap.get(mainTxEdgeId) || {
      id: mainTxEdgeId,
      data: { netValue: 0, time: txTime, token: 'BTC' },
      type: EDGE_TYPE,
      style: DEFAULT_EDGE_STYLE,
      markerEnd: DEFAULT_MARKER_END
    }
    mainTxEdgeInfo.data.netValue += motherValue
    mainTxEdgeInfo.data.time = txTime
    edgesMap.set(mainTxEdgeId, mainTxEdgeInfo)

    // --- 2b. Tx 노드 생성/가져오기 ---
    let txNode = txNodesMap.get(txId)
    if (!txNode) {
      // motherNode는 mainAddressId
      txNode = createTxNode(
        txId,
        isRightDirection,
        txData.block,
        txData.value ?? 0,
        txTime,
        [],
        mainAddressId
      )
      txNodesMap.set(txId, txNode)
    }
    // Tx 노드의 childNodes 는 나중에 setupChildNodes 에서 설정

    // --- 2c. Addr 노드 생성/가져오기 및 Tx<->Addr 엣지 생성 ---
    let addrNode = addrNodesMap.get(relativeAddr)
    if (!addrNode) {
      addrNode = createAddrNode(relativeAddr, isRightDirection, txId, 'BTC', addrData)
      addrNodesMap.set(relativeAddr, addrNode)
    }

    // Tx <-> Addr 엣지 (방향성 고려)
    if (isRightDirection && direction !== 'LEFT') {
      // OUT: Tx -> Addr
      const edgeTxToAddrId = `${txId}-${relativeAddr}-${txTime}`
      if (!edgesMap.has(edgeTxToAddrId)) {
        edgesMap.set(
          edgeTxToAddrId,
          createEdge(edgeTxToAddrId, txId, relativeAddr, childValue, txTime, 'BTC')
        )
      }
    } else if (!isRightDirection && direction !== 'RIGHT') {
      // IN: Addr -> Tx
      const edgeAddrToTxId = `${relativeAddr}-${txId}-${txTime}`
      if (!edgesMap.has(edgeAddrToTxId)) {
        edgesMap.set(
          edgeAddrToTxId,
          createEdge(edgeAddrToTxId, relativeAddr, txId, childValue, txTime, 'BTC')
        )
      }
    }
  })

  // 3. 최종 엣지 목록 생성
  const finalEdges = Array.from(edgesMap.values())
    .map((edge) => {
      if (edge.id.startsWith(`${mainAddressId}_`)) {
        // 메인-Tx 엣지 방향/값 조정
        const netValue = edge.data.netValue
        if (netValue === 0) return null
        const connectedTxId = edge.id.substring(mainAddressId.length + 1)
        return {
          ...edge,
          source: netValue > 0 ? mainAddressId : connectedTxId,
          target: netValue > 0 ? connectedTxId : mainAddressId,
          data: { ...edge.data, value: Math.abs(netValue) }
        }
      }
      return edge
    })
    .filter(Boolean)

  // 4. 최종 노드 목록 생성
  const nodes = getUniqueNodesFromCollections([mainAddressNode], txNodesMap, addrNodesMap)

  // 5. 노드 관계 설정 (childNodes만 설정)
  setupChildNodes(nodes)

  return { nodes, edges: finalEdges }
}

// --- Non-BTC Graph Data Processing ---
export function processNonBtcGraphData(rawData, mainAddressId, mainNet, direction = 'ALL') {
  const { addressInfo, addressList } = rawData

  // 1. 메인 노드 생성
  const mainAddressNode = {
    id: mainAddressId,
    type: checkType(addressInfo),
    data: { address: mainAddressId, mainNet, isMain: true, ...(addressInfo || {}), childNodes: [] },
    position: { x: 0, y: 0 }
  }

  if (!addressList?.length) {
    return { nodes: [mainAddressNode], edges: [] }
  }

  const edges = []
  const addrNodesMap = new Map()

  // 2. 주소 목록 순회 (Addr 노드 및 Main <-> Addr 엣지만 생성)
  addressList.forEach((item, idx) => {
    if (!item?.address?.addr || !item.relationType) return

    const addressData = item.address
    const transactionData = item.transaction || {}
    const relativeAddr = addressData.addr
    const isRight = item.relationType === 'OUT'

    if (relativeAddr === mainAddressId) return

    // --- 2a. 네트워크별 엣지 데이터 추출 ---
    let txId = '' // Tx 정보 식별용
    let edgeData = {}
    if (!txId) txId = `${mainAddressId}-${relativeAddr}-${idx}`

    // --- 2b. Addr 노드 생성/가져오기  ---
    let addrNode = addrNodesMap.get(relativeAddr)
    if (!addrNode) {
      addrNode = createAddrNode(relativeAddr, isRight, mainAddressId, mainNet, addressData)
      addrNodesMap.set(relativeAddr, addrNode)
    }

    // --- 2c. 엣지 생성 (Main <-> Addr) ---
    const edgeId = `${txId}-${idx}` // 고유 ID
    if (isRight && direction !== 'LEFT') {
      // OUT: Main -> Addr
      if (!edges.some((e) => e.id === edgeId)) {
        const edge = createEdge(
          edgeId,
          mainAddressId,
          relativeAddr,
          edgeData.value,
          edgeData.time,
          mainNet
        )
        edge.data = { ...edge.data, ...edgeData, transactionId: txId }
        edges.push(edge)
      }
    } else if (!isRight && direction !== 'RIGHT') {
      // IN: Addr -> Main
      if (!edges.some((e) => e.id === edgeId)) {
        const edge = createEdge(
          edgeId,
          relativeAddr,
          mainAddressId,
          edgeData.value,
          edgeData.time,
          mainNet
        )
        edge.data = { ...edge.data, ...edgeData, transactionId: txId }
        edges.push(edge)
      }
    }
  })

  // 3. 최종 노드 목록
  const nodes = getUniqueNodesFromCollections([mainAddressNode], addrNodesMap)

  // 4. 노드 관계 설정 (childNodes만 설정)
  setupChildNodes(nodes, mainAddressId)

  // 5. 최종 엣지 목록
  const finalEdges = getUniqueEdgesFromCollections(edges)

  return { nodes, edges: finalEdges }
}

/**
 * 재귀적으로 홉 데이터를 처리하여 새로운 노드와 엣지를 생성합니다.
 * @param {Object} currentNode - 현재 확장 기준 노드
 * @param {string} mainNet - 메인넷
 * @param {Array<Object>} remainingHops - 처리해야 할 남은 홉 데이터 배열
 * @param {Map<string, Object>} nodeMap - 전체 노드 맵 (중복 방지 및 추적용)
 * @param {Map<string, Object>} edgeMap - 전체 엣지 맵 (중복 방지용)
 * @returns {{ nextRemainingHops: Array<Object> }} - 다음 처리할 홉 목록 (노드/엣지는 Map에 직접 추가됨)
 */
function processHopsRecursively(currentNode, mainNet, remainingHops, nodeMap, edgeMap) {
  const relatedHop = remainingHops.find(
    (h) => h && h.walletAddress === currentNode.id && h.txHash && h.prevAddress
  )

  if (!relatedHop) {
    return { nextRemainingHops: remainingHops }
  }

  const currentTxHash = relatedHop.txHash
  const nextRemainingHops = remainingHops.filter((h) => h?.txHash !== currentTxHash)

  const txNodeId = currentTxHash
  const prevAddrId = relatedHop.prevAddress
  let transactionNode = nodeMap.get(txNodeId)
  let prevAddressNode = nodeMap.get(prevAddrId)

  // --- 거래 노드 생성/업데이트 ---
  if (!transactionNode) {
    transactionNode = createTxNode(
      txNodeId,
      false,
      relatedHop.block || null,
      relatedHop.value || 0,
      relatedHop.timestamp || null,
      [],
      currentNode.id // motherNode 설정
    )
    nodeMap.set(txNodeId, transactionNode)
  }
  // 관계 설정 (childNodes)
  if (!transactionNode.data.childNodes.includes(currentNode.id)) {
    transactionNode.data.childNodes.push(currentNode.id)
  }
  if (!transactionNode.data.childNodes.includes(prevAddrId)) {
    transactionNode.data.childNodes.push(prevAddrId)
  }

  // --- 이전 주소 노드 생성/업데이트 ---
  if (!prevAddressNode && prevAddrId) {
    prevAddressNode = createAddrNode(
      prevAddrId,
      false,
      txNodeId,
      mainNet,
      relatedHop.addressInfo || {}
    )
    prevAddressNode.data.motherNode = txNodeId // motherNode 설정
    prevAddressNode.data.childNodes = []
    nodeMap.set(prevAddrId, prevAddressNode)
  }

  // --- 엣지 생성 (중복 방지) ---
  const value = Math.abs(relatedHop.value || 0)
  const time = relatedHop.timestamp || null

  // prevAddress -> txHash
  const edgePrevToTxId = `${prevAddrId}-${txNodeId}`
  if (prevAddrId && !edgeMap.has(edgePrevToTxId)) {
    edgeMap.set(
      edgePrevToTxId,
      createEdge(edgePrevToTxId, prevAddrId, txNodeId, value, time, mainNet)
    )
  }
  // txHash -> walletAddress (currentNode)
  const edgeTxToCurrentId = `${txNodeId}-${currentNode.id}`
  if (!edgeMap.has(edgeTxToCurrentId)) {
    edgeMap.set(
      edgeTxToCurrentId,
      createEdge(edgeTxToCurrentId, txNodeId, currentNode.id, value, time, mainNet)
    )
  }

  // --- 다음 홉 재귀 처리 ---
  if (prevAddressNode && nextRemainingHops.length > 0) {
    // 이전 주소 노드를 기준으로 재귀 호출
    return processHopsRecursively(prevAddressNode, mainNet, nextRemainingHops, nodeMap, edgeMap)
  } else {
    // 더 탐색할 홉 없음
    return { nextRemainingHops }
  }
}

/**
 * processDenyListGraph
 * denyList 데이터를 기반으로 초기 그래프 데이터를 확장합니다.
 * @param {Object} denyList - denyList 데이터 (sourceDetails 배열 포함)
 * @param {Array<Object>} initialNodes - 초기 그래프 노드 배열
 * @param {Array<Object>} initialEdges - 초기 그래프 엣지 배열
 * @param {string} mainNet - 메인넷
 * @param {string} mainAddressId - 메인 주소 ID
 * @returns {{ nodes: Array<Object>, edges: Array<Object> }} - 확장된 노드/엣지 데이터
 */
export function processDenyListGraph(denyList, initialNodes, initialEdges, mainNet, mainAddressId) {
  const sourceDetails = denyList?.sourceDetails || []
  if (sourceDetails.length === 0) {
    return { nodes: initialNodes, edges: initialEdges }
  }

  const rootNode = initialNodes.find((n) => n?.id === mainAddressId)
  if (!rootNode) {
    console.warn('[processDenyListGraph] Root node not found.')
    return { nodes: initialNodes, edges: initialEdges }
  }

  // 노드와 엣지를 Map 으로 관리하여 재귀 함수 내에서 직접 업데이트
  const nodeMap = new Map(initialNodes.map((n) => (n && n.id ? [n.id, n] : null)).filter(Boolean))
  const edgeMap = new Map(initialEdges.map((e) => (e && e.id ? [e.id, e] : null)).filter(Boolean))

  // 재귀 호출 시작
  processHopsRecursively(rootNode, mainNet, sourceDetails, nodeMap, edgeMap)

  // 최종 결과 반환 (Map 의 값들을 배열로 변환)
  return {
    nodes: Array.from(nodeMap.values()),
    edges: Array.from(edgeMap.values())
  }
}

// --- 재귀 삭제 유틸리티 ---
export function getNodesToDeleteRecursively(startNodeId, allNodes) {
  if (!startNodeId || !Array.isArray(allNodes) || allNodes.length === 0) {
    return new Set()
  }
  const nodesToDelete = new Set()
  const queue = [startNodeId] // Set 대신 배열 사용, Set 은 순서 보장 안 함
  const visited = new Set() // 순환 방지용 방문 기록

  // nodeMap 생성 시 유효한 노드만 포함
  const nodeMap = new Map(
    allNodes.map((node) => (node && node.id ? [node.id, node] : null)).filter(Boolean)
  )

  if (!nodeMap.has(startNodeId)) {
    return nodesToDelete // 시작 노드가 없으면 빈 Set 반환
  }

  visited.add(startNodeId) // 시작 노드 방문 처리
  nodesToDelete.add(startNodeId) // 시작 노드 삭제 대상 추가

  let head = 0 // 큐 포인터
  while (head < queue.length) {
    // 큐가 빌 때까지
    const currentId = queue[head++] // 큐에서 꺼냄
    const currentNode = nodeMap.get(currentId)

    if (currentNode?.data?.childNodes && Array.isArray(currentNode.data.childNodes)) {
      currentNode.data.childNodes.forEach((childId) => {
        if (childId && nodeMap.has(childId) && !visited.has(childId)) {
          // 유효하고, 존재하고, 방문 안 한 자식
          visited.add(childId) // 방문 처리
          nodesToDelete.add(childId) // 삭제 대상 추가
          queue.push(childId) // 다음 탐색 위해 큐에 추가
        }
      })
    }
  }

  return nodesToDelete
}
