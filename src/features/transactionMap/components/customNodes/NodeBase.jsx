import React, { useCallback } from 'react'
import { Handle, Position, useReactFlow } from 'reactflow'

import ExpandIncomingImg from '@shared/assets/images/hover-expand-incoming.png'
import WBDetailImg from '@shared/assets/images/hover-wb-detail.png'
import ExpandOutgoingImg from '@shared/assets/images/hover-expand-outgoing.png'

import { useMapStore } from '@features/transactionMap/stores/useMapStore'
import { useUIStore } from '@features/transactionMap/stores/useUIStore'
import { useSearchStore } from '@features/transactionMap/stores/useSearchStore'
import { useExpandGraph } from '@features/transactionMap/hooks/useExpandGraph'

/**
 * 모든 노드의 기본 레이아웃 및 공통 기능을 제공하는 컴포넌트.
 * 확장, 삭제, 상세 보기 기능을 처리합니다.
 * @param {string} id - React Flow 노드 ID
 * @param {object} data - 노드 데이터 (address, mainNet, isMain 등 포함)
 * @param {React.ReactNode} children - 노드 내부에 표시될 내용
 * @param {Position} [position=Position.Right] - 소스 핸들 위치
 * @param {boolean} [isAddressNode=true] - 주소 노드인지 여부 (확장 버튼 표시 결정)
 */
export const NodeBase = ({
  id,
  data,
  children,
  position = Position.Right,
  isAddressNode = true
}) => {
  const activeTab = useMapStore((state) => state.activeTab)
  const removeNodesRecursively = useMapStore((state) => state.removeNodesRecursively)
  const toggleSidePanel = useUIStore((state) => state.toggleSidePanel)
  const selectedNet = useSearchStore((state) => state.selectedNet || 'BTC')
  const count = useSearchStore((state) => state.count)
  const startTime = useSearchStore((state) => state.startTime)
  const endTime = useSearchStore((state) => state.endTime)

  const { getNode } = useReactFlow()

  const currentNet = data?.mainNet || selectedNet
  const { expandGraph, isLoading, isError, error } = useExpandGraph(currentNet)

  // 노드 확장 처리 함수
  const handleExpand = useCallback(
    async (dirType) => {
      const fullCurrentNode = getNode(data.address)
      if (!expandGraph || !fullCurrentNode || !activeTab) {
        console.warn('[handleExpand] expandGraph, node data, or activeTab is missing.')
        return
      }

      const queryDir = dirType === 'incoming' ? 'LEFT' : 'RIGHT'
      const queryParams = { count: count || 10, startTime, endTime, direction: queryDir, page: 0 }

      expandGraph({
        tabId: activeTab,
        currentNode: fullCurrentNode,
        queryParams
      })
    },
    [getNode, data.address, expandGraph, activeTab, count, startTime, endTime]
  )

  const handleExpandIncoming = useCallback(() => handleExpand('incoming'), [handleExpand])
  const handleExpandOutgoing = useCallback(() => handleExpand('outgoing'), [handleExpand])

  // 노드 삭제 처리 함수
  const handleDelete = useCallback(() => {
    if (!activeTab || !id) return
    removeNodesRecursively(activeTab, id)
  }, [activeTab, id, removeNodesRecursively]) // 의존성 배열 업데이트

  // 노드 상세 정보 패널 열기 함수
  const handleNodeDetail = useCallback(() => {
    const detailType = isAddressNode ? 'AddressDetail' : 'TransactionDetail'
    const detailTargetId = isAddressNode ? data?.address : id
    const detailTargetNet = data?.mainNet || currentNet

    if (detailTargetId && detailTargetNet) {
      toggleSidePanel(true, detailType, { id: detailTargetId, mainNet: detailTargetNet })
    } else {
      console.warn('[handleNodeDetail] Missing target ID or mainNet for details panel.')
    }
  }, [data, id, toggleSidePanel, isAddressNode, currentNet])

  return (
    <div className={`relative group ${isLoading ? 'opacity-70 pointer-events-none' : ''}`}>
      <Handle type='source' position={position} className='!bg-teal-500' />
      <Handle type='target' position={Position.Left} className='!bg-blue-500' />

      {!data?.isMain && (
        <button
          className='absolute top-[-8px] right-[-8px] bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs z-20 opacity-0 group-hover:opacity-100 transition-opacity'
          onClick={handleDelete}
          title='노드 및 하위 노드 삭제'
          aria-label='노드 및 하위 노드 삭제'
        >
          ×
        </button>
      )}
      <div className='text-field text-center text-sm' id={`text-field-${id}`}>
        {children}
      </div>

      {/* 호버 버튼 영역 */}
      <div className='hidden group-hover:flex absolute bottom-[-20px] left-1/2 transform -translate-x-1/2 bg-gray-200 rounded px-1 h-5 items-center justify-center gap-2 z-10'>
        {isAddressNode && (
          <button
            onClick={handleExpandIncoming}
            disabled={isLoading}
            title='왼쪽으로 확장 (Incoming)'
          >
            <img className='cursor-pointer w-4 h-4' alt='Incoming 확장' src={ExpandIncomingImg} />
          </button>
        )}
        <button onClick={handleNodeDetail} title='상세 정보 보기'>
          <img className='cursor-pointer w-4 h-4' alt='상세 정보' src={WBDetailImg} />
        </button>
        {isAddressNode && (
          <button
            onClick={handleExpandOutgoing}
            disabled={isLoading}
            title='오른쪽으로 확장 (Outgoing)'
          >
            <img className='cursor-pointer w-4 h-4' alt='Outgoing 확장' src={ExpandOutgoingImg} />
          </button>
        )}
      </div>
    </div>
  )
}
