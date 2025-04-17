import { useCallback } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useMapStore } from '@features/transactionMap/stores/useMapStore'
import { computeNewNodePositions } from '@features/transactionMap/utils/positionUtils' // 위치 계산 유틸리티
import { createEdge } from '@features/transactionMap/utils/graphUtils'
import { VERTICAL_GAP } from '@features/transactionMap/config/constants.js' // 엣지 생성 유틸리티

/**
 * 그래프에 단일 노드와 연결 엣지를 동적으로 추가하는 커스텀 훅.
 * 위치 계산은 이 훅에서 수행하고, 스토어는 최종 데이터를 받습니다.
 *
 * @param {string | null} tabId - 현재 활성화된 탭 ID
 * @returns {{
 * addNode: (params: { newNodeData: object, sourceNodeId: string, isRight: boolean, edgeData: object }) => void,
 * isLoading: boolean,
 * isError: boolean,
 * error: Error | null
 * }}
 */
export function useAddNode(tabId) {
  const { getState, addNodes, addEdges, updateNodes } = useMapStore()

  const addNodeMutation = useMutation({
    /**
     * @param {object} params
     * @param {object} params.newNodeData - 추가할 노드의 기본 데이터 (id, type, data - position 제외)
     * @param {string} params.sourceNodeId - 연결될 그래프 상의 기존 노드 ID
     * @param {boolean} params.isRight - 새 노드가 sourceNode 오른쪽에 위치하는지 여부
     * @param {object} params.edgeData - 연결 엣지에 포함될 데이터 (value, time, token 등)
     */
    mutationFn: async ({ newNodeData, sourceNodeId, isRight, edgeData }) => {
      if (!tabId || !newNodeData || !newNodeData.id || !sourceNodeId) {
        throw new Error('노드 추가에 필요한 정보(tabId, newNodeData, sourceNodeId)가 부족합니다.')
      }

      const state = getState()
      const tabState = state.tabs[tabId]
      if (!tabState) throw new Error(`탭 ${tabId}을(를) 찾을 수 없습니다.`)
      const { nodes: currentNodes, edges: currentEdges, occupied: currentOccupied } = tabState.data

      // 추가할 노드가 이미 존재하는지 확인
      const existingNode = currentNodes.find((n) => n.id === newNodeData.id)
      if (existingNode) {
        console.warn(`[useAddNode] 노드 ${newNodeData.id}가 이미 탭 ${tabId}에 존재합니다.`)
        return { nodeAdded: false }
      }

      // sourceNode 정보 가져오기
      const sourceNode = currentNodes.find((n) => n.id === sourceNodeId)
      if (
        !sourceNode ||
        !sourceNode.position ||
        sourceNode.position.x == null ||
        sourceNode.position.y == null
      ) {
        throw new Error(`소스 노드 ${sourceNodeId}를 찾을 수 없거나 유효한 위치 정보가 없습니다.`)
      }
      const baseX = sourceNode.position.x
      const baseY = sourceNode.position.y

      // 새 노드 위치 계산
      const occupiedCopy = new Set(currentOccupied)
      const [newNodePosition] = computeNewNodePositions(baseX, baseY, 1, VERTICAL_GAP, occupiedCopy)

      if (!newNodePosition) {
        throw new Error('새 노드의 위치를 계산할 수 없습니다. 주변에 빈 공간이 부족할 수 있습니다.')
      }

      // 최종 노드 객체 준비 (위치, 관계 정보 포함)
      const finalNewNode = {
        ...newNodeData,
        position: newNodePosition,
        data: {
          ...(newNodeData.data || {}),
          motherNode: sourceNodeId, // 부모 노드 ID 설정
          isRight: isRight, // 방향 설정
          childNodes: [] // 새로 추가된 노드는 자식 없음
        }
      }

      // 연결 엣지 객체 준비
      const edgeId = isRight
        ? `${sourceNodeId}-${finalNewNode.id}`
        : `${finalNewNode.id}-${sourceNodeId}`
      const source = isRight ? sourceNodeId : finalNewNode.id
      const target = isRight ? finalNewNode.id : sourceNodeId
      let newEdge = null

      // 엣지가 이미 존재하는지 확인
      const existingEdge = currentEdges.find((e) => e.id === edgeId)
      if (existingEdge) {
        console.warn(`[useAddNode] 엣지 ${edgeId}가 이미 탭 ${tabId}에 존재합니다.`)
        // 필요시 기존 엣지 업데이트 또는 다른 처리
      } else {
        newEdge = createEdge(
          edgeId,
          source,
          target,
          edgeData?.value || 0,
          edgeData?.time || null,
          edgeData?.token || finalNewNode.data?.mainNet || ''
        )
        // edgeData의 추가 정보 병합
        newEdge.data = { ...newEdge.data, ...(edgeData || {}) }
      }

      // sourceNode 업데이트 정보 준비 (childNodes 추가)
      // 기존 childNodes 가져오기 (없으면 빈 배열)
      const currentChildNodes = sourceNode.data?.childNodes || []
      // 새 노드 ID가 이미 포함되어 있지 않으면 추가
      const newChildNodes = currentChildNodes.includes(finalNewNode.id)
        ? currentChildNodes
        : [...currentChildNodes, finalNewNode.id]

      const sourceNodeUpdatePayload = {
        id: sourceNodeId,
        updates: {
          // data 객체 전체를 업데이트하는 것이 Immer에서 안전할 수 있음
          data: {
            ...sourceNode.data, // 기존 data 유지
            childNodes: newChildNodes // 업데이트된 childNodes
          }
        }
      }

      // 스토어 업데이트를 위해 필요한 정보 반환 (onSuccess에서 사용)
      return {
        newNode: finalNewNode,
        newEdge: newEdge,
        sourceNodeUpdate: sourceNodeUpdatePayload
      }
    },
    // onSuccess: 뮤테이션 성공 시 스토어 상태 업데이트
    onSuccess: (data) => {
      if (!tabId || !data || data.nodeAdded === false) return

      const { newNode, newEdge, sourceNodeUpdate } = data

      // 새 노드 추가 (addNodes 는 position 있는 노드 받아서 처리)
      if (newNode) {
        addNodes(tabId, [newNode]) // baseX, baseY 불필요
      }

      // 새 엣지 추가 (null 아니면)
      if (newEdge) {
        addEdges(tabId, [newEdge])
      }

      // 소스 노드 업데이트 (childNodes)
      // todo 업데이트, 노드 추가 한 트랜잭션에 묶이도록
      if (sourceNodeUpdate) {
        updateNodes(tabId, [sourceNodeUpdate])
      }
    },
    // onError: 뮤테이션 실패 시 에러 로깅
    onError: (error, variables) => {
      console.error(
        `[useAddNode onError] Tab: ${tabId}, Error:`,
        error,
        'Variables:',
        variables // 어떤 입력으로 실패했는지 확인
      )
    }
  })

  const addNode = useCallback(
    (params) => {
      if (!tabId) {
        console.error('[addNode] Active tab ID is not set.')
        return
      }
      addNodeMutation.mutate(params)
    },
    [tabId, addNodeMutation]
  )

  return {
    addNode,
    isLoading: addNodeMutation.isPending,
    isError: addNodeMutation.isError,
    error: addNodeMutation.error
  }
}
