import { create } from 'zustand'
import { produce, applyPatches, produceWithPatches } from 'immer'
import { getNodesToDeleteRecursively } from '@features/transactionMap/services/graphService'

const MAX_HISTORY = 10 // 히스토리 최대 저장 개수

// 각 탭의 초기 상태 정의 (occupied 포함)
const initialGraphState = {
  data: {
    nodes: [], // 노드 배열 { id, type, data, position }
    edges: [] // 엣지 배열 { id, source, target, data, ... }
  },
  occupied: new Set(), // 노드가 차지한 위치 정보 ('x,y' 형식의 문자열 Set)
  history: [], // Undo/Redo 히스토리 [{ patches, inversePatches }]
  historyPointer: -1, // 현재 히스토리 위치 인덱스 (-1은 히스토리 시작 전)
  zoomLevel: 1.0 // 현재 탭의 줌 레벨
}

/**
 * 헬퍼 함수: Immer produceWithPatches 결과를 사용하여 상태를 업데이트하고 히스토리를 관리합니다.
 * @param {string} tabId - 대상 탭 ID
 * @param {(draft: object) => void} patcher - Immer draft를 수정하는 함수
 * @param {Function} set - Zustand set 함수
 * @param {Function} get - Zustand get 함수
 */
function produceAndCommitHistory(tabId, patcher, set, get) {
  const currentTab = get().tabs[tabId]
  if (!currentTab) {
    console.error(`[Store Commit] Tab ${tabId} not found.`)
    return
  }

  // 1. produceWithPatches 실행
  const [nextState, patches, inversePatches] = produceWithPatches(currentTab, patcher)

  // 2. 변경 사항 없으면 종료 (상태는 이미 nextState로 설정됨 가정 - produce가 변경 없으면 원본 반환)
  if (patches.length === 0) {
    // 변경 없어도 set 호출하여 produce 결과 반영 (안전 장치)
    set(
      produce((state) => {
        if (state.tabs[tabId]) {
          state.tabs[tabId] = nextState
        }
      })
    )
    return
  }

  // 3. 히스토리 업데이트 (Immer draft 내에서 수행)
  set(
    produce((state) => {
      if (!state.tabs[tabId]) return

      const pointer = state.tabs[tabId].historyPointer
      const currentHistory = state.tabs[tabId].history

      // 현재 포인터 이후의 히스토리(redo 가능한 내역) 제거
      const newHistory = currentHistory.slice(0, pointer + 1)

      // 히스토리 최대 개수 제한
      if (newHistory.length >= MAX_HISTORY) {
        newHistory.shift() // 가장 오래된 히스토리 제거
      }

      // 새 히스토리 항목 추가 (redo용 patches, undo용 inversePatches)
      newHistory.push({ patches, inversePatches })

      // 상태 업데이트: nextState 적용, history 업데이트, 포인터 이동
      state.tabs[tabId] = {
        ...nextState,
        history: newHistory,
        historyPointer: newHistory.length - 1,
        // occupied Set은 nextState에 포함되어 있어야 함 (patcher가 수정했으므로)
        // 만약을 위해 nextState의 occupied를 다시 할당 (Set 참조 문제 방지)
        occupied: new Set(nextState.occupied || [])
      }
    })
  )
}

// Zustand 스토어 생성
export const useMapStore = create((set, get) => ({
  activeTab: null, // 현재 활성화된 탭 ID
  tabs: {}, // 탭별 상태 저장 객체 { [tabId]: TabState }

  // --- 탭 관리 액션 ---
  setActiveTab: (tabId) => set({ activeTab: tabId }),

  createTab: (tabId) =>
    set(
      produce((state) => {
        if (state.tabs[tabId]) return
        // 초기 상태 깊은 복사 및 Set 객체 재생성
        state.tabs[tabId] = JSON.parse(JSON.stringify(initialGraphState))
        state.tabs[tabId].occupied = new Set() // occupied 초기화
        state.tabs[tabId].history = [] // history 초기화
        state.tabs[tabId].historyPointer = -1 // 포인터 초기화
      })
    ),

  removeTab: (tabId) => {
    set(
      produce((state) => {
        if (!state.tabs[tabId]) return
        delete state.tabs[tabId]
        if (state.activeTab === tabId) {
          const remainingTabIds = Object.keys(state.tabs)
          state.activeTab = remainingTabIds[0] || null
        }
      })
    )
  },

  resetTab: (tabId) =>
    set(
      produce((state) => {
        if (state.tabs[tabId]) {
          // 초기 상태로 리셋 (깊은 복사 및 Set 재생성)
          state.tabs[tabId] = JSON.parse(JSON.stringify(initialGraphState))
          state.tabs[tabId].occupied = new Set() // occupied 리셋
          state.tabs[tabId].history = []
          state.tabs[tabId].historyPointer = -1
        }
      })
    ),

  // --- 노드 관리 액션 (Undo/Redo 가능) ---

  /**
   * 여러 노드를 스토어에 추가합니다. 노드 객체는 **position이 포함된 완전한 형태**여야 합니다.
   * 스토어는 위치를 계산하지 않지만, occupied Set은 업데이트합니다. (Undo/Redo 가능)
   * @param {string} tabId - 대상 탭 ID
   * @param {Array<Object>} nodesToAdd - 추가할 노드 객체 배열 (position 포함 필수)
   */
  addNodes: (tabId, nodesToAdd) => {
    produceAndCommitHistory(
      tabId,
      (draft) => {
        if (
          !draft?.data?.nodes ||
          !draft.occupied ||
          !Array.isArray(nodesToAdd) ||
          nodesToAdd.length === 0
        )
          return

        const uniqueNewNodesInput = nodesToAdd.filter(
          (newNode) =>
            newNode &&
            newNode.id &&
            !draft.data.nodes.some((existingNode) => existingNode.id === newNode.id)
        )

        if (uniqueNewNodesInput.length === 0) return

        uniqueNewNodesInput.forEach((node) => {
          // 노드 데이터 유효성 검사 (특히 position)
          if (!node.position || node.position.x == null || node.position.y == null) {
            console.warn(
              `[Store addNodes] Node ${node.id} is missing valid position. Skipping occupied update.`
            )
          } else {
            // Occupied Set 업데이트
            const posKey = `${node.position.x},${node.position.y}`
            if (draft.occupied.has(posKey)) {
              // 외부 로직이 충돌 없는 위치를 계산해서 전달해야 함
              console.warn(
                `[Store addNodes] Position ${posKey} for node ${node.id} is already occupied! Check external position calculation.`
              )
            }
            draft.occupied.add(posKey)
          }

          // 노드 데이터 보장 및 추가
          if (!node.data) node.data = {}
          if (!node.data.childNodes) node.data.childNodes = []
          draft.data.nodes.push(node) // 위치 포함된 노드 추가
        })
      },
      set,
      get
    )
  },

  /**
   * 지정된 노드들의 속성을 업데이트합니다. position 업데이트 시 occupied Set도 변경됩니다. (Undo/Redo 가능)
   * @param {string} tabId - 대상 탭 ID
   * @param {Array<{id: string, updates: Partial<Node>}>} nodeUpdates - 업데이트할 노드 정보 배열 (position 포함 가능)
   */
  updateNodes: (tabId, nodeUpdates) => {
    produceAndCommitHistory(
      tabId,
      (draft) => {
        if (!draft?.data?.nodes || !draft.occupied || !Array.isArray(nodeUpdates)) return

        nodeUpdates.forEach(({ id, updates }) => {
          const nodeIndex = draft.data.nodes.findIndex((n) => n.id === id)
          if (nodeIndex === -1) return

          const node = draft.data.nodes[nodeIndex]
          const oldPosKey = node.position ? `${node.position.x},${node.position.y}` : null
          const newPos = updates.position // 업데이트될 위치 정보
          const isPosChanging =
            newPos && (newPos.x !== node.position?.x || newPos.y !== node.position?.y)

          // 위치 변경 시 기존 위치 occupied에서 제거
          if (isPosChanging && oldPosKey) {
            draft.occupied.delete(oldPosKey)
          }

          // 노드 속성 업데이트 (직접 할당)
          for (const key in updates) {
            if (key !== 'id' && Object.prototype.hasOwnProperty.call(updates, key)) {
              if (key === 'data' && typeof updates.data === 'object' && updates.data !== null) {
                node.data = { ...(node.data || {}), ...updates.data } // data 객체 병합
              } else {
                node[key] = updates[key]
              }
            }
          }

          // 변경된 위치 occupied에 추가 (유효성 검사 및 충돌 경고)
          const newPosKey = node.position ? `${node.position.x},${node.position.y}` : null
          if (isPosChanging && newPosKey) {
            if (node.position.x == null || node.position.y == null) {
              console.warn(
                `[Store updateNodes] Node ${id} has invalid new position. Skipping occupied update.`
              )
            } else if (draft.occupied.has(newPosKey)) {
              console.warn(
                `[Store updateNodes] New position ${newPosKey} for node ${id} is already occupied! Check external position calculation.`
              )
              // 충돌 시에도 일단 추가 (외부 로직 책임 강조)
              draft.occupied.add(newPosKey)
            } else {
              draft.occupied.add(newPosKey)
            }
          }
        })
      },
      set,
      get
    )
  },

  /**
   * 지정된 ID의 노드들과 관련된 엣지들을 재귀적으로 삭제합니다. occupied Set도 업데이트합니다. (Undo/Redo 가능)
   * @param {string} tabId - 대상 탭 ID
   * @param {string} startNodeId - 삭제를 시작할 노드의 ID
   */
  removeNodesRecursively: (tabId, startNodeId) => {
    produceAndCommitHistory(
      tabId,
      (draft) => {
        if (!draft?.data?.nodes || !draft.occupied) return

        const allNodes = draft.data.nodes
        const nodeIdsToDelete = getNodesToDeleteRecursively(startNodeId, allNodes)

        if (nodeIdsToDelete.size === 0) return

        // 노드 삭제 및 occupied Set 업데이트
        draft.data.nodes = draft.data.nodes.filter((node) => {
          if (nodeIdsToDelete.has(node.id)) {
            // 노드의 위치 정보가 유효하면 occupied Set에서 제거
            if (node.position && node.position.x != null && node.position.y != null) {
              draft.occupied.delete(`${node.position.x},${node.position.y}`)
            }
            return false // 삭제
          }
          return true // 유지
        })

        // 관련 엣지 삭제
        draft.data.edges = draft.data.edges.filter(
          (edge) => !nodeIdsToDelete.has(edge.source) && !nodeIdsToDelete.has(edge.target)
        )
      },
      set,
      get
    )
  },

  // --- 엣지 관리 액션 (Undo/Redo 미적용) ---
  // 엣지 추가/삭제는 위치 정보와 직접 관련 없으므로 이전과 동일하게 유지
  addEdges: (tabId, edgesToAdd) => {
    set(
      produce((state) => {
        const tab = state.tabs[tabId]
        if (!tab?.data?.edges || !Array.isArray(edgesToAdd) || edgesToAdd.length === 0) return
        const existingEdgeIds = new Set(tab.data.edges.map((e) => e.id))
        edgesToAdd.forEach((edge) => {
          if (edge && edge.id && !existingEdgeIds.has(edge.id)) {
            tab.data.edges.push(edge)
          }
        })
      })
    )
  },

  removeEdgesByIds: (tabId, edgeIdsToRemove) => {
    set(
      produce((state) => {
        const tab = state.tabs[tabId]
        if (!tab?.data?.edges || !Array.isArray(edgeIdsToRemove) || edgeIdsToRemove.length === 0)
          return
        const idsSet = new Set(edgeIdsToRemove)
        tab.data.edges = tab.data.edges.filter((edge) => !idsSet.has(edge.id))
      })
    )
  },

  /**
   * occupied Set에서 특정 위치를 제거합니다.
   * (Undo/Redo 히스토리에 기록되지 않음)
   * @param {string} tabId - 대상 탭 ID
   * @param {{x: number, y: number} | null | undefined} position - 제거할 위치 객체
   */
  removeOccupiedPosition: (tabId, position) => {
    set(
      produce((state) => {
        const tab = state.tabs[tabId]
        // 위치 정보 및 occupied Set 유효성 검사
        if (!tab?.occupied || !position || position.x == null || position.y == null) {
          // console.warn(`[removeOccupiedPosition] Invalid position or occupied set for tab ${tabId}`);
          return
        }
        const posKey = `${position.x},${position.y}`
        tab.occupied.delete(posKey)
        // console.log(`[Store ${tabId}] Removed occupied: ${posKey}`);
      })
    )
  },

  // --- Undo / Redo 액션 (개선된 로직) ---
  undo: (tabId) => {
    set(
      produce((state) => {
        const tab = state.tabs[tabId]
        if (!tab || tab.historyPointer < 0) return // Undo 불가

        const historyEntry = tab.history[tab.historyPointer]
        if (!historyEntry?.inversePatches) return // 유효하지 않은 히스토리

        // applyPatches 는 draft 외부에서 호출 필요
        const currentState = get().tabs[tabId]
        console.log(currentState)
        const prevState = applyPatches(currentState, historyEntry.inversePatches)

        // 상태 업데이트 및 포인터 이동
        state.tabs[tabId] = {
          ...prevState, // 패치 적용된 이전 상태
          history: tab.history,
          historyPointer: tab.historyPointer - 1,
          // Occupied Set 수동 복구 (applyPatches 가 Set 변경 완벽히 처리 못할 수 있음)
          occupied: new Set(prevState.occupied || [])
        }
      })
    )
  },

  redo: (tabId) => {
    set(
      produce((state) => {
        const tab = state.tabs[tabId]
        const nextPointer = tab.historyPointer + 1
        if (!tab || nextPointer >= tab.history.length) return // Redo 불가

        const historyEntry = tab.history[nextPointer]
        if (!historyEntry?.patches) return // 유효하지 않은 히스토리

        // applyPatches 는 draft 외부에서 호출 필요
        const currentState = get().tabs[tabId]
        const nextState = applyPatches(currentState, historyEntry.patches)

        // 상태 업데이트 및 포인터 이동
        state.tabs[tabId] = {
          ...nextState, // 패치 적용된 다음 상태
          history: tab.history,
          historyPointer: nextPointer,
          // Occupied Set 수동 복구
          occupied: new Set(nextState.occupied || [])
        }
      })
    )
  },

  // --- 줌 레벨 액션 ---
  setZoomLevel: (tabId, zoomLevel) =>
    set(
      produce((state) => {
        if (state.tabs[tabId]) {
          state.tabs[tabId].zoomLevel = zoomLevel
        }
      })
    )
}))
