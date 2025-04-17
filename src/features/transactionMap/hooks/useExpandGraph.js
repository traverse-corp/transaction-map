import { useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useMapStore } from '@features/transactionMap/stores/useMapStore'
import { processDenyListGraph } from '@features/transactionMap/services/graphService'
import { getNetworkConfig } from '@features/transactionMap/config/networkConfig'
import { computeNewNodePositions } from '@features/transactionMap/utils/positionUtils'
import { HORIZONTAL_GAP, NODE_TYPES, VERTICAL_GAP } from '@features/transactionMap/config/constants'

/**
 * 그래프 확장(노드/엣지 추가 및 위치 계산)을 처리하는 커스텀 훅.
 * 네트워크 타입에 따라 다른 데이터 처리 및 위치 계산 로직을 사용합니다.
 *
 * @param {string} network - 현재 선택된 네트워크 (예: 'BTC', 'ETH')
 * @returns {{
 * expandGraph: (params: { tabId: string, currentNode: object, queryParams: object }) => void,
 * isLoading: boolean,
 * isError: boolean,
 * error: Error | null
 * }}
 */
export function useExpandGraph(network) {
  const queryClient = useQueryClient()
  const { addNodes, addEdges } = useMapStore()
  const networkConfig = getNetworkConfig(network)
  if (!networkConfig) {
    console.error(`[useExpandGraph] 초기화 시점에 유효하지 않은 네트워크 설정: ${network}`)
  }

  const expansionMutation = useMutation({
    /**
     * 뮤테이션 함수: 데이터 조회, 처리, 위치 계산 수행
     * @param {object} variables - mutate 함수로부터 전달받은 변수 객체
     * @param {string} variables.tabId - 대상 탭 ID
     * @param {object} variables.currentNode - 확장의 기준이 되는 노드 객체 (위치 포함)
     * @param {object} variables.queryParams - API 호출 파라미터 (direction 등)
     * @param {Array<object>} variables.currentNodesFromStore - 호출 시점의 스토어 노드 목록
     * @param {Array<object>} variables.currentEdgesFromStore - 호출 시점의 스토어 엣지 목록
     * @param {Set<string>} variables.currentOccupied - 호출 시점의 스토어 occupied Set
     * @returns {Promise<object>} { nodesToAddWithPosition, edgesToAdd }
     */
    mutationFn: async ({
      tabId,
      currentNode,
      queryParams,
      currentNodesFromStore,
      currentEdgesFromStore,
      currentOccupied
    }) => {
      // 실행 시점 네트워크 설정 및 유효성 검사
      const currentNetworkConfig = getNetworkConfig(network) // 실행 시점 network 기준 재확인
      if (!currentNetworkConfig) throw new Error(`네트워크 설정 로드 실패: ${network}`)
      const { coin, getGraphApiFn, getAddressInfoApiFn, getDenylistDataApiFn, processGraphDataFn } =
        currentNetworkConfig
      if (!processGraphDataFn || !getAddressInfoApiFn || !getDenylistDataApiFn || !getGraphApiFn)
        throw new Error(`네트워크 설정 함수 누락: ${network}`)
      if (!tabId) throw new Error('Mutation function requires a valid tabId.')

      const sourceNode = currentNode
      const address = sourceNode?.data?.address || queryParams?.address
      if (!address) throw new Error('Address is required.')
      if (!sourceNode?.position || sourceNode.position.x == null || sourceNode.position.y == null)
        throw new Error('Source node position is required for layout.')

      // --- 데이터 병렬 조회 ---
      const [rawGraphData, rawAddressInfo, rawDenylistData] = await Promise.all([
        queryClient.fetchQuery({
          queryKey: ['graphData', coin, address, queryParams],
          queryFn: () => getGraphApiFn({ coin, address, ...queryParams }),
          staleTime: 1000 * 60
        }),
        queryClient.fetchQuery({
          queryKey: ['addressInfo', coin, address],
          queryFn: () => getAddressInfoApiFn({ coin, address }),
          staleTime: 1000 * 60 * 5
        }),
        queryClient.fetchQuery({
          queryKey: ['denylistData', address],
          queryFn: () => getDenylistDataApiFn({ walletAddress: address }),
          staleTime: 1000 * 60 * 5
        })
      ])

      // --- 초기 그래프 데이터 처리 ---
      const initialGraph = processGraphDataFn(
        { addressInfo: rawAddressInfo, transactionMap: rawGraphData },
        address,
        queryParams.direction
      )
      if (!initialGraph?.nodes) {
        console.warn(`[useExpandGraph] Initial graph processing failed: ${coin}, ${address}`)
        return { nodesToAddWithPosition: [], edgesToAdd: [] }
      }

      let processedNodes = initialGraph.nodes
      let processedEdges = initialGraph.edges

      // --- Denylist 처리 --- todo 비트 외 네트워크도 처리할 수 있도록 수정, deny 있을 경우 트랜잭션 맵 조회안하게 빼야함.
      let denyListAddedNodeIds = new Set()
      if (coin === 'BTC' && rawDenylistData?.sourceDetails?.length > 0) {
        const denyListResult = processDenyListGraph(
          rawDenylistData,
          initialGraph.nodes, // 초기 처리 결과 전달
          initialGraph.edges, // 초기 처리 결과 전달
          coin,
          address
        )

        // Denylist로 새로 추가된 노드 식별 (initialGraph 기준)
        const initialNodeIds = new Set(initialGraph.nodes.map((n) => n.id))
        denyListResult.nodes.forEach((node) => {
          if (node && node.id && !initialNodeIds.has(node.id)) {
            denyListAddedNodeIds.add(node.id)
          }
        })
        processedNodes = denyListResult.nodes // Denylist 포함된 전체 노드
        processedEdges = denyListResult.edges // Denylist 포함된 전체 엣지
      }

      // --- 스토어 상태 기반 필터링 (실제 추가될 대상 식별) ---
      const existingNodeIdsInStore = new Set(currentNodesFromStore.map((n) => n.id))
      const nodesToAdd = processedNodes.filter(
        (node) => node && node.id && !existingNodeIdsInStore.has(node.id)
      )

      // 추가할 노드가 없으면, 추가될 엣지만 필터링하여 반환
      if (nodesToAdd.length === 0) {
        const existingEdgeIdsInStore = new Set(currentEdgesFromStore.map((e) => e.id))
        const edgesToAddFiltered = processedEdges.filter(
          (edge) => edge && edge.id && !existingEdgeIdsInStore.has(edge.id)
        )
        return { nodesToAddWithPosition: [], edgesToAdd: edgesToAddFiltered }
      }

      // --- 위치 계산 (네트워크별 분기) ---
      const nodesToAddWithPosition = [] // 최종 결과 (위치 포함)
      const calculatedPositionsMap = new Map() // 계산된 위치 임시 저장
      const occupiedCopy = new Set(currentOccupied || []) // 현재 점유된 위치 복사본

      // 1. 계산 대상 노드 분리 (소스노드 제외)
      const nodesForPositioning = nodesToAdd.filter((n) => n.id !== address)

      // 내부 헬퍼 함수: 위치 계산 및 Map 저장
      const calculateAndStorePositions = (nodes, baseX, baseY) => {
        if (!nodes || nodes.length === 0) return
        const positions = computeNewNodePositions(
          baseX,
          baseY,
          nodes.length,
          VERTICAL_GAP,
          occupiedCopy
        )
        nodes.forEach((node, idx) => {
          if (positions[idx]) {
            calculatedPositionsMap.set(node.id, positions[idx])
          } else {
            console.warn(`[useExpandGraph] Failed to calculate position for node ${node.id}`)
            calculatedPositionsMap.set(node.id, null)
          }
        })
      }

      // todo 위치 없을 시 null 대신 다른 처리 필요
      if (coin === 'BTC') {
        // --- 2. BTC: Tx 노드 위치 계산 ---
        const newTxNodes = nodesForPositioning.filter((n) => n.type === NODE_TYPES.TRANSACTION)
        if (newTxNodes.length > 0) {
          const rightTxNodes = newTxNodes.filter((n) => n.data?.isRight)
          const leftTxNodes = newTxNodes.filter((n) => !n.data?.isRight)
          calculateAndStorePositions(
            rightTxNodes,
            sourceNode.position.x + HORIZONTAL_GAP,
            sourceNode.position.y
          )
          calculateAndStorePositions(
            leftTxNodes,
            sourceNode.position.x - HORIZONTAL_GAP,
            sourceNode.position.y
          )
        }

        // --- 3. BTC: Addr 노드 위치 계산 ---
        const newAddrNodes = nodesForPositioning.filter(
          (n) => n.type === NODE_TYPES.ADDRESS || n.type === NODE_TYPES.WHITELIST
        )
        const addrNodesByTx = new Map()
        newAddrNodes.forEach((addrNode) => {
          const motherTxId = addrNode.data?.motherNode
          if (
            motherTxId &&
            calculatedPositionsMap.has(motherTxId) &&
            calculatedPositionsMap.get(motherTxId) !== null
          ) {
            // 부모 Tx 위치가 계산 완료되었는지 확인
            if (!addrNodesByTx.has(motherTxId)) addrNodesByTx.set(motherTxId, [])
            addrNodesByTx.get(motherTxId).push(addrNode)
          } else {
            calculatedPositionsMap.set(addrNode.id, null) // 부모 위치 없으면 계산 불가
          }
        })

        addrNodesByTx.forEach((addrNodesGroup, txId) => {
          const txNodePosition = calculatedPositionsMap.get(txId)
          if (!txNodePosition) return

          const rightAddrNodes = addrNodesGroup.filter((n) => n.data?.isRight)
          const leftAddrNodes = addrNodesGroup.filter((n) => !n.data?.isRight)
          calculateAndStorePositions(
            rightAddrNodes,
            txNodePosition.x + HORIZONTAL_GAP,
            txNodePosition.y
          )
          calculateAndStorePositions(
            leftAddrNodes,
            txNodePosition.x - HORIZONTAL_GAP,
            txNodePosition.y
          )
        })
      } else {
        // Non-BTC
        // --- 4. Non-BTC: Addr 노드 위치 계산 (1단계) ---
        const newAddrNodes = nodesForPositioning.filter(
          (n) => n.type === NODE_TYPES.ADDRESS || n.type === NODE_TYPES.WHITELIST
        )
        if (newAddrNodes.length > 0) {
          const rightAddrNodes = newAddrNodes.filter((n) => n.data?.isRight)
          const leftAddrNodes = newAddrNodes.filter((n) => !n.data?.isRight)
          calculateAndStorePositions(
            rightAddrNodes,
            sourceNode.position.x + HORIZONTAL_GAP,
            sourceNode.position.y
          )
          calculateAndStorePositions(
            leftAddrNodes,
            sourceNode.position.x - HORIZONTAL_GAP,
            sourceNode.position.y
          )
        }
      }

      // --- 5. 최종 노드 배열 생성 (계산된 위치 또는 null 적용) ---
      nodesToAdd.forEach((node) => {
        // 계산된 위치 가져오기 (없거나 null이면 null 유지)
        const calculatedPosition = calculatedPositionsMap.get(node.id) || node.position || null
        nodesToAddWithPosition.push({ ...node, position: calculatedPosition })
      })

      // 최종 엣지 필터링
      const existingEdgeIdsInStore = new Set(currentEdgesFromStore.map((e) => e.id))
      const edgesToAddFiltered = processedEdges.filter(
        (edge) => edge && edge.id && !existingEdgeIdsInStore.has(edge.id)
      )

      console.log(nodesToAddWithPosition, edgesToAddFiltered)
      return {
        nodesToAddWithPosition,
        edgesToAdd: edgesToAddFiltered
      }
    },
    onSuccess: (data, variables) => {
      const { tabId } = variables
      const { nodesToAddWithPosition, edgesToAdd } = data
      if (!tabId) return

      if (nodesToAddWithPosition && nodesToAddWithPosition.length > 0) {
        addNodes(tabId, nodesToAddWithPosition)
      }
      if (edgesToAdd && edgesToAdd.length > 0) {
        addEdges(tabId, edgesToAdd)
      }
    },
    onError: (error, variables) => {
      const { tabId } = variables
      const currentNetworkConfig = getNetworkConfig(network) // 에러 발생 시점의 config
      const errorCoin = currentNetworkConfig?.coin || network || 'N/A' // 에러 로깅 시 사용할 코인 정보
      console.error(
        `[useExpandGraph onError] Tab: ${tabId}, Network: ${errorCoin}, Error:`,
        error,
        'Variables:',
        variables
      )
    }
  })

  const expandGraph = useCallback(
    (params) => {
      const state = useMapStore.getState()
      const currentTabState = state.tabs[params.tabId]

      if (!params.tabId) {
        console.error('[expandGraph] tabId is required.')
        return
      }
      if (!params.currentNode?.position) {
        console.error('[expandGraph] currentNode with position is required.')
        return
      }
      if (!params.queryParams) {
        console.error('[expandGraph] queryParams are required.')
        return
      }
      const currentNetworkConfig = getNetworkConfig(network) // 최신 네트워크 설정 확인
      if (!currentNetworkConfig) {
        console.error(`[expandGraph] Network config not found for: ${network}`)
        return
      }
      if (!currentTabState) {
        console.warn(
          `[expandGraph] Tab state not found for ${params.tabId}, continuing mutation...`
        )
      }

      const currentNodes = currentTabState?.data?.nodes || []
      const currentEdges = currentTabState?.data?.edges || []
      const currentOccupied = currentTabState?.occupied || new Set()

      expansionMutation.mutate({
        ...params,
        currentNodesFromStore: currentNodes,
        currentEdgesFromStore: currentEdges,
        currentOccupied: currentOccupied
      })
    },
    [network, expansionMutation]
  )

  return {
    expandGraph,
    isLoading: expansionMutation.isPending,
    isError: expansionMutation.isError,
    error: expansionMutation.error
  }
}
